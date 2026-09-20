-- Storage buckets for the two pictures onboarding collects.
--
-- `avatars` is public: a profile photo is shown to everyone who can see the
-- profile, and a public bucket serves it from a plain URL with no signing round
-- trip. Public only means "an object served at a known path is readable" — it
-- says nothing about `storage.objects`, which still answers to RLS. So the
-- select policy below stays owner-only: a bucket-wide read policy would let any
-- signed-in account `list()` the bucket and walk every user's folder, and the
-- folder name is the profile id.
--
-- `verification` is private. A selfie is only ever read by the reviewer running
-- as the secret key, which bypasses RLS entirely and therefore needs no policy.
--
-- Every path in both buckets is `<profile id>/<file>`, so ownership is the first
-- path segment rather than `storage.objects.owner` — the owner column is null
-- for anything the secret key writes, and it is not what the client can prove.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5 * 1024 * 1024, array['image/png', 'image/jpeg', 'image/webp']),
  ('verification', 'verification', false, 20 * 1024 * 1024, array['image/jpeg'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Avatars
-- ---------------------------------------------------------------------------

create policy "own avatars are listable"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "own avatars are insertable"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "own avatars are updatable"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A replaced photo leaves the old object behind unless the owner can remove it.
create policy "own avatars are deletable"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- Verification selfies
--
-- Insert and select only. A submitted selfie is evidence: the person who sent
-- it cannot quietly swap it for a different face or delete it out from under a
-- review, which is exactly the hole an update or delete policy would open.
-- ---------------------------------------------------------------------------

create policy "own selfies are listable"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'verification'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "own selfies are insertable"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verification'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- The row that points at the selfie
--
-- `verification_submissions` could already be read by its owner but not written
-- by anyone, so the selfie step had nowhere to land. The outcome stays out of
-- reach: only the reviewer sets it, and the owner may not insert a row for
-- somebody else.
-- ---------------------------------------------------------------------------

create policy "own submissions are insertable"
  on public.verification_submissions for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and outcome is null
    and reviewed_at is null
  );
