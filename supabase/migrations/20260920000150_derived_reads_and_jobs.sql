-- Derived reads and the two scheduled jobs.
--
-- Split out from the functions above only because it is where the schema stops
-- describing rows and starts describing screens: one round trip per surface,
-- with the filtering, the block exclusion and the viewer's own membership all
-- resolved server-side.

-- ---------------------------------------------------------------------------
-- nearby_plans
--
-- The workhorse: spatial query, audience filters, block exclusion and the
-- viewer's own membership in one round trip. As separate table reads it would be
-- four, plus a membership the client has to work out for itself.
--
-- Radius comes from the caller's preferences and is clamped for a free account,
-- and the three filter arguments are ignored unless they have Plus — that is
-- where "Planos da cidade inteira" and "Filtros de idioma, idade e verificados"
-- are actually enforced, rather than in the paywall's copy.
-- ---------------------------------------------------------------------------

create function public.nearby_plans(
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
           public.has_plus((select auth.uid())) as plus
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
                                     else public.config_int('free_radius_max_mi', 3) end) * 1609.34
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
    and (pl.host_id is null or not public.is_blocked(viewer.id, pl.host_id))
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
         or public.verification_status_of(pl.host_id) = 'verified')
  order by pl.starts_at
$$;

-- ---------------------------------------------------------------------------
-- Scheduled work
--
-- Written as SQL functions rather than edge functions: both are pure database
-- work, and a function `pg_cron` can call needs no deploy step, no secret and no
-- network hop. The three that genuinely need the outside world — the RevenueCat
-- webhook, the entitlement sync and the storage purge — stay edge functions.
-- ---------------------------------------------------------------------------

-- Attendance is derived from cancellation discipline, which is what Rule 1
-- ("Combinado é combinado — avise a tempo se não puder") actually asks of
-- people: a seat with no `left_at` attended, a seat with one cancelled. Nothing
-- a hostile host can weaponise and nothing a faked location can game. Its
-- weakness is real and named in the doc: someone who silently fails to turn up
-- keeps a perfect score until host-confirmed attendance exists.
create function public.close_stale_plans() returns integer
  language sql security definer set search_path = ''
  as $$
  with closed as (
    insert into public.plan_attendance (plan_id, profile_id, outcome)
    select pt.plan_id,
           pt.profile_id,
           case when pt.left_at is null then 'attended' else 'cancelled' end::public.attendance_outcome
    from public.plan_participants pt
    join public.plans p on p.id = pt.plan_id
    where p.cancelled_at is null
      and p.host_id is not null
      and p.seats is not null
      and p.starts_at + make_interval(mins => coalesce(p.duration_minutes, 120)) < now()
    on conflict (plan_id, profile_id) do nothing
    returning 1
  )
  select count(*)::integer from closed
$$;

-- Materialises the next occurrence of each active series a few days ahead, and
-- copies the series' languages onto it. Materialised rather than computed
-- because joins, requests and the group chat all hang off a real plan id.
create function public.materialise_plan_series(days_ahead integer default 10) returns integer
  language plpgsql security definer set search_path = ''
  as $$
declare
  created integer := 0;
  s record;
  occurrence timestamptz;
  new_plan uuid;
begin
  for s in select * from public.plan_series where active loop
    for occurrence in
      select d
      from generate_series(
        date_trunc('day', now()),
        date_trunc('day', now()) + make_interval(days => days_ahead),
        interval '1 day') as d
      where extract(isodow from d) = s.repeats_on
    loop
      -- `occurrence` is midnight on a matching weekday; the series' own start
      -- time is what makes it a meetup.
      occurrence := occurrence + s.start_time;
      if occurrence < now() then
        continue;
      end if;

      if exists (select 1 from public.plans where series_id = s.id and starts_at = occurrence) then
        continue;
      end if;

      insert into public.plans (host_id, place_id, series_id, title, join_mode, starts_at, duration_minutes, seats)
      values (null, s.place_id, s.id, s.title, s.join_mode, occurrence, s.duration_minutes, s.seats)
      returning id into new_plan;

      insert into public.plan_languages (plan_id, language_code)
      select new_plan, language_code from public.plan_series_languages where series_id = s.id;

      created := created + 1;
    end loop;
  end loop;

  return created;
end;
$$;

-- ---------------------------------------------------------------------------
-- export_my_data
--
-- One JSON document for the caller, for the "Baixar meus dados" row. It reads
-- the base tables rather than the public views on purpose: this is the one place
-- a person is entitled to everything the database holds about them, including
-- the birthdate the rest of the app only ever sees as an age.
-- ---------------------------------------------------------------------------

create function public.export_my_data() returns jsonb
  language sql stable security definer set search_path = ''
  as $$
  select jsonb_build_object(
    'exportedAt', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = (select auth.uid())),
    'preferences', (select to_jsonb(pr) from public.preferences pr where pr.profile_id = (select auth.uid())),
    'interests', (select coalesce(jsonb_agg(i.interest), '[]'::jsonb)
                  from public.profile_interests i where i.profile_id = (select auth.uid())),
    'languages', (select coalesce(jsonb_agg(l.language_code), '[]'::jsonb)
                  from public.profile_languages l where l.profile_id = (select auth.uid())),
    'plans', (select coalesce(jsonb_agg(to_jsonb(pl)), '[]'::jsonb)
              from public.plans pl where pl.host_id = (select auth.uid())),
    'participation', (select coalesce(jsonb_agg(to_jsonb(pt)), '[]'::jsonb)
                      from public.plan_participants pt where pt.profile_id = (select auth.uid())),
    'requests', (select coalesce(jsonb_agg(to_jsonb(jr)), '[]'::jsonb)
                 from public.join_requests jr where jr.profile_id = (select auth.uid())),
    'attendance', (select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
                   from public.plan_attendance a where a.profile_id = (select auth.uid())),
    'messages', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
                 from public.messages m where m.author_id = (select auth.uid())),
    'blocks', (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
               from public.blocks b where b.blocker_id = (select auth.uid())),
    'legalAcceptances', (select coalesce(jsonb_agg(to_jsonb(la)), '[]'::jsonb)
                         from public.legal_acceptances la where la.profile_id = (select auth.uid()))
  )
$$;

-- ---------------------------------------------------------------------------
-- attendance_rate
--
-- The "comparece" stat on a profile. Null rather than 100 when someone has no
-- past plans, so the client can leave the row out instead of flattering them.
-- ---------------------------------------------------------------------------

create function public.attendance_rate_of(uid uuid) returns integer
  language sql stable security definer set search_path = ''
  as $$
  select case when count(*) = 0 then null
              else round(100.0 * count(*) filter (where outcome = 'attended') / count(*))::integer end
  from public.plan_attendance where profile_id = uid
$$;
