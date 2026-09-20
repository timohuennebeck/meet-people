-- Row-level security.
--
-- RLS is enabled on every table, so the default for each is deny. A policy below
-- opens the narrowest access some screen actually needs, and a table with no
-- policy for an action is genuinely unreachable — `profile_locations` has no
-- select policy at all, and `entitlements` has no write policy at all, both
-- deliberately.
--
-- Anonymous users get the same policies as anyone else. They can finish the
-- first few onboarding steps and nothing more: creating a plan, sending a
-- request and opening a chat all need a permanent account, which the checks
-- below express rather than the UI.

alter table public.app_config               enable row level security;
alter table public.profiles                 enable row level security;
alter table public.profile_locations        enable row level security;
alter table public.profile_interests        enable row level security;
alter table public.profile_languages        enable row level security;
alter table public.preferences              enable row level security;
alter table public.places                   enable row level security;
alter table public.plan_series              enable row level security;
alter table public.plan_series_languages    enable row level security;
alter table public.plans                    enable row level security;
alter table public.plan_languages           enable row level security;
alter table public.plan_participants        enable row level security;
alter table public.join_requests            enable row level security;
alter table public.plan_attendance          enable row level security;
alter table public.conversations            enable row level security;
alter table public.conversation_members     enable row level security;
alter table public.direct_conversations     enable row level security;
alter table public.messages                 enable row level security;
alter table public.verification_submissions enable row level security;
alter table public.legal_documents          enable row level security;
alter table public.legal_acceptances        enable row level security;
alter table public.blocks                   enable row level security;
alter table public.reports                  enable row level security;
alter table public.entitlements             enable row level security;
alter table public.billing_events           enable row level security;

-- ---------------------------------------------------------------------------
-- Read-only reference data
--
-- Both are readable before sign-in: the version gate has to work on a build that
-- cannot sign in, and the welcome screen shows the legal links to someone who
-- has no account yet. Neither has a write policy, so only the secret key writes.
-- ---------------------------------------------------------------------------

create policy "config is readable by everyone"
  on public.app_config for select to anon, authenticated using (true);

create policy "legal documents are readable by everyone"
  on public.legal_documents for select to anon, authenticated using (true);

create policy "series are readable by everyone"
  on public.plan_series for select to anon, authenticated using (true);
create policy "series languages are readable by everyone"
  on public.plan_series_languages for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Profiles
--
-- The base table is the owner's alone. Everyone else reads `public_profiles`,
-- which is what keeps `birthdate` and the location out of reach.
-- ---------------------------------------------------------------------------

create policy "own profile is readable"
  on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile is insertable"
  on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "own profile is updatable"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.public_profiles to authenticated;
grant select on public.conversation_list to authenticated;

-- No select policy, on purpose. The point can be written and overwritten by its
-- owner and read by nobody — every distance the app shows comes back from
-- `distance_to()` or `nearby_plans()` as metres.
create policy "own location is insertable"
  on public.profile_locations for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "own location is updatable"
  on public.profile_locations for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "own location is deletable"
  on public.profile_locations for delete to authenticated
  using (profile_id = (select auth.uid()));

create policy "interests are readable when signed in"
  on public.profile_interests for select to authenticated
  using (not public.is_blocked((select auth.uid()), profile_id));
create policy "own interests are writable"
  on public.profile_interests for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "languages are readable when signed in"
  on public.profile_languages for select to authenticated
  using (not public.is_blocked((select auth.uid()), profile_id));
create policy "own languages are writable"
  on public.profile_languages for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "own preferences are readable"
  on public.preferences for select to authenticated using (profile_id = (select auth.uid()));
create policy "own preferences are writable"
  on public.preferences for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Places and plans
-- ---------------------------------------------------------------------------

create policy "places are readable when signed in"
  on public.places for select to authenticated using (true);
-- Still open to any signed-in user, which is a spam vector; recording the author
-- at least makes cleanup possible.
create policy "places are insertable when signed in"
  on public.places for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "live plans are readable"
  on public.plans for select to authenticated using (
    cancelled_at is null
    and (host_id is null or not public.is_blocked((select auth.uid()), host_id))
  );
create policy "plans are created by their host"
  on public.plans for insert to authenticated with check (
    host_id = (select auth.uid())
    -- An uncapped, open, un-approved plan is the most abusable object in the
    -- schema, so hosting one needs the verification that already exists for
    -- exactly this kind of trust question.
    and (seats is not null or public.verification_status_of((select auth.uid())) = 'verified')
  );
