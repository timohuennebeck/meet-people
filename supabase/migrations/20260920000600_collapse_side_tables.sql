-- Seven tables become columns.
--
-- The schema had a table wherever a profile or a plan owned a list. That is the
-- right instinct when the rows carry attributes of their own — `plan_participants`
-- has a `joined_at` and a `left_at`, `join_requests` has a message and a status —
-- and the wrong one when they carry nothing but themselves. Six of these held a
-- single column beside their foreign key, and the seventh held a 1:1 row that
-- every read of a profile had to fetch anyway.
--
-- What goes, and why each is safe:
--
--   profile_interests, profile_languages   a bare list of short strings, capped
--   plan_languages, plan_series_languages  at ten and a handful respectively.
--                                          Never joined, never carrying an
--                                          attribute. `text[]` with a GIN index
--                                          answers "who else speaks Turkish?" as
--                                          well as the join did, and "what does
--                                          this person speak?" without one.
--
--   preferences                            exactly one row per profile, private
--                                          to its owner — the same row, the same
--                                          policy, the same lifetime. Two tables
--                                          to express one.
--
--   plan_attendance                        one row per person per plan, keyed the
--                                          same way as `plan_participants` and
--                                          derived from its `left_at`. The answer
--                                          belongs on the seat it is about.
--
--   direct_conversations                   a pair and a uniqueness rule, on a
--                                          table that already had a `plan_id` for
--                                          the other kind of conversation.
--
-- What stays a table, and why:
--
--   profile_locations   a point nobody may read. RLS is per row, not per column,
--                       so a table with no select policy is a guarantee that
--                       survives whatever anyone does to `profiles` later. It is
--                       belt and braces now that `profiles` is owner-only — but
--                       this is the one leak in the app that would matter, and
--                       one table is a cheap brace.
--
--   join_requests       a request has a message, a status and two timestamps. It
--                       could fold into `plan_participants` as a status column —
--                       a request is a would-be participant — but that changes
--                       what the free-tier quota counts, which is still an open
--                       product question.

-- ---------------------------------------------------------------------------
-- Uniqueness inside an array
--
-- The old tables carried `unique (profile_id, lower(interest))`, so "Café" and
-- "café" could not both be added and quietly dodge the cap. A check constraint
-- cannot contain a subquery, but it can call a function that does.
-- ---------------------------------------------------------------------------

create function private.folded_unique(items text[]) returns boolean
  language sql immutable
  as $$ select cardinality(items) = (select count(distinct lower(x)) from unnest(items) x) $$;

-- ---------------------------------------------------------------------------
-- Profiles absorb their lists and their preferences
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column interests             text[] not null default '{}',
  add column languages             text[] not null default '{}',
  add column radius                numeric(5, 2) not null default 2,
  add column distance_unit         public.distance_unit not null default 'mi',
  add column age_min               smallint not null default 21,
  add column age_max               smallint not null default 34,
  add column audience_gender       public.audience_gender not null default 'everyone',
  add column app_language          text not null default 'pt-BR',
  add column notifications_enabled boolean not null default true;

update public.profiles p set
  interests = coalesce(
    (select array_agg(i.interest order by i.interest)
     from public.profile_interests i where i.profile_id = p.id), '{}'),
  languages = coalesce(
    (select array_agg(l.language_code order by l.language_code)
     from public.profile_languages l where l.profile_id = p.id), '{}');

update public.profiles p set
  radius = pr.radius,
  distance_unit = pr.distance_unit,
  age_min = pr.age_min,
  age_max = pr.age_max,
  audience_gender = pr.audience_gender,
  app_language = pr.app_language,
  notifications_enabled = pr.notifications_enabled
from public.preferences pr
where pr.profile_id = p.id;

alter table public.profiles
  -- Ten because the profile draws them as a wrapped chip row, and past about ten
  -- they stop saying anything about the person. This was a trigger reading
  -- `app_config`, so the number could move without a migration; a constraint
  -- beside the column is one source of truth instead of two, and the number has
  -- never moved.
  add constraint interest_cap check (cardinality(interests) <= 10),
  add constraint interests_folded_unique check (private.folded_unique(interests)),
  add constraint languages_folded_unique check (private.folded_unique(languages)),
  add constraint radius_positive check (radius > 0),
  add constraint age_floor check (age_min >= 18),
  add constraint age_ceiling check (age_max <= 99),
  add constraint age_range_ordered check (age_min <= age_max);

