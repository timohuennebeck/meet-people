-- Who may call what.
--
-- PostgREST publishes every function in `public` as an RPC endpoint, so a
-- `security definer` helper written for a policy or a trigger is, by default,
-- also a URL any signed-in user can POST to. Several of the functions above are
-- not things a client should ever call: `materialise_plan_series()` would let
-- anyone mint plans, `close_stale_plans()` would let anyone stamp attendance,
-- and every trigger function is meaningless outside its trigger.
--
-- The fix is a schema, not a grant. `private` is not in the exposed schema list,
-- so nothing in it has an endpoint at all — while policies and triggers, which
-- resolve by OID rather than by URL, go on calling these exactly as before.
--
-- `authenticated` still needs USAGE and EXECUTE on the four helpers that appear
-- inside policy expressions, because a policy runs as the querying user. `anon`
-- gets neither: every policy here is `to authenticated`.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Helpers that policy expressions call. Moving preserves the OID, so the
-- policies that already reference them keep working untouched.
alter function public.config_int(text, integer)          set schema private;
alter function public.is_blocked(uuid, uuid)             set schema private;
alter function public.has_plus(uuid)                     set schema private;
alter function public.verification_status_of(uuid)       set schema private;

-- Trigger functions. A trigger runs as the table owner, so these need no grant
-- to anybody.
alter function public.set_updated_at()                   set schema private;
alter function public.handle_new_user()                  set schema private;
alter function public.seat_plan_host()                   set schema private;
alter function public.enforce_plan_seats()               set schema private;
alter function public.enforce_interest_cap()             set schema private;
alter function public.enforce_request_rules()            set schema private;
alter function public.seat_accepted_request()            set schema private;
alter function public.decline_requests_on_block()        set schema private;
alter function public.stamp_verification_review()        set schema private;
alter function public.reject_legal_mutation()            set schema private;

-- Scheduled work. Nothing but the scheduler and the service key runs these.
alter function public.close_stale_plans()                set schema private;
alter function public.materialise_plan_series(integer)   set schema private;

revoke all on function private.close_stale_plans() from public, anon, authenticated;
revoke all on function private.materialise_plan_series(integer) from public, anon, authenticated;

grant execute on function private.config_int(text, integer)    to authenticated;
grant execute on function private.is_blocked(uuid, uuid)       to authenticated;
grant execute on function private.has_plus(uuid)               to authenticated;
grant execute on function private.verification_status_of(uuid) to authenticated;

-- The bodies that call a moved helper by name have to be re-qualified: a
-- plpgsql body resolves its calls at execution time, and `search_path` is empty
-- in all of these, so `public.is_blocked` would simply stop existing.

create or replace function private.enforce_interest_cap() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  cap integer := private.config_int('max_interests', 10);
begin
  if (select count(*) from public.profile_interests where profile_id = new.profile_id) >= cap then
    raise exception 'TOO_MANY_INTERESTS' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_request_rules() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  plan_host uuid;
  window_days integer := private.config_int('free_request_window_days', 7);
  request_limit integer := private.config_int('free_request_limit', 3);
  used integer;
begin
  select host_id into plan_host from public.plans where id = new.plan_id;

  if plan_host is not null and private.is_blocked(new.profile_id, plan_host) then
    raise exception 'BLOCKED' using errcode = 'insufficient_privilege';
  end if;

  if private.has_plus(new.profile_id) then
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

-- These three had a mutable search_path, which the linter is right about: a
-- trigger function without one resolves its own names against whatever the
-- caller happens to have set.

create or replace function private.set_updated_at() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.stamp_verification_review() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  if new.outcome is distinct from old.outcome then
    new.reviewed_at = case when new.outcome is null then null else now() end;
  end if;
  return new;
end;
$$;

create or replace function private.reject_legal_mutation() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  raise exception 'LEGAL_DOCUMENTS_ARE_APPEND_ONLY' using errcode = 'insufficient_privilege';
end;
$$;

-- The four that stay public are the ones a screen genuinely calls. None of them
-- means anything without a session, so `anon` loses them too.

revoke all on function public.nearby_plans(text, integer, integer, boolean) from public, anon;
revoke all on function public.distance_to(uuid) from public, anon;
revoke all on function public.export_my_data() from public, anon;
revoke all on function public.attendance_rate_of(uuid) from public, anon;

