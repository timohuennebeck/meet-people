-- The two views were writable.
--
-- Supabase's default privileges grant `authenticated` every DML right on each
-- new object in `public`, views included. `public_profiles` is a simple view
-- over one table, which makes it auto-updatable, and it runs as its owner —
-- that is the whole point of it — so an UPDATE through it reached `profiles`
-- as the owner and bypassed row-level security entirely. Verified: a signed-in
-- user could rename anybody.
--
-- The grants are revoked, and each view gets an INSTEAD OF trigger that
-- raises, so that a grant which finds its way back does not quietly reopen it.
-- Every future view in this schema needs the same two lines; the dashboard's
-- "Unrestricted" badge on a view is this exact trap.

revoke insert, update, delete, truncate, references, trigger
  on public.public_profiles from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.conversation_list from anon, authenticated;

create function private.reject_view_write() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  raise exception 'VIEW_IS_READ_ONLY' using errcode = 'insufficient_privilege';
end;
$$;

create trigger public_profiles_read_only
  instead of insert or update or delete on public.public_profiles
  for each row execute function private.reject_view_write();

create trigger conversation_list_read_only
  instead of insert or update or delete on public.conversation_list
  for each row execute function private.reject_view_write();
