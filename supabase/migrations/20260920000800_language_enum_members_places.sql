-- Three changes that came out of asking whether the schema was as small as it
-- could be: a type for language codes, one table for everyone who has anything
-- to do with a plan, and a column that lets a place come from a maps provider.

-- ---------------------------------------------------------------------------
-- language_code
--
-- The arrays that replaced the language tables could hold any string, and an
-- array cannot carry a foreign key. An enum can: it is the set of languages the
-- app has a flag and a name for — `SPOKEN_LANGUAGES` in
-- `src/shared/lib/languages.ts` — and the database now refuses anything the
-- client could not render. Adding one is `alter type … add value`, which has
-- to ship with the app update that adds the flag anyway.
--
-- An enum rather than a table because nothing else needs to read the names.
-- The day an admin screen or a report does, the table earns its place and the
-- enum becomes its primary key.
-- ---------------------------------------------------------------------------

create type public.language_code as enum (
  'ar', 'da', 'de', 'el', 'en', 'es', 'fr', 'he', 'hi', 'it',
  'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'tr', 'uk', 'zh'
);

-- Enum values are already canonical, so the case-folding check is replaced by
-- a plain one. Polymorphic, so `interests` could use it too if it ever wanted
-- to stop folding.
create function private.unique_elements(items anyarray) returns boolean
  language sql immutable
  as $$ select cardinality(items) = (select count(distinct x) from unnest(items) x) $$;

-- A column a view selects cannot change type underneath it, so both views go
-- and come back around the change. Their read-only triggers and grants come
-- back with them — a recreated view is a new object, and gets Supabase's
-- default DML grants all over again (see `20260920000700`).
drop view public.conversation_list;
drop view public.public_profiles;

alter table public.profiles
  drop constraint languages_folded_unique,
  alter column languages drop default,
  alter column languages type public.language_code[] using languages::public.language_code[],
  alter column languages set default '{}',
  add constraint languages_unique check (private.unique_elements(languages));

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
         private.verification_status_of(p.id) = 'verified' as verified,
         p.interests,
         p.languages
  from public.profiles p
  where p.deleted_at is null
    and p.onboarding_completed_at is not null
    and not private.is_blocked((select auth.uid()), p.id);

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

revoke all on public.public_profiles from anon, authenticated;
revoke all on public.conversation_list from anon, authenticated;
grant select on public.public_profiles to authenticated;
grant select on public.conversation_list to authenticated;

create trigger public_profiles_read_only
  instead of insert or update or delete on public.public_profiles
  for each row execute function private.reject_view_write();
create trigger conversation_list_read_only
  instead of insert or update or delete on public.conversation_list
  for each row execute function private.reject_view_write();

alter table public.plans
  drop constraint plan_languages_folded_unique,
  alter column languages drop default,
  alter column languages type public.language_code[] using languages::public.language_code[],
  alter column languages set default '{}',
  add constraint plan_languages_unique check (private.unique_elements(languages));

alter table public.plan_series
  drop constraint series_languages_folded_unique,
  alter column languages drop default,
  alter column languages type public.language_code[] using languages::public.language_code[],
  alter column languages set default '{}',
  add constraint series_languages_unique check (private.unique_elements(languages));

-- ---------------------------------------------------------------------------
-- places.provider_place_id
--
-- Google Places (or Apple, or Mapbox) will supply the search, but it cannot
-- supply the row: a plan needs something stable to reference, five plans at the
-- same café share one place, and the radius query needs the coordinate inside
-- Postgres where the index is. The provider's own id is the one field its terms
-- let us keep indefinitely, so a place picked from a search is upserted by it.
-- Null for a place someone added by hand.
-- ---------------------------------------------------------------------------

alter table public.places add column provider_place_id text unique;

comment on column public.places.provider_place_id is
  'The maps provider''s id for this place, so a search result maps onto one row. Null for a hand-added place.';

-- ---------------------------------------------------------------------------
-- plan_members
--
-- A person's relationship to a plan was spread over two tables — `join_requests`
-- (asked, pending, declined) and `plan_participants` (seated, left) — with a
-- trigger copying a row from one to the other when the host tapped Accept. One
-- table with a status tells the whole story in one row: accepting is an update,
-- the waitlist is the `requested` rows in order, the seats check counts
-- `seated`, and the free quota counts `requested`.
--
-- What a client may write is decided by column grants, not by a trigger
-- guessing who called: a client can insert its own row with a status and a
-- message, can change the status and its own note, and nothing else. `is_host`, `outcome`
-- and the timestamps are set by the triggers and the jobs, which run as the
-- owner.
-- ---------------------------------------------------------------------------

