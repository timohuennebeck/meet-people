-- Two corrections to the policies above.
--
-- **The membership policy recursed.** `conversation_members` was readable by a
-- member, and "a member" was expressed as a select from `conversation_members`
-- — inside that table's own `using` clause. Postgres applies RLS to the tables a
-- policy expression reads, so the check re-entered itself and every chat read
-- came back `42P17: infinite recursion detected in policy`. The conversations
-- list kept working, because `conversation_list` is a definer view that runs as
-- the owner, which is exactly why the bug hid: the list rendered and only
-- opening a thread failed.
--
-- The fix is the same shape as `is_blocked()`: one `security definer` function
-- that answers the question, called by the policies instead of each of them
-- re-deriving it.
--
-- **Half-finished profiles were public.** `public_profiles` filtered on
-- `deleted_at`, but not on whether the person had finished signing up — so an
-- account three steps in, with no name and no birthdate, was already a row other
-- people could read, and its null age had to be papered over on the client.

create function private.is_conversation_member(cid uuid, uid uuid default auth.uid())
  returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = cid and profile_id = uid)
$$;

grant execute on function private.is_conversation_member(uuid, uuid) to authenticated;

drop policy "membership is readable by members" on public.conversation_members;
drop policy "conversations are readable by members" on public.conversations;
drop policy "messages are readable by members" on public.messages;
drop policy "messages are sent by members" on public.messages;

create policy "membership is readable by members"
  on public.conversation_members for select to authenticated
  using (private.is_conversation_member(conversation_id));

create policy "conversations are readable by members"
  on public.conversations for select to authenticated
  using (private.is_conversation_member(id));

create policy "messages are readable by members"
  on public.messages for select to authenticated using (
    private.is_conversation_member(conversation_id)
    and not exists (
      select 1 from public.direct_conversations d
      where d.conversation_id = messages.conversation_id
        and private.is_blocked(d.lower_id, d.higher_id)
    )
  );

create policy "messages are sent by members"
  on public.messages for insert to authenticated with check (
    author_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
  );

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
         private.verification_status_of(p.id) = 'verified' as verified
  from public.profiles p
  where p.deleted_at is null
    and p.onboarding_completed_at is not null
    and not private.is_blocked((select auth.uid()), p.id);
