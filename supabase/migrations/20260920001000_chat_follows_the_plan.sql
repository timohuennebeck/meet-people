-- Chat becomes something the app can start, and cold direct messages become Plus.
--
-- Until now no client could create a conversation at all: `conversations` had a
-- select policy and nothing else, and a plan's group chat existed only where
-- the seed had written one. Two things fix that, and the second carries the
-- paid rule.
--
-- A plan's group chat follows the plan. It is opened when the plan is created
-- and its members are whoever is seated — someone accepted joins it, someone
-- who leaves is taken out, which is what the leave screen already promises.
-- No client writes any of it.
--
-- A direct thread is opened by one function, and only for two people who have
-- sat in a plan together — or by someone on Plus. The rule is the same thing
-- read two ways: it is what Plus sells, and it is what keeps a stranger from
-- opening a thread with everyone on the map.

-- ---------------------------------------------------------------------------
-- Group chats
-- ---------------------------------------------------------------------------

create function private.open_plan_chat() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  insert into public.conversations (plan_id) values (new.id);
  return new;
end;
$$;

-- Named to sort before `plans_seat_host`: triggers on one event fire in name
-- order, and the chat has to exist before the host is seated into it.
create trigger plans_open_chat
  after insert on public.plans
  for each row execute function private.open_plan_chat();

create function private.sync_plan_chat() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  cid uuid;
begin
  select id into cid from public.conversations where plan_id = new.plan_id;
  if cid is null then
    return new;
  end if;

  if new.status = 'seated' then
    insert into public.conversation_members (conversation_id, profile_id)
    values (cid, new.profile_id)
    on conflict do nothing;
  elsif tg_op = 'UPDATE' and old.status = 'seated' then
    delete from public.conversation_members
    where conversation_id = cid and profile_id = new.profile_id;
  end if;

  return new;
end;
$$;

create trigger plan_members_sync_chat
  after insert or update of status on public.plan_members
  for each row execute function private.sync_plan_chat();

-- The seed and every plan created before this migration.
insert into public.conversations (plan_id)
select p.id from public.plans p
where not exists (select 1 from public.conversations c where c.plan_id = p.id);

insert into public.conversation_members (conversation_id, profile_id)
select c.id, m.profile_id
from public.conversations c
join public.plan_members m on m.plan_id = c.plan_id and m.status = 'seated'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Direct threads
-- ---------------------------------------------------------------------------

create function public.open_direct_conversation(other uuid) returns uuid
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
  -- `public_profiles` already leaves out the deleted, the unfinished and the
  -- blocked, so one existence check covers all three.
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
  -- anyone else is what Plus sells.
  if not private.has_plus(me) and not exists (
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

revoke all on function public.open_direct_conversation(uuid) from public, anon;
grant execute on function public.open_direct_conversation(uuid) to authenticated;