create type public.member_status as enum ('requested', 'declined', 'seated', 'left');

create table public.plan_members (
  plan_id     uuid not null references public.plans (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  status      public.member_status not null,
  is_host     boolean not null default false,
  -- The applicant's note to the host, quoted on the request row.
  message     text check (char_length(message) <= 300),
  -- First contact — the request, or the open join. The weekly quota counts this.
  created_at  timestamptz not null default now(),
  seated_at   timestamptz,
  -- Leaving stamps this and keeps the row: it is the fact attendance is
  -- derived from.
  left_at     timestamptz,
  updated_at  timestamptz not null default now(),
  -- How the evening went, filled in by `close_stale_plans()` once it has.
  outcome     public.attendance_outcome,
  recorded_at timestamptz,
  primary key (plan_id, profile_id),
  constraint host_is_seated check (not is_host or status = 'seated'),
  constraint seated_has_time check (status not in ('seated', 'left') or seated_at is not null),
  constraint left_has_time check ((status = 'left') = (left_at is not null))
);

create index plan_members_profile_idx on public.plan_members (profile_id, created_at desc);
create index plan_members_queue_idx on public.plan_members (plan_id, created_at) where status = 'requested';

-- Seats first, then requests. An accepted request is already a seat, so it
-- lands on the conflict and is skipped.
insert into public.plan_members
  (plan_id, profile_id, status, is_host, created_at, seated_at, left_at, outcome, recorded_at)
select plan_id, profile_id,
       case when left_at is null then 'seated' else 'left' end::public.member_status,
       is_host, joined_at, joined_at, left_at, outcome, recorded_at
from public.plan_participants;

insert into public.plan_members (plan_id, profile_id, status, message, created_at, updated_at)
select plan_id, profile_id,
       case status when 'pending' then 'requested' else 'declined' end::public.member_status,
       message, created_at, coalesce(resolved_at, created_at)
from public.join_requests
where status <> 'accepted'
on conflict (plan_id, profile_id) do nothing;

alter table public.plan_members enable row level security;

-- Column grants. `authenticated` may put its own row in with a status and a
-- message, change the status, take a pending request back out, and read what
-- the policies allow. Everything else on the row belongs to the owner.
revoke all on public.plan_members from anon, authenticated;
grant select on public.plan_members to authenticated;
grant insert (plan_id, profile_id, status, message) on public.plan_members to authenticated;
grant update (status, message) on public.plan_members to authenticated;
grant delete on public.plan_members to authenticated;

-- A seat is public, minus blocks. A request, a decline or a departure is the
-- business of the person and the host and nobody else.
create policy "seats are readable when signed in"
  on public.plan_members for select to authenticated using (
    (status = 'seated' and not private.is_blocked((select auth.uid()), profile_id))
    or profile_id = (select auth.uid())
    or exists (select 1 from public.plans p where p.id = plan_id and p.host_id = (select auth.uid()))
  );

create policy "own membership is insertable"
  on public.plan_members for insert to authenticated
  with check (profile_id = (select auth.uid()));

-- The person moves their own row (leave, ask again); the host moves the rows on
-- their plan (accept, decline). Which transitions each may make is the trigger's.
create policy "membership is updatable by the person or the host"
  on public.plan_members for update to authenticated using (
    profile_id = (select auth.uid())
    or exists (select 1 from public.plans p where p.id = plan_id and p.host_id = (select auth.uid()))
  );

create policy "own request is withdrawable"
  on public.plan_members for delete to authenticated
  using (profile_id = (select auth.uid()) and status = 'requested');

-- ---------------------------------------------------------------------------
-- The rules, as two triggers
-- ---------------------------------------------------------------------------

-- Everything an insert has to satisfy. Both entry points come through here: a
-- request on an approval plan, or a direct seat on an open one.
create function private.admit_member() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  plan public.plans%rowtype;
  window_days integer := private.config_int('free_request_window_days', 7);
  request_limit integer := private.config_int('free_request_limit', 3);
  used integer;
  taken integer;
begin
  select * into plan from public.plans where id = new.plan_id for update;

  new.updated_at = now();

  if new.is_host then
    -- Only `seat_plan_host()` sets this, and it runs as the owner.
    new.status = 'seated';
    new.seated_at = coalesce(new.seated_at, now());
    return new;
  end if;

  if plan.host_id is not null and private.is_blocked(new.profile_id, plan.host_id) then
    raise exception 'BLOCKED' using errcode = 'insufficient_privilege';
  end if;

  if new.status = 'requested' then
    if plan.join_mode <> 'approval' then
      raise exception 'PLAN_IS_OPEN' using errcode = 'check_violation';
    end if;

    -- Only an approval plan creates a request, so a free account gets three
    -- requests a week plus unlimited open joins. A decision, not an accident —
    -- see docs/database.md §3.5, open question 9.
    if not private.has_plus(new.profile_id) then
      select count(*) into used
      from public.plan_members
      where profile_id = new.profile_id
        and status <> 'seated'
        and created_at > now() - make_interval(days => window_days);
      if used >= request_limit then
        raise exception 'NO_CREDITS' using errcode = 'insufficient_privilege';
      end if;
    end if;

    return new;
  end if;

  if new.status = 'seated' then
    if plan.join_mode <> 'open' then
      raise exception 'PLAN_NEEDS_APPROVAL' using errcode = 'check_violation';
    end if;

    if plan.seats is not null then
      select count(*) into taken from public.plan_members
      where plan_id = new.plan_id and status = 'seated';
      if taken >= plan.seats then
        raise exception 'PLAN_FULL' using errcode = 'check_violation';
      end if;
    end if;

    new.seated_at = now();
    return new;
  end if;

  raise exception 'BAD_TRANSITION' using errcode = 'check_violation';
end;
$$;

create trigger plan_members_admit
  before insert on public.plan_members
  for each row execute function private.admit_member();

-- Every status change, and who may make it. Policies decide whose rows a caller
-- may touch; this decides what they may turn them into.
--
-- Telling an API call from a job is not `current_user`: inside a definer
-- function that is always the owner. A request from the API always carries a
-- JWT, so `auth.uid()` is null only for the scheduler. The one server-side
-- write that happens *during* an API call — the block trigger declining what
-- was pending — marks the transaction trusted before it updates.
create function private.move_member() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  plan public.plans%rowtype;
  actor uuid := (select auth.uid());
  from_api boolean := actor is not null
    and coalesce(current_setting('treff.trusted', true), '') <> 'on';
  taken integer;
begin
  new.updated_at = now();

  -- The note to the host is the requester's own words; the host may read it,
  -- not rewrite it.
  if from_api and new.message is distinct from old.message and actor is distinct from new.profile_id then
    raise exception 'NOT_THE_MEMBER' using errcode = 'insufficient_privilege';
  end if;

  if new.status = old.status then
    return new;
  end if;

  select * into plan from public.plans where id = new.plan_id for update;

  -- The host answers a request.
  if old.status = 'requested' and new.status in ('seated', 'declined') then
    if from_api and actor is distinct from plan.host_id then
      raise exception 'NOT_THE_HOST' using errcode = 'insufficient_privilege';
    end if;
    if new.status = 'seated' then
      if plan.seats is not null then
        select count(*) into taken from public.plan_members
        where plan_id = new.plan_id and status = 'seated';
        if taken >= plan.seats then
          raise exception 'PLAN_FULL' using errcode = 'check_violation';
        end if;
      end if;
      new.seated_at = now();
    end if;
    return new;
  end if;

  -- The person leaves.
  if old.status = 'seated' and new.status = 'left' then
    if from_api and actor is distinct from new.profile_id then
      raise exception 'NOT_THE_MEMBER' using errcode = 'insufficient_privilege';
    end if;
    if old.is_host then
      raise exception 'HOST_CANNOT_LEAVE' using errcode = 'check_violation';
    end if;
    new.left_at = now();
    return new;
  end if;

  -- The person comes back: asks again after leaving or being declined, or
  -- rejoins an open plan. Same rules as a fresh row.
  if old.status in ('left', 'declined') and new.status in ('requested', 'seated') then
    if from_api and actor is distinct from new.profile_id then
      raise exception 'NOT_THE_MEMBER' using errcode = 'insufficient_privilege';
    end if;
    if plan.host_id is not null and private.is_blocked(new.profile_id, plan.host_id) then
      raise exception 'BLOCKED' using errcode = 'insufficient_privilege';
    end if;
    if new.status = 'requested' and plan.join_mode <> 'approval' then
      raise exception 'PLAN_IS_OPEN' using errcode = 'check_violation';
    end if;
    if new.status = 'seated' then
      if plan.join_mode <> 'open' then
        raise exception 'PLAN_NEEDS_APPROVAL' using errcode = 'check_violation';
      end if;
      if plan.seats is not null then
        select count(*) into taken from public.plan_members
        where plan_id = new.plan_id and status = 'seated';
        if taken >= plan.seats then
          raise exception 'PLAN_FULL' using errcode = 'check_violation';
        end if;
      end if;
      new.seated_at = now();
    end if;
    new.left_at = null;
    new.created_at = now();
    return new;
  end if;

  raise exception 'BAD_TRANSITION' using errcode = 'check_violation';
end;
$$;

create trigger plan_members_move
  before update on public.plan_members
  for each row execute function private.move_member();

-- ---------------------------------------------------------------------------
-- Everything that read the two old tables
-- ---------------------------------------------------------------------------

create or replace function private.seat_plan_host() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if new.host_id is not null then
    insert into public.plan_members (plan_id, profile_id, status, is_host, seated_at)
    values (new.id, new.host_id, 'seated', true, now());
  end if;
  return new;
end;
$$;

create or replace function private.decline_requests_on_block() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  -- A decline is normally the host's move; this one is the block's. Mark the
  -- transaction so `move_member()` lets it through.
  perform set_config('treff.trusted', 'on', true);
  update public.plan_members m
  set status = 'declined'
  from public.plans p
  where m.plan_id = p.id
    and m.status = 'requested'
    and (
      (m.profile_id = new.blocker_id and p.host_id = new.blocked_id) or
      (m.profile_id = new.blocked_id and p.host_id = new.blocker_id)
    );
  return new;
end;
$$;

create or replace function public.attendance_rate_of(uid uuid) returns integer
  language sql stable security definer set search_path = ''
  as $$
  select case when count(*) = 0 then null
              else round(100.0 * count(*) filter (where outcome = 'attended') / count(*))::integer end
  from public.plan_members where profile_id = uid and outcome is not null
$$;

create or replace function private.close_stale_plans() returns integer
  language sql security definer set search_path = ''
  as $$
  with closed as (
    update public.plan_members m
    set outcome = case when m.status = 'seated' then 'attended' else 'cancelled' end::public.attendance_outcome,
        recorded_at = now()
    from public.plans p
    where p.id = m.plan_id
      and m.status in ('seated', 'left')
      and m.outcome is null
      and p.cancelled_at is null
      and p.host_id is not null
      and p.seats is not null
      and p.starts_at + make_interval(mins => coalesce(p.duration_minutes, 120)) < now()
    returning 1
  )
  select count(*)::integer from closed
$$;

create or replace function public.export_my_data() returns jsonb
  language sql stable security definer set search_path = ''
  as $$
  select jsonb_build_object(
    'exportedAt', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = (select auth.uid())),
    'plans', (select coalesce(jsonb_agg(to_jsonb(pl)), '[]'::jsonb)
              from public.plans pl where pl.host_id = (select auth.uid())),
    'membership', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
                   from public.plan_members m where m.profile_id = (select auth.uid())),
    'messages', (select coalesce(jsonb_agg(to_jsonb(msg)), '[]'::jsonb)
                 from public.messages msg where msg.author_id = (select auth.uid())),
    'blocks', (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
               from public.blocks b where b.blocker_id = (select auth.uid())),
    'legalAcceptances', (select coalesce(jsonb_agg(to_jsonb(la)), '[]'::jsonb)
                         from public.legal_acceptances la where la.profile_id = (select auth.uid()))
  )
