-- Close what the default grants left open.
--
-- Supabase gives `anon` and `authenticated` every column of every new table in
-- `public`. Three of these tables were narrowed as they were written;
-- the rest were left on the default, on the reasoning that row-level security
-- decides anyway. It does not: a policy says which *rows* you may touch, never
-- which *columns*, so a table whose policy pins one column is only as safe as
-- the grant beside it. `conversation_members` is where that gap is a way into
-- other people's chats today, and `plan_members` is where it would be one line
-- from now.

-- ---------------------------------------------------------------------------
-- A read receipt is the only thing you may write about your membership
-- ---------------------------------------------------------------------------
--
-- `own read receipt is updatable` checks `profile_id = auth.uid()` in both its
-- USING and its WITH CHECK — who, never which conversation. With UPDATE
-- granted on every column, a member could point their own row at any
-- conversation whose id they had ever seen:
--
--   update conversation_members set conversation_id = '<a group they left>'
--   where profile_id = auth.uid();
--
-- Both halves of the policy pass, because `profile_id` never changes. From
-- there `private.is_conversation_member()` answers true, so the whole group
-- history is readable and postable — including a chat they were dropped from
-- when they left the plan, or after a block.
revoke update on public.conversation_members from anon, authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;

-- Membership rows are made by `sync_plan_chat` and `open_direct_conversation`,
-- both security definer. Nothing signed in ever inserts or deletes one.
revoke insert, delete on public.conversation_members from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Say WITH CHECK where the policy means it
-- ---------------------------------------------------------------------------
--
-- `membership is updatable by the person or the host` states no WITH CHECK, so
-- Postgres reuses USING — which admits any row the caller could already touch,
-- including one they have just re-pointed at somebody else. Only the column
-- grant stops that today. Both belong here, so that widening the grant later
-- cannot quietly re-open it.
drop policy "membership is updatable by the person or the host" on public.plan_members;

create policy "membership is updatable by the person or the host"
  on public.plan_members for update to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (select 1 from public.plans p where p.id = plan_members.plan_id and p.host_id = (select auth.uid()))
  )
  with check (
    profile_id = (select auth.uid())
    or exists (select 1 from public.plans p where p.id = plan_members.plan_id and p.host_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Every other table: reading stays, writing goes
-- ---------------------------------------------------------------------------
--
-- Nothing signed out writes anything, and today no policy is written `to
-- public`, so none of this is reachable. It is one careless policy away from
-- being reachable on fifteen tables at once.
revoke insert, update, delete on
  public.profiles, public.profile_locations, public.places, public.plan_series,
  public.plans, public.conversations, public.messages, public.verification_submissions,
  public.legal_documents, public.legal_acceptances, public.blocks, public.reports,
  public.entitlements, public.billing_events, public.app_config
from anon;

-- ---------------------------------------------------------------------------
-- A rate somebody blocked you to stop you reading
-- ---------------------------------------------------------------------------
--
-- Every other read path folds blocks in — `public_profiles`, `plan_members`,
-- `nearby_plans`, `profile_view_count`. This one took a bare uuid and answered.
create or replace function public.attendance_rate_of(uid uuid) returns integer
  language sql stable security definer set search_path = ''
  as $$
  select case when count(*) = 0 then null
              else round(100.0 * count(*) filter (where outcome = 'attended') / count(*))::integer end
  from public.plan_members
  where profile_id = uid
    and outcome is not null
    and not private.is_blocked((select auth.uid()), uid)
$$;

-- ---------------------------------------------------------------------------
-- Reporting yourself
-- ---------------------------------------------------------------------------
--
-- `blocks` has `no_self_block` and `profile_views` has `not_a_mirror`; this one
-- was missed.
alter table public.reports
  add constraint no_self_report check (reporter_id is null or reporter_id <> subject_id);

-- ---------------------------------------------------------------------------
-- Put the flag back
-- ---------------------------------------------------------------------------
--
-- `decline_requests_on_block` sets `treff.trusted` to let its own writes past
-- the actor checks in `move_member`, and never cleared it. It is
-- transaction-local and PostgREST gives one statement per request, so nothing
-- reaches it today — but the next function that blocks and then touches
-- `plan_members` in one transaction would run with every check off.
create or replace function private.decline_requests_on_block() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  perform set_config('treff.trusted', 'on', true);

  update public.plan_members m
     set status = 'declined'
    from public.plans p
   where m.plan_id = p.id
     and m.status = 'requested'
     and (
       (m.profile_id = new.blocker_id and p.host_id = new.blocked_id)
       or (m.profile_id = new.blocked_id and p.host_id = new.blocker_id)
     );

  perform set_config('treff.trusted', 'off', true);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- The two foreign keys that are read on a hot path
-- ---------------------------------------------------------------------------
--
-- `sync_plan_chat` looks a conversation up by `plan_id` on every seat change,
-- and that is a sequential scan today.
create index if not exists conversations_plan_idx on public.conversations (plan_id);
create index if not exists messages_author_idx on public.messages (author_id);
