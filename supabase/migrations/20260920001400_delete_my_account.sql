-- Deleting an account.
--
-- §3.9 of docs/database.md: deletion **anonymises rather than deletes**, and
-- "leaves the `profiles` row so foreign keys hold". That sentence is the whole
-- design. `messages_author_id_fkey` is `on delete restrict` with a `not null`
-- author, so removing a profile is refused outright for anyone who has ever
-- sent a message — and cascading it away instead would take their seat out of
-- every plan's roster and erase the reports other people filed about them.
--
-- So the row stays as a tombstone with nothing personal left in it. What ends
-- the account is done outside Postgres, by the `delete-account` edge function:
-- it scrubs the address on the `auth.users` row and soft-deletes it, which
-- leaves that row in place too and keeps this profile's foreign key valid.

create function public.delete_my_account() returns void
  language plpgsql security definer set search_path = ''
  as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'NOT_THE_MEMBER' using errcode = 'check_violation';
  end if;

  -- Everything a person is, blanked in place. `deleted_at` is what
  -- `public_profiles` and every read path will key off.
  update public.profiles
     set deleted_at = coalesce(deleted_at, now()),
         name = '',
         avatar_storage_path = null,
         bio = null,
         birthdate = null,
         gender = null,
         pronouns = 'unspecified',
         neighbourhood = null,
         country_code = null,
         interests = '{}',
         languages = '{}',
         notifications_enabled = false
   where id = me;

  -- Where they were is not something a tombstone keeps.
  delete from public.profile_locations where profile_id = me;

  -- The selfie is the most sensitive thing the account holds. The row records
  -- that a review happened; the object itself is purged by the edge function,
  -- and this marks it so the retention sweep does not look for it again.
  update public.verification_submissions
     set purged_at = coalesce(purged_at, now())
   where profile_id = me;

  -- A seat nobody will take should not keep showing a face. These are the two
  -- moves the app already makes, and they have to stay those two:
  -- `private.move_member()` allows `seated → left` and nothing else out of a
  -- live row, and withdrawing a request is a delete rather than a transition.
  delete from public.plan_members where profile_id = me and status = 'requested';

  update public.plan_members
     set status = 'left'
   where profile_id = me
     and status = 'seated'
     and not is_host;

  -- A host cannot leave their own plan — there would be nobody running it — so
  -- the plan goes instead. Only the ones still to come: a plan that already
  -- happened is part of other people's history.
  update public.plans
     set cancelled_at = coalesce(cancelled_at, now())
   where host_id = me
     and starts_at > now()
     and cancelled_at is null;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'Anonymises the caller''s profile in place (docs/database.md §3.9). The row stays so other people''s messages, plans and reports keep their foreign keys.';