$$;

-- Same signature and the same `text[]` for languages, so the client does not
-- notice the enum; membership and the two lists now come from one table.
create or replace function public.nearby_plans(
  want_language text default null,
  want_age_min integer default null,
  want_age_max integer default null,
  verified_hosts_only boolean default false
)
returns table (
  id uuid,
  title text,
  starts_at timestamptz,
  duration_minutes int,
  seats smallint,
  join_mode public.join_mode,
  series_id uuid,
  age_min smallint,
  age_max smallint,
  distance_m double precision,
  membership text,
  place jsonb,
  host jsonb,
  languages text[],
  participants jsonb,
  requests jsonb
)
language sql stable security definer set search_path = ''
as $$
  with viewer as (
    select (select auth.uid()) as id,
           private.has_plus((select auth.uid())) as plus
  ),
  home as (
    select l.point from public.profile_locations l, viewer where l.profile_id = viewer.id
  ),
  bounds as (
    select
      case when p.distance_unit = 'mi'
           then least(p.radius, case when viewer.plus then p.radius
                                     else private.config_int('free_radius_max_mi', 3) end) * 1609.34
           else p.radius * 1000 end as metres
    from public.profiles p, viewer where p.id = viewer.id
  )
  select
    pl.id,
    pl.title,
    pl.starts_at,
    pl.duration_minutes,
    pl.seats,
    pl.join_mode,
    pl.series_id,
    pl.age_min,
    pl.age_max,
    extensions.st_distance((select point from home), pc.point) as distance_m,
    case
      when pl.host_id = viewer.id then 'host'
      else coalesce(
        (select case m.status when 'seated' then 'joined' when 'requested' then 'requested' end
         from public.plan_members m
         where m.plan_id = pl.id and m.profile_id = viewer.id),
        'guest')
    end as membership,
    jsonb_build_object(
      'id', pc.id, 'name', pc.name, 'address', pc.address,
      'distanceM', extensions.st_distance((select point from home), pc.point)
    ) as place,
    (select to_jsonb(hp) from public.public_profiles hp where hp.id = pl.host_id) as host,
    pl.languages::text[],
    coalesce(
      (select jsonb_agg(jsonb_build_object('profile', to_jsonb(sp), 'isHost', m.is_host)
                        order by m.is_host desc, m.seated_at)
       from public.plan_members m
       join public.public_profiles sp on sp.id = m.profile_id
       where m.plan_id = pl.id and m.status = 'seated'),
      '[]'::jsonb) as participants,
    case when pl.host_id = viewer.id then coalesce(
      (select jsonb_agg(jsonb_build_object(
                'id', q.profile_id, 'profile', q.profile, 'message', q.message,
                'createdAt', q.created_at, 'position', q.position)
              order by q.created_at)
       from (
         select m.profile_id, to_jsonb(rp) as profile, m.message, m.created_at,
                row_number() over (order by m.created_at) as position
         from public.plan_members m
         join public.public_profiles rp on rp.id = m.profile_id
         where m.plan_id = pl.id and m.status = 'requested'
       ) q),
      '[]'::jsonb) else '[]'::jsonb end as requests
  from public.plans pl
  join public.places pc on pc.id = pl.place_id
  cross join viewer
  where pl.cancelled_at is null
    and pl.starts_at > now() - interval '3 hours'
    and (pl.host_id is null or not private.is_blocked(viewer.id, pl.host_id))
    and (
      (select point from home) is null
      or extensions.st_dwithin((select point from home), pc.point, (select metres from bounds))
    )
    and (not viewer.plus or want_language is null or want_language = any (pl.languages::text[]))
    and (not viewer.plus or want_age_min is null or pl.age_min is null or pl.age_min >= want_age_min)
    and (not viewer.plus or want_age_max is null or pl.age_max is null or pl.age_max <= want_age_max)
    and (not viewer.plus or not verified_hosts_only or pl.host_id is null
         or private.verification_status_of(pl.host_id) = 'verified')
  order by pl.starts_at
$$;

-- ---------------------------------------------------------------------------
-- The two old tables, and the three triggers that policed them
-- ---------------------------------------------------------------------------

drop trigger plan_participants_enforce_seats on public.plan_participants;
drop trigger join_requests_enforce_rules on public.join_requests;
drop trigger join_requests_seat_on_accept on public.join_requests;
drop function private.enforce_plan_seats();
drop function private.enforce_request_rules();
drop function private.seat_accepted_request();

drop table public.join_requests;
drop table public.plan_participants;
drop type public.request_status;

-- The two array-check helpers are pure and touch no table, but a function with
-- no pinned search_path is still resolved against whatever the caller has set.
alter function private.folded_unique(text[]) set search_path = '';
alter function private.unique_elements(anyarray) set search_path = '';

-- `SEARCHABLE_LANGUAGES` also offers "Português (Brasil)" as its own entry, and
-- the enum was built from the shorter spoken list. A label may carry a hyphen.
alter type public.language_code add value 'pt-BR';