grant execute on function public.nearby_plans(text, integer, integer, boolean) to authenticated;
grant execute on function public.distance_to(uuid) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.attendance_rate_of(uuid) to authenticated;

-- The legal documents are readable before sign-in, so this one keeps `anon`.
grant execute on function public.current_legal_document(public.legal_doc_kind, text) to anon, authenticated;

-- Both views run as their owner and filter on `auth.uid()`, which is nothing
-- before sign-in. Neither has any business answering an unauthenticated request.
revoke all on public.public_profiles from anon;
revoke all on public.conversation_list from anon;

-- `nearby_plans` is `language sql`, so it resolves the helpers by name every
-- time it runs. Moving them out of `public` would leave it calling functions
-- that no longer exist there, so it is replaced here with the same body and the
-- new qualifications.

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
      -- Miles or kilometres as the person set them, in metres, clamped to the
      -- free allowance unless they are on Plus.
      case when p.distance_unit = 'mi'
           then least(p.radius, case when viewer.plus then p.radius
                                     else private.config_int('free_radius_max_mi', 3) end) * 1609.34
           else p.radius * 1000 end as metres
    from public.preferences p, viewer where p.profile_id = viewer.id
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
      when exists (select 1 from public.plan_participants pt
                   where pt.plan_id = pl.id and pt.profile_id = viewer.id and pt.left_at is null) then 'joined'
      when exists (select 1 from public.join_requests jr
                   where jr.plan_id = pl.id and jr.profile_id = viewer.id and jr.status = 'pending') then 'requested'
      else 'guest'
    end as membership,
    jsonb_build_object(
      'id', pc.id, 'name', pc.name, 'address', pc.address,
      'distanceM', extensions.st_distance((select point from home), pc.point)
    ) as place,
    (select to_jsonb(hp) from public.public_profiles hp where hp.id = pl.host_id) as host,
    coalesce(
      (select array_agg(lang.language_code order by lang.language_code)
       from public.plan_languages lang where lang.plan_id = pl.id),
      '{}'::text[]) as languages,
    coalesce(
      (select jsonb_agg(jsonb_build_object('profile', to_jsonb(sp), 'isHost', pt.is_host)
                        order by pt.is_host desc, pt.joined_at)
       from public.plan_participants pt
       join public.public_profiles sp on sp.id = pt.profile_id
       where pt.plan_id = pl.id and pt.left_at is null),
      '[]'::jsonb) as participants,
    -- Only the host is shown the queue; for everyone else it is an empty array
    -- rather than a null, so the client has one shape to render.
    -- The queue is numbered in a subquery rather than inline, because a window
    -- function cannot appear inside an aggregate call. That numbering is the
    -- whole waitlist: once a plan is full, the queue simply *is* the pending
    -- requests in `created_at` order, so there is no position to store and
    -- renumber every time someone ahead withdraws.
    case when pl.host_id = viewer.id then coalesce(
      (select jsonb_agg(jsonb_build_object(
                'id', q.id, 'profile', q.profile, 'message', q.message,
                'createdAt', q.created_at, 'position', q.position)
              order by q.created_at)
       from (
         select jr.id, to_jsonb(rp) as profile, jr.message, jr.created_at,
                row_number() over (order by jr.created_at) as position
         from public.join_requests jr
         join public.public_profiles rp on rp.id = jr.profile_id
         where jr.plan_id = pl.id and jr.status = 'pending'
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
    -- Filters are Plus-only. A free account gets them ignored rather than
    -- rejected, so the screen degrades to "everything nearby".
    and (not viewer.plus or want_language is null
         or exists (select 1 from public.plan_languages lang
                    where lang.plan_id = pl.id and lang.language_code = want_language))
    and (not viewer.plus or want_age_min is null or pl.age_min is null or pl.age_min >= want_age_min)
    and (not viewer.plus or want_age_max is null or pl.age_max is null or pl.age_max <= want_age_max)
    and (not viewer.plus or not verified_hosts_only or pl.host_id is null
         or private.verification_status_of(pl.host_id) = 'verified')
  order by pl.starts_at
$$;