create index profiles_interests_idx on public.profiles using gin (interests);
create index profiles_languages_idx on public.profiles using gin (languages);

delete from public.app_config where key = 'max_interests';

-- ---------------------------------------------------------------------------
-- Plans and series absorb their languages
-- ---------------------------------------------------------------------------

alter table public.plans add column languages text[] not null default '{}';
alter table public.plan_series add column languages text[] not null default '{}';

update public.plans p set languages = coalesce(
  (select array_agg(l.language_code order by l.language_code)
   from public.plan_languages l where l.plan_id = p.id), '{}');

update public.plan_series s set languages = coalesce(
  (select array_agg(l.language_code order by l.language_code)
   from public.plan_series_languages l where l.series_id = s.id), '{}');

alter table public.plans
  add constraint plan_languages_folded_unique check (private.folded_unique(languages));
alter table public.plan_series
  add constraint series_languages_folded_unique check (private.folded_unique(languages));

create index plans_languages_idx on public.plans using gin (languages);

-- ---------------------------------------------------------------------------
-- A seat carries its own outcome
-- ---------------------------------------------------------------------------

alter table public.plan_participants
  add column outcome     public.attendance_outcome,
  add column recorded_at timestamptz;

update public.plan_participants pp set
  outcome = a.outcome,
  recorded_at = a.recorded_at
from public.plan_attendance a
where a.plan_id = pp.plan_id and a.profile_id = pp.profile_id;

-- ---------------------------------------------------------------------------
-- A conversation names its pair
-- ---------------------------------------------------------------------------

alter table public.conversations
  add column direct_lower_id  uuid references public.profiles (id) on delete cascade,
  add column direct_higher_id uuid references public.profiles (id) on delete cascade;

update public.conversations c set
  direct_lower_id = d.lower_id,
  direct_higher_id = d.higher_id
from public.direct_conversations d
where d.conversation_id = c.id;

alter table public.conversations
  -- Both or neither, ordered so a pair has one spelling, and never alongside a
  -- plan: a conversation is a plan's group chat or it is two people, not both.
  add constraint direct_pair_complete
    check ((direct_lower_id is null) = (direct_higher_id is null)),
  add constraint direct_pair_ordered
    check (direct_lower_id is null or direct_lower_id < direct_higher_id),
  add constraint one_kind_of_conversation
    check (plan_id is null or direct_lower_id is null),
  add constraint direct_pair_unique unique (direct_lower_id, direct_higher_id);

-- ---------------------------------------------------------------------------
-- Everything that read the old tables
--
-- Rewritten before the removals below, because a policy that names a table holds
-- a dependency on it, and a SQL function that names one simply stops working the
-- moment it goes.
-- ---------------------------------------------------------------------------

-- The public view gains what a profile screen was already showing: the interests
-- and languages that used to cost two more reads.
create or replace view public.public_profiles
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
         -- Appended rather than slotted in beside the other profile columns:
         -- `create or replace view` may add columns at the end and nowhere else,
         -- and dropping the view would take `conversation_list` with it.
         p.interests,
         p.languages
  from public.profiles p
  where p.deleted_at is null
    and p.onboarding_completed_at is not null
    and not private.is_blocked((select auth.uid()), p.id);

-- The pair now lives on the conversation itself.
drop policy "messages are readable by members" on public.messages;
create policy "messages are readable by members"
  on public.messages for select to authenticated using (
    private.is_conversation_member(conversation_id)
    and not exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.direct_lower_id is not null
        and private.is_blocked(c.direct_lower_id, c.direct_higher_id)
    )
  );

create or replace function public.attendance_rate_of(uid uuid) returns integer
  language sql stable security definer set search_path = ''
  as $$
  select case when count(*) = 0 then null
              else round(100.0 * count(*) filter (where outcome = 'attended') / count(*))::integer end
  from public.plan_participants where profile_id = uid and outcome is not null
$$;

