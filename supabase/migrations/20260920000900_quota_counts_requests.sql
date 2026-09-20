-- The free quota counts requests, and only the ones that were not declined.
--
-- Decided: the thing being capped is the thing that costs someone *else*
-- something. A request lands on a host who has to read it and decide; an open
-- join costs nobody. Hosting, joining an open plan and turning up to a standing
-- meetup are free and stay free — hosts are supply, and supply is never taxed.
-- Three requests a week, rolling, and a request the host declined is refunded,
-- because "I spent my three on people who said no" is the worst possible first
-- week.
--
-- The quota as first written counted every non-seated row inside the window,
-- which was wrong twice over: a `left` row on an open plan was never a request
-- and counted anyway, and a declined request counted forever. Nothing on the
-- row said whether it had started life as a request — an accepted one and a
-- direct open join both end up `seated`. `requested_at` says so, and says when.

alter table public.plan_members add column requested_at timestamptz;

comment on column public.plan_members.requested_at is
  'When this row was a request to an approval plan, if it ever was. Null for a direct join. The quota counts these.';

update public.plan_members set requested_at = created_at where status in ('requested', 'declined');

alter table public.plan_members
  add constraint requests_are_dated check (status not in ('requested', 'declined') or requested_at is not null);

-- Counting is one function now, so the two triggers cannot drift from each other.
create function private.request_quota_spent(uid uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select not private.has_plus(uid)
     and (select count(*) from public.plan_members
          where profile_id = uid
            and requested_at > now() - make_interval(days => private.config_int('free_request_window_days', 7))
            and status <> 'declined')
         >= private.config_int('free_request_limit', 3)
$$;

create or replace function private.admit_member() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  plan public.plans%rowtype;
  taken integer;
begin
  select * into plan from public.plans where id = new.plan_id for update;

  new.updated_at = now();

  if new.is_host then
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
    if private.request_quota_spent(new.profile_id) then
      raise exception 'NO_CREDITS' using errcode = 'insufficient_privilege';
    end if;
    new.requested_at = now();
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

create or replace function private.move_member() returns trigger
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

  if from_api and new.message is distinct from old.message and actor is distinct from new.profile_id then
    raise exception 'NOT_THE_MEMBER' using errcode = 'insufficient_privilege';
  end if;

  if new.status = old.status then
    return new;
  end if;

  select * into plan from public.plans where id = new.plan_id for update;

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

  if old.status in ('left', 'declined') and new.status in ('requested', 'seated') then
    if from_api and actor is distinct from new.profile_id then
      raise exception 'NOT_THE_MEMBER' using errcode = 'insufficient_privilege';
    end if;
    if plan.host_id is not null and private.is_blocked(new.profile_id, plan.host_id) then
      raise exception 'BLOCKED' using errcode = 'insufficient_privilege';
    end if;
    if new.status = 'requested' then
      if plan.join_mode <> 'approval' then
        raise exception 'PLAN_IS_OPEN' using errcode = 'check_violation';
      end if;
      -- Asking again is a new request: it is counted, and dated, like one.
      if private.request_quota_spent(new.profile_id) then
        raise exception 'NO_CREDITS' using errcode = 'insufficient_privilege';
      end if;
      new.requested_at = now();
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

update public.app_config
set description = 'Requests to approval plans a free account may send inside the window below. Declined ones are refunded; open joins never count.'
where key = 'free_request_limit';
