-- Billing comes out until there is a store behind it.
--
-- `entitlements` was a mirror of RevenueCat and `billing_events` its webhook
-- log, and neither was ever written by anything in this repo: the webhook that
-- would have filled them was never built. `has_plus()` therefore answered
-- false for every account that has ever existed, and four callers branched on
-- it. Each of those branches is collapsed here to the answer it was already
-- giving, so nothing changes for a user and there is no table left pretending
-- to hold a subscription.
--
-- What Plus sold is still named in the errors — `PLUS_REQUIRED` is still what
-- a cold thread and the viewers list raise, and the free request quota still
-- caps at `free_request_limit`. Re-adding the store means reintroducing
-- `has_plus()` and putting its term back in these four places.

-- ---------------------------------------------------------------------------
-- The quota now applies to everyone.
-- ---------------------------------------------------------------------------

create or replace function private.request_quota_spent(uid uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select (select count(*) from public.plan_members
          where profile_id = uid
            and requested_at > now() - make_interval(days => private.config_int('free_request_window_days', 7))
            and status <> 'declined')
         >= private.config_int('free_request_limit', 3)
$$;

-- ---------------------------------------------------------------------------
-- A cold thread needs a shared plan, from anyone.
-- ---------------------------------------------------------------------------

create or replace function public.open_direct_conversation(other uuid) returns uuid
  language plpgsql security definer set search_path = ''
  as $$
declare
  me uuid := (select auth.uid());
  lo uuid;
  hi uuid;
  cid uuid;
begin
  if me is null then
    raise exception 'NOT_SIGNED_IN' using errcode = 'insufficient_privilege';
  end if;
  if other = me then
    raise exception 'BAD_TRANSITION' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.public_profiles p where p.id = other) then
    raise exception 'BLOCKED' using errcode = 'insufficient_privilege';
  end if;

  lo := least(me, other);
  hi := greatest(me, other);

  select id into cid from public.conversations
  where direct_lower_id = lo and direct_higher_id = hi;
  if cid is not null then
    return cid;
  end if;

  -- A thread with someone you have sat in a plan with is free. A thread with
  -- anyone else is what Plus sold, and there is no Plus to buy.
  if not exists (
    select 1
    from public.plan_members a
    join public.plan_members b on b.plan_id = a.plan_id
    where a.profile_id = me and b.profile_id = other
      and a.status = 'seated' and b.status = 'seated'
  ) then
    raise exception 'PLUS_REQUIRED' using errcode = 'insufficient_privilege';
  end if;

  insert into public.conversations (direct_lower_id, direct_higher_id)
  values (lo, hi)
  returning id into cid;

  insert into public.conversation_members (conversation_id, profile_id)
  values (cid, me), (cid, other);

  return cid;
end;
$$;

-- ---------------------------------------------------------------------------
-- The viewers list is shut to everyone.
--
-- The function stays rather than going, because the screen reads its refusal:
-- `profile_view_count()` gives the number to everybody and this raises
-- `PLUS_REQUIRED`, which is what draws the locked state.
-- ---------------------------------------------------------------------------

create or replace function public.profile_viewers(days integer default 7)
returns table (viewer jsonb, viewed_at timestamptz)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  raise exception 'PLUS_REQUIRED' using errcode = 'insufficient_privilege';
end;
$$;

-- ---------------------------------------------------------------------------
-- The feed keeps the free radius, and its filters stop being conditional.
--
-- The four `not viewer.plus or …` guards were true for every caller, so the
-- filters never ran. They run now — which changes nothing in practice, since
-- the app calls `nearby_plans()` with no arguments and narrows on the client
-- — and the parameters mean what they say instead of being dead weight.
-- ---------------------------------------------------------------------------

create or replace function public.nearby_plans(
  want_language text default null,
  want_age_min integer default null,
  want_age_max integer default null,
  verified_hosts_only boolean default false
)
returns table (
  id uuid, title text, starts_at timestamptz, duration_minutes integer,
  seats smallint, join_mode public.join_mode, series_id uuid,
  age_min smallint, age_max smallint, distance_m double precision,
  membership text, place jsonb, host jsonb, languages text[],
  participants jsonb, requests jsonb
)
  language sql stable security definer set search_path = ''
  as $$
  with viewer as (
    select (select auth.uid()) as id
  ),
  home as (
    select l.point from public.profile_locations l, viewer where l.profile_id = viewer.id
  ),
  bounds as (
    select
      case when p.distance_unit = 'mi'
           then least(p.radius, private.config_int('free_radius_max_mi', 3)) * 1609.34
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
    and (want_language is null or want_language = any (pl.languages::text[]))
    and (want_age_min is null or pl.age_min is null or pl.age_min >= want_age_min)
    and (want_age_max is null or pl.age_max is null or pl.age_max <= want_age_max)
    and (not verified_hosts_only or pl.host_id is null
         or private.verification_status_of(pl.host_id) = 'verified')
  order by pl.starts_at
$$;

-- ---------------------------------------------------------------------------
-- And the billing side itself. The policies, grants and the `updated_at`
-- trigger go with their tables.
-- ---------------------------------------------------------------------------

drop function private.has_plus(uuid);
drop table public.billing_events;
drop table public.entitlements;
drop type public.entitlement_status;
