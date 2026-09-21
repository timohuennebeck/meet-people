-- "Adicionar vaga" on the host's waitlist.
--
-- Two writes that have to be one: the plan grows by a seat and the person the
-- host picked takes it. Split across two round trips, a request accepted
-- elsewhere in between leaves the plan one seat wider than the host meant, and
-- a `PLAN_FULL` from `private.move_member()` leaves a phantom vacancy nobody
-- asked for.

create function public.add_seat(plan uuid, profile uuid) returns void
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
  -- seated. A capped one grows by exactly one, and the schema's own ceiling
  -- still applies — twenty is the largest plan this product makes.
  if current_seats is not null then
    if current_seats >= 20 then
      raise exception 'PLAN_FULL' using errcode = 'check_violation';
    end if;
    update public.plans set seats = current_seats + 1 where id = plan;
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

revoke all on function public.add_seat(uuid, uuid) from public, anon;
grant execute on function public.add_seat(uuid, uuid) to authenticated;

comment on function public.add_seat(uuid, uuid) is
  'Host widens a full plan by one seat and gives it to a waiting request, in one transaction.';
