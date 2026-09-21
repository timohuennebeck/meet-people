-- Five places where two things answered the same question.
--
-- None of these is a new rule. Each is a rule the schema already had, written
-- down twice — and in the first case the two copies disagreed, which is how a
-- number nobody could argue with turned into a number nobody should trust.

-- ---------------------------------------------------------------------------
-- The host answers for their own plan
-- ---------------------------------------------------------------------------
--
-- `close_stale_plans()` and `record_attendance()` write the same column and
-- mean different things by it. The job ran every half hour and marked every
-- seated row `attended` as soon as the plan's end time had passed, so within
-- thirty minutes of an evening ending the answer was already published — and
-- `record_attendance()` is the only thing that can say `no_show`. The host's
-- check-list was therefore never the first word, only a correction to one, and
-- a host who never opened it had already marked everybody present.
--
-- `attendance_rate_of()` is the number a stranger reads before deciding whether
-- to sit down with somebody. It has to be somebody's answer, not the absence of
-- one.
--
-- So the two are separated in time rather than in column. Someone who left said
-- so themselves and there is nothing to confirm, so that still closes the
-- moment the plan is over. A seat waits a day for the host, and only then falls
-- back to the old derivation — which keeps the stat from going empty for the
-- plans nobody reports on, without letting it speak first.
create or replace function private.close_stale_plans() returns integer
  language sql security definer set search_path = ''
  as $$
  with closed as (
    update public.plan_members m
    set outcome = case when m.status = 'seated' then 'attended' else 'cancelled' end::public.attendance_outcome,
        recorded_at = now()
    from public.plans p
    where p.id = m.plan_id
      -- Anything the host has already answered for is theirs and stays theirs.
      and m.outcome is null
      and p.cancelled_at is null
      and p.host_id is not null
      and p.seats is not null
      and (
        (m.status = 'left'
         and p.starts_at + make_interval(mins => coalesce(p.duration_minutes, 120)) < now())
        or
        (m.status = 'seated'
         and p.starts_at + make_interval(mins => coalesce(p.duration_minutes, 120))
             < now() - interval '24 hours')
      )
    returning 1
  )
  select count(*)::integer from closed
$$;

comment on function private.close_stale_plans() is
  'Closes out plans nobody reported on: departures as soon as the plan ends, seats a day later so the host''s check-list speaks first.';

-- ---------------------------------------------------------------------------
-- export_my_data() had no caller
-- ---------------------------------------------------------------------------
--
-- No screen, no query hook, no edge function, and no copy for the "Baixar meus
-- dados" row that docs/database.md describes. What it did have was `execute` to
-- `authenticated` and a body returning the whole `profiles` row — `birthdate`
-- included, which every other read path reduces to an age on purpose.
--
-- A dead endpoint is still an endpoint. It comes back with the screen that
-- needs it, and it will be a better function then for being written against a
-- design rather than ahead of one.
drop function public.export_my_data();

-- ---------------------------------------------------------------------------
-- One function for "no duplicates"
-- ---------------------------------------------------------------------------
--
-- `folded_unique(text[])` and `unique_elements(anyarray)` are the same query
-- twice, differing only in whether they case-fold first. One constraint used
-- the first and three used the second.
--
-- Folding is the argument, not the function. Interests are free text a person
-- types, so "Café" and "café" are one interest and must not both count towards
-- the ten; languages are enum members, already canonical, and folding them
-- would be pretending they might not be.
alter table public.profiles   drop constraint interests_folded_unique;
alter table public.profiles   drop constraint languages_unique;
alter table public.plans      drop constraint plan_languages_unique;
alter table public.plan_series drop constraint series_languages_unique;

drop function private.folded_unique(text[]);
drop function private.unique_elements(anyarray);

create function private.unique_elements(items anyarray, fold boolean default false) returns boolean
  language sql immutable set search_path = ''
  as $$
  select cardinality(items) = (
    select count(distinct case when fold then lower(x::text) else x::text end)
    from unnest(items) x)
$$;