-- Now an update rather than an insert: the seat is already there, and the only
-- thing missing from it was how the evening went.
create or replace function private.close_stale_plans() returns integer
  language sql security definer set search_path = ''
  as $$
  with closed as (
    update public.plan_participants pt
    set outcome = case when pt.left_at is null then 'attended' else 'cancelled' end::public.attendance_outcome,
        recorded_at = now()
    from public.plans p
    where p.id = pt.plan_id
      and pt.outcome is null
      and p.cancelled_at is null
      and p.host_id is not null
      and p.seats is not null
      and p.starts_at + make_interval(mins => coalesce(p.duration_minutes, 120)) < now()
    returning 1
  )
  select count(*)::integer from closed
$$;

create or replace function private.materialise_plan_series(days_ahead integer default 10) returns integer
  language plpgsql security definer set search_path = ''
  as $$
declare
  created integer := 0;
  s record;
  occurrence timestamptz;
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
      occurrence := occurrence + s.start_time;
      if occurrence < now() then
        continue;
      end if;

      if exists (select 1 from public.plans where series_id = s.id and starts_at = occurrence) then
        continue;
      end if;

      -- The languages come across as one column now, so an occurrence is a
      -- single insert rather than an insert and a copy.
      insert into public.plans
        (host_id, place_id, series_id, title, join_mode, starts_at, duration_minutes, seats, languages)
      values
        (null, s.place_id, s.id, s.title, s.join_mode, occurrence, s.duration_minutes, s.seats, s.languages);

      created := created + 1;
    end loop;
  end loop;

  return created;
end;
$$;

create or replace function public.export_my_data() returns jsonb
  language sql stable security definer set search_path = ''
  as $$
  select jsonb_build_object(
    'exportedAt', now(),
    -- Interests, languages and every preference are columns on the profile now,
    -- so the whole of it comes across in one object.
    'profile', (select to_jsonb(p) from public.profiles p where p.id = (select auth.uid())),
    'plans', (select coalesce(jsonb_agg(to_jsonb(pl)), '[]'::jsonb)
              from public.plans pl where pl.host_id = (select auth.uid())),
    'participation', (select coalesce(jsonb_agg(to_jsonb(pt)), '[]'::jsonb)
                      from public.plan_participants pt where pt.profile_id = (select auth.uid())),
    'requests', (select coalesce(jsonb_agg(to_jsonb(jr)), '[]'::jsonb)
                 from public.join_requests jr where jr.profile_id = (select auth.uid())),
    'messages', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
                 from public.messages m where m.author_id = (select auth.uid())),
    'blocks', (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
               from public.blocks b where b.blocker_id = (select auth.uid())),
    'legalAcceptances', (select coalesce(jsonb_agg(to_jsonb(la)), '[]'::jsonb)
                         from public.legal_acceptances la where la.profile_id = (select auth.uid()))
  )
$$;

-- `nearby_plans` read the radius from `preferences` and the languages from their
-- own table. Both are columns now, which also takes a correlated subquery out of
-- the select list.
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
    pl.languages,
    coalesce(
      (select jsonb_agg(jsonb_build_object('profile', to_jsonb(sp), 'isHost', pt.is_host)
                        order by pt.is_host desc, pt.joined_at)
       from public.plan_participants pt
       join public.public_profiles sp on sp.id = pt.profile_id
       where pt.plan_id = pl.id and pt.left_at is null),
      '[]'::jsonb) as participants,
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
    and (not viewer.plus or want_language is null or want_language = any (pl.languages))
    and (not viewer.plus or want_age_min is null or pl.age_min is null or pl.age_min >= want_age_min)
    and (not viewer.plus or want_age_max is null or pl.age_max is null or pl.age_max <= want_age_max)
    and (not viewer.plus or not verified_hosts_only or pl.host_id is null
         or private.verification_status_of(pl.host_id) = 'verified')
  order by pl.starts_at
$$;

-- A new account is one row now, not two.
create or replace function private.handle_new_user() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- And the tables themselves
-- ---------------------------------------------------------------------------

drop trigger profile_interests_enforce_cap on public.profile_interests;
drop function private.enforce_interest_cap();
drop trigger preferences_updated_at on public.preferences;

drop table public.profile_interests;
drop table public.profile_languages;
drop table public.preferences;
drop table public.plan_languages;
drop table public.plan_series_languages;
drop table public.plan_attendance;
drop table public.direct_conversations;