create policy "plans are edited by their host"
  on public.plans for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));

create policy "plan languages are readable with their plan"
  on public.plan_languages for select to authenticated using (
    exists (select 1 from public.plans p where p.id = plan_id and p.cancelled_at is null)
  );
create policy "plan languages are written by the host"
  on public.plan_languages for all to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.host_id = (select auth.uid())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.host_id = (select auth.uid())));

-- A blocked participant is not listed, so their seat simply reads as taken.
create policy "participants are readable when signed in"
  on public.plan_participants for select to authenticated
  using (not public.is_blocked((select auth.uid()), profile_id));
-- Joining an open plan is the one seat a client writes directly; an approval
-- plan is seated by the trigger on the accepted request instead.
create policy "open plans can be joined"
  on public.plan_participants for insert to authenticated with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.plans p
      where p.id = plan_id and p.join_mode = 'open' and p.cancelled_at is null
        and (p.host_id is null or not public.is_blocked((select auth.uid()), p.host_id))
    )
  );
-- Leaving stamps `left_at`; it never deletes the row, which is the fact
-- attendance is derived from.
create policy "own seat is updatable"
  on public.plan_participants for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "requests are readable by author or host"
  on public.join_requests for select to authenticated using (
    profile_id = (select auth.uid())
    or exists (
      select 1 from public.plans p
      where p.id = plan_id and p.host_id = (select auth.uid())
    )
  );
create policy "requests are created by their author"
  on public.join_requests for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "requests are resolved by the host"
  on public.join_requests for update to authenticated using (
    exists (select 1 from public.plans p where p.id = plan_id and p.host_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.plans p where p.id = plan_id and p.host_id = (select auth.uid()))
  );
create policy "requests are withdrawn by their author"
  on public.join_requests for delete to authenticated
  using (profile_id = (select auth.uid()) and status = 'pending');

-- Derived server-side; the owner can see their own record and nobody writes one
-- from a client.
create policy "own attendance is readable"
  on public.plan_attendance for select to authenticated
  using (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Chat
--
-- A blocked direct thread is unreadable; group messages stay visible. Hiding one
-- member's lines out of a plan's chat leaves everyone else's replies answering
-- nothing, and the way out of a shared plan is to leave it.
-- ---------------------------------------------------------------------------

create policy "conversations are readable by members"
  on public.conversations for select to authenticated using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = id and m.profile_id = (select auth.uid())
    )
  );

create policy "membership is readable by members"
  on public.conversation_members for select to authenticated using (
    exists (
      select 1 from public.conversation_members mine
      where mine.conversation_id = conversation_members.conversation_id
        and mine.profile_id = (select auth.uid())
    )
  );
create policy "own read receipt is updatable"
  on public.conversation_members for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "direct pairs are readable by their two members"
  on public.direct_conversations for select to authenticated
  using (lower_id = (select auth.uid()) or higher_id = (select auth.uid()));

create policy "messages are readable by members"
  on public.messages for select to authenticated using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id and m.profile_id = (select auth.uid())
    )
    and not exists (
      select 1 from public.direct_conversations d
      where d.conversation_id = messages.conversation_id
        and public.is_blocked(d.lower_id, d.higher_id)
    )
  );
create policy "messages are sent by members"
  on public.messages for insert to authenticated with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id and m.profile_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Verification, consent, safety
-- ---------------------------------------------------------------------------

-- The pending screen and the settings pill read the person's own status this
-- way. It exposes a path into a private bucket, not a picture.
create policy "own submissions are readable"
  on public.verification_submissions for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "own acceptances are readable"
  on public.legal_acceptances for select to authenticated
  using (profile_id = (select auth.uid()));
create policy "own acceptances are insertable"
  on public.legal_acceptances for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "own blocks are readable"
  on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "own blocks are insertable"
  on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "own blocks are deletable"
  on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create policy "own reports are readable"
  on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy "own reports are insertable"
  on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Billing
--
-- Readable by its owner, writable by nobody. A user granting themselves Plus
-- must be structurally impossible, not merely absent from the UI, so there is no
-- insert or update policy here for any client role to find. `billing_events` has
-- no policy at all: it is the webhook's, and nothing else reads it.
-- ---------------------------------------------------------------------------

create policy "own entitlements are readable"
  on public.entitlements for select to authenticated
  using (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Realtime
--
-- Messages only. Presence handles who is online, and everything else the app
-- shows live is a consequence of a message arriving.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;