alter table public.profiles
  -- Renamed with the function: `interests_folded_unique` named an implementation
  -- that no longer exists. `errors.ts` maps this name to TOO_MANY_INTERESTS,
  -- because dodging the cap by capitalising is the only way anyone meets it.
  add constraint interests_unique check (private.unique_elements(interests, true)),
  add constraint languages_unique check (private.unique_elements(languages));

alter table public.plans
  add constraint plan_languages_unique check (private.unique_elements(languages));

alter table public.plan_series
  add constraint series_languages_unique check (private.unique_elements(languages));

-- ---------------------------------------------------------------------------
-- The seat ceiling is the constraint
-- ---------------------------------------------------------------------------
--
-- Twenty was written in three places: `plans_seats_check`, a literal in
-- `add_seat()`, and an `app_config` row calling itself "the ceiling on the
-- create flow's seat stepper". Only the first one decides anything — a config
-- row cannot loosen a check constraint, so it promised a tunability it never
-- had, and nothing read it.
--
-- `add_seat()` stops repeating the number and lets the constraint refuse,
-- translating that refusal into the word the client already knows.
create or replace function public.add_seat(plan uuid, profile uuid) returns void
  language plpgsql security definer set search_path = ''
  as $$
declare
  me uuid := (select auth.uid());
  current_seats smallint;
begin
  select p.seats into current_seats
  from public.plans p
  where p.id = plan and p.host_id = me and p.cancelled_at is null
  for update;

  if not found then
    raise exception 'NOT_THE_HOST' using errcode = 'check_violation';
  end if;

  -- An uncapped plan has no seat to add; whoever is waiting can simply be
  -- seated. A capped one grows by exactly one, and how far it may grow is
  -- `plans_seats_check`'s to say.
  if current_seats is not null then
    begin
      update public.plans set seats = current_seats + 1 where id = plan;
    exception when check_violation then
      raise exception 'PLAN_FULL' using errcode = 'check_violation';
    end;
  end if;

  -- `move_member` does the rest of the checking: that this really is a pending
  -- request, that the two have not blocked each other, and that the seat count
  -- it has just been given room under is respected.
  update public.plan_members
     set status = 'seated'
   where plan_id = plan
     and profile_id = profile
     and status = 'requested';

  if not found then
    raise exception 'BAD_TRANSITION' using errcode = 'check_violation';
  end if;
end;
$$;

-- `max_interests` went when the cap became a constraint (20260920000600) and
-- the seed has been putting it back ever since. These two are the same mistake
-- caught later: a row describing a number that is really decided somewhere
-- else. The three that remain — `min_supported_version`, `maintenance_mode`,
-- `selfie_retention_days` — are each the only copy of their number, readable by
-- the client by design, and are waiting on the screens that read them.
delete from public.app_config where key in ('plan_seats_max', 'verification_sla_hours', 'max_interests');

-- ---------------------------------------------------------------------------
-- One thing happens when a plan is created
-- ---------------------------------------------------------------------------
--
-- Opening the chat and seating the host were two `after insert` triggers on
-- `plans`, and the chat had to come first — `sync_plan_chat` puts a newly
-- seated member into the plan's conversation and there has to be one to put
-- them in. Triggers on one event fire in name order, so that ordering was held
-- by `plans_open_chat` sorting before `plans_seat_host`: a rule enforced by
-- spelling, which the next rename breaks silently.
drop trigger plans_open_chat on public.plans;
drop trigger plans_seat_host on public.plans;
drop function private.open_plan_chat();
drop function private.seat_plan_host();

create function private.open_plan() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  -- The chat, then the host's seat into it. Two statements in one body say the
  -- order outright.
  insert into public.conversations (plan_id) values (new.id);

  -- Skipped for a standing meetup, which has no host to seat.
  if new.host_id is not null then
    insert into public.plan_members (plan_id, profile_id, status, is_host, seated_at)
    values (new.id, new.host_id, 'seated', true, now());
  end if;

  return new;
end;
$$;

create trigger plans_open after insert on public.plans
  for each row execute function private.open_plan();
