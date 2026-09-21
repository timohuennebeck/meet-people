-- Who turned up.
--
-- The check-list the host sees once a plan has ended had nowhere to send its
-- answer: `plan_members.outcome` is not in the column grant — deliberately, or
-- anyone could award themselves an attendance record — so the write has to be
-- a function that checks who is asking.
--
-- `attendance_rate_of` reads this column, and it is the number a stranger uses
-- to decide whether to sit down with somebody. It has to be the host's answer
-- about their own plan, after that plan has happened, and nothing else.

create function public.record_attendance(plan uuid, absentees uuid[] default '{}')
  returns integer
  language plpgsql security definer set search_path = ''
  as $$
declare
  me uuid := (select auth.uid());
  ended timestamptz;
  touched integer;
begin
  -- The host of this plan, and only them. A plan with no host is a standing
  -- meetup, which nobody is running and nobody can answer for.
  select p.starts_at + coalesce(make_interval(mins => p.duration_minutes), interval '0')
    into ended
  from public.plans p
  where p.id = plan and p.host_id = me and p.cancelled_at is null;

  if not found then
    raise exception 'NOT_THE_HOST' using errcode = 'check_violation';
  end if;

  -- Before it is over there is nothing to report, and letting a host mark
  -- somebody a no-show in advance is a way to punish them for a seat they
  -- still hold.
  if ended > now() then
    raise exception 'BAD_TRANSITION' using errcode = 'check_violation';
  end if;

  -- Seated members only: a request that was never accepted is not an absence,
  -- and somebody who left said so themselves.
  update public.plan_members m
     set outcome = case when m.profile_id = any (absentees) then 'no_show'::public.attendance_outcome
                        else 'attended'::public.attendance_outcome end,
         recorded_at = now()
   where m.plan_id = plan
     and m.status = 'seated';

  get diagnostics touched = row_count;
  return touched;
end;
$$;

revoke all on function public.record_attendance(uuid, uuid[]) from public, anon;
grant execute on function public.record_attendance(uuid, uuid[]) to authenticated;

comment on function public.record_attendance(uuid, uuid[]) is
  'Host records who turned up once their plan has ended. Everyone seated is marked attended except the uuids passed as absentees. Re-running replaces the answer.';
