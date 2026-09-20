-- Functions, views and triggers.
--
-- Everything here is `security definer` with an empty `search_path`, which is
-- what lets these read tables no client can: a distance without a coordinate, a
-- verification status without the submissions, a block check without the block
-- list. Each one is schema-qualified for the same reason.

-- ---------------------------------------------------------------------------
-- Small shared helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
  language plpgsql
  as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Reads a tunable out of `app_config`, falling back when the key is missing so a
-- forgotten seed row degrades to a sensible number instead of a null.
create function public.config_int(config_key text, fallback integer) returns integer
  language sql stable security definer set search_path = ''
  as $$
  select coalesce((select (value #>> '{}')::integer from public.app_config where key = config_key), fallback)
$$;

-- ---------------------------------------------------------------------------
-- Verification
--
-- A profile's status is the latest submission, not a stored column: no row is
-- `none`, a latest row with no outcome yet is `pending`, otherwise the outcome.
-- An earlier draft mirrored this onto `profiles` on the argument that clients
-- cannot read the submissions — which was wrong, because a definer function can.
-- ---------------------------------------------------------------------------

create function public.verification_status_of(uid uuid) returns public.verification_status
  language sql stable security definer set search_path = ''
  as $$
  select coalesce(
    (select coalesce(s.outcome, 'pending')
     from public.verification_submissions s
     where s.profile_id = uid
     order by s.submitted_at desc
     limit 1),
    'none')
$$;

-- Stamps `reviewed_at` whenever a decision is made or changed. The only
-- automation in the review path; everything else is a person in Studio.
create function public.stamp_verification_review() returns trigger
  language plpgsql
  as $$
begin
  if new.outcome is distinct from old.outcome then
    new.reviewed_at = case when new.outcome is null then null else now() end;
  end if;
  return new;
end;
$$;

create trigger verification_submissions_reviewed_at
  before update on public.verification_submissions
  for each row execute function public.stamp_verification_review();

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------

-- Symmetric on purpose: both sides simply stop existing for each other.
create function public.is_blocked(a uuid, b uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a))
$$;

-- Blocking declines whatever was pending between the two, in either direction.
-- It deliberately does *not* un-seat anyone from a plan they are already in:
-- silently removing someone, possibly the host, is a bigger surprise than the
-- block was, and the leave screen already exists for that.
create function public.decline_requests_on_block() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  update public.join_requests r
  set status = 'declined', resolved_at = now()
  from public.plans p
  where r.plan_id = p.id
    and r.status = 'pending'
    and (
      (r.profile_id = new.blocker_id and p.host_id = new.blocked_id) or
      (r.profile_id = new.blocked_id and p.host_id = new.blocker_id)
    );
  return new;
end;
$$;

create trigger blocks_decline_pending_requests
  after insert on public.blocks
  for each row execute function public.decline_requests_on_block();

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------

create function public.has_plus(uid uuid default auth.uid()) returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select exists (
    select 1 from public.entitlements
    where profile_id = uid
      and entitlement_id = 'plus'
      and status in ('active', 'in_trial', 'in_grace')
      and (current_period_end is null or current_period_end > now()))
$$;

-- ---------------------------------------------------------------------------
-- What other users read
--
-- `security_invoker = false`, so this runs as the owner and can see rows the
-- caller's policy on `profiles` hides. That is the whole point: the base table
-- is locked to its owner and everyone else reads this, which is how `birthdate`
-- becomes an age and never a date, and how the home point stays unreachable.
-- ---------------------------------------------------------------------------

create view public.public_profiles
  with (security_invoker = false) as
  select p.id,
         p.name,
         extract(year from age(p.birthdate))::int as age,
         p.avatar_storage_path,
         p.pronouns,
         p.gender,
         p.bio,
         p.neighbourhood,
         p.country_code,
         p.created_at as joined_at,
         public.verification_status_of(p.id) = 'verified' as verified
  from public.profiles p
  where p.deleted_at is null
    and not public.is_blocked((select auth.uid()), p.id);

-- Everything the conversations list renders is derived here rather than stored:
-- title, avatars, preview, timestamp and unread count all go stale the moment
-- they are written down. `online` and `onlineCount` are absent on purpose —
-- they come from Realtime presence, and a stored boolean is wrong within seconds
-- of a connection dropping.
create view public.conversation_list
  with (security_invoker = false) as
  with viewer as (select (select auth.uid()) as id),
  mine as (
    select c.id, c.plan_id, m.last_read_at
    from public.conversations c
    join public.conversation_members m on m.conversation_id = c.id
    join viewer v on v.id = m.profile_id
  ),
  newest as (
    select distinct on (msg.conversation_id)
           msg.conversation_id, msg.content, msg.created_at
    from public.messages msg
    join mine on mine.id = msg.conversation_id
    order by msg.conversation_id, msg.created_at desc
  ),
  others as (
    select m.conversation_id,
           jsonb_agg(jsonb_build_object(
             'id', pp.id, 'name', pp.name, 'avatarStoragePath', pp.avatar_storage_path
           ) order by pp.name) as people,
           count(*) as other_count
    from public.conversation_members m
    join mine on mine.id = m.conversation_id
    join public.public_profiles pp on pp.id = m.profile_id
    join viewer v on v.id <> m.profile_id
    group by m.conversation_id
  )
  select mine.id,
         case when mine.plan_id is null then 'direct' else 'group' end as kind,
         coalesce(pl.title, others.people -> 0 ->> 'name', '') as title,
         mine.plan_id,
         coalesce(others.people, '[]'::jsonb) as members,
         coalesce(others.other_count, 0) + 1 as member_count,
         newest.content as preview,
         newest.created_at as last_message_at,
         (select count(*) from public.messages msg
          where msg.conversation_id = mine.id
            and msg.created_at > mine.last_read_at
            and msg.author_id <> (select auth.uid())) as unread_count
  from mine
  left join newest on newest.conversation_id = mine.id
  left join others on others.conversation_id = mine.id
  left join public.plans pl on pl.id = mine.plan_id;

-- ---------------------------------------------------------------------------
-- Seats
-- ---------------------------------------------------------------------------

-- Seat the host the moment a plan is created, so seat maths is consistent from
-- the first read. Skipped for a standing meetup, which has no host to seat.
create function public.seat_plan_host() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if new.host_id is not null then
    insert into public.plan_participants (plan_id, profile_id, is_host)
    values (new.id, new.host_id, true);
  end if;
  return new;
end;
$$;

create trigger plans_seat_host after insert on public.plans
  for each row execute function public.seat_plan_host();

-- Nothing else stops a full plan being over-seated. The race is not theoretical:
-- a host tapping Accept on two requests in quick succession is exactly the
-- concurrency case already handled on the client, and until now the database had
-- no equivalent guard. `for update` on the plan row serialises the count.
create function public.enforce_plan_seats() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  total smallint;
  taken integer;
begin
  select seats into total from public.plans where id = new.plan_id for update;

  -- Null seats is an uncapped event, which is a different shape of plan rather
  -- than a large number: there is nothing to count against.
  if total is null then
    return new;
  end if;

  select count(*) into taken
  from public.plan_participants
  where plan_id = new.plan_id and left_at is null;

  if taken >= total then
    raise exception 'PLAN_FULL' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger plan_participants_enforce_seats
  before insert on public.plan_participants
  for each row execute function public.enforce_plan_seats();

-- ---------------------------------------------------------------------------
-- Interests
-- ---------------------------------------------------------------------------

-- A check constraint cannot count rows, so the cap is a trigger, reading the
-- number from `app_config` like the other tunables. The client stops at the same
-- limit and shows "7/10", so nobody meets this as a database error.
create function public.enforce_interest_cap() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  cap integer := public.config_int('max_interests', 10);
begin
  if (select count(*) from public.profile_interests where profile_id = new.profile_id) >= cap then
    raise exception 'TOO_MANY_INTERESTS' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profile_interests_enforce_cap
  before insert on public.profile_interests
  for each row execute function public.enforce_interest_cap();

-- ---------------------------------------------------------------------------
-- Requests: the block gate and the free-tier quota
-- ---------------------------------------------------------------------------

create function public.enforce_request_rules() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  plan_host uuid;
  window_days integer := public.config_int('free_request_window_days', 7);
  request_limit integer := public.config_int('free_request_limit', 3);
  used integer;
begin
  select host_id into plan_host from public.plans where id = new.plan_id;

  if plan_host is not null and public.is_blocked(new.profile_id, plan_host) then
    raise exception 'BLOCKED' using errcode = 'insufficient_privilege';
  end if;

  -- Only `approval` plans create a request; joining an open plan seats the
  -- person directly. A free user therefore gets three approval requests a week
  -- *plus* unlimited open joins, which favours open plans — a decision, not an
  -- accident. See docs/database.md §3.5, open question 9.
  if public.has_plus(new.profile_id) then
    return new;
  end if;

  select count(*) into used
  from public.join_requests
  where profile_id = new.profile_id
    and created_at > now() - make_interval(days => window_days);

  if used >= request_limit then
    raise exception 'NO_CREDITS' using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger join_requests_enforce_rules
  before insert on public.join_requests
  for each row execute function public.enforce_request_rules();

-- Accepting a request seats the applicant in the same transaction, so the host
-- sheet cannot show an accepted request that never became a seat.
create function public.seat_accepted_request() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    new.resolved_at = now();
    insert into public.plan_participants (plan_id, profile_id)
    values (new.plan_id, new.profile_id)
    on conflict (plan_id, profile_id) do update set left_at = null;
  elsif new.status = 'declined' and old.status is distinct from 'declined' then
    new.resolved_at = now();
  end if;
  return new;
end;
$$;

create trigger join_requests_seat_on_accept
  before update on public.join_requests
  for each row execute function public.seat_accepted_request();

-- ---------------------------------------------------------------------------
-- Legal documents are append-only
--
-- Enforced by trigger rather than policy because `service_role` bypasses RLS but
-- not triggers: even our own admin tooling cannot quietly rewrite a published
-- document, which is the whole reason the accepted text is stored as a row.
-- ---------------------------------------------------------------------------

create function public.reject_legal_mutation() returns trigger
  language plpgsql
  as $$
begin
  raise exception 'LEGAL_DOCUMENTS_ARE_APPEND_ONLY' using errcode = 'insufficient_privilege';
end;
$$;

create trigger legal_documents_immutable
  before update or delete on public.legal_documents
  for each row execute function public.reject_legal_mutation();

-- The newest effective document of a kind, falling back to pt-BR while it is the
-- only locale that exists.
create function public.current_legal_document(doc_kind public.legal_doc_kind, want_locale text default 'pt-BR')
  returns public.legal_documents
  language sql stable security definer set search_path = ''
  as $$
  select d.*
  from public.legal_documents d
  where d.kind = doc_kind
    and d.effective_at <= now()
    and d.locale in (want_locale, 'pt-BR')
  order by (d.locale = want_locale) desc, d.effective_at desc
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- Distance
--
-- Both of these take a coordinate and return a number about it. Neither ever
-- returns the coordinate, which is what lets `profile_locations` stay unreadable.
-- ---------------------------------------------------------------------------

create function public.distance_to(place uuid) returns double precision
  language sql stable security definer set search_path = ''
  as $$
  select extensions.st_distance(l.point, pl.point)
  from public.profile_locations l, public.places pl
  where l.profile_id = (select auth.uid()) and pl.id = place
$$;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger preferences_updated_at before update on public.preferences
  for each row execute function public.set_updated_at();
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger profile_locations_updated_at before update on public.profile_locations
  for each row execute function public.set_updated_at();
create trigger entitlements_updated_at before update on public.entitlements
  for each row execute function public.set_updated_at();
create trigger app_config_updated_at before update on public.app_config
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New accounts
--
-- A profile row exists from the moment an account does, including an anonymous
-- one, so every later step is an update rather than an upsert that has to guess.
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.preferences (profile_id) values (new.id) on conflict (profile_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
