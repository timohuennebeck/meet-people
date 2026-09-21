import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Ends an account.
 *
 * Three things have to happen and only one of them can be done from the app:
 *
 * 1. `public.delete_my_account()` anonymises the profile in place. The row
 *    stays — `messages_author_id_fkey` is `on delete restrict`, and cascading
 *    the profile away would also take the person's seat out of every plan's
 *    roster and erase the reports other people filed about them.
 * 2. The storage objects under their id are purged.
 * 3. The `auth.users` row is scrubbed of its address and soft-deleted. A hard
 *    delete would cascade to `profiles` and undo step 1, so the row is kept and
 *    emptied: no address, no sign-in.
 *
 * The caller is whoever the JWT says. Nothing here takes an id.
 */
Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Reads the caller from their own token rather than trusting a body.
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: auth, error: authError } = await asCaller.auth.getUser();
  if (authError || !auth.user) return json({ error: 'unauthorized' }, 401);

  const uid = auth.user.id;
  const admin = createClient(url, serviceKey);

  // 1. Anonymise, as the caller, so the function's own `auth.uid()` check holds.
  const { error: anonymiseError } = await asCaller.rpc('delete_my_account');
  if (anonymiseError) {
    return json({ error: 'anonymise_failed', detail: anonymiseError.message }, 500);
  }

  // 2. Purge their storage. A bucket with nothing in it is not a failure.
  for (const bucket of ['avatars', 'verification']) {
    const { data: objects } = await admin.storage.from(bucket).list(uid);
    const paths = (objects ?? []).map((object) => `${uid}/${object.name}`);
    if (paths.length > 0) await admin.storage.from(bucket).remove(paths);
  }

  // 3. Empty the auth row, then close it. The order matters: a soft-deleted
  //    user cannot be updated afterwards.
  const { error: scrubError } = await admin.auth.admin.updateUserById(uid, {
    email: `deleted+${uid}@account.invalid`,
    user_metadata: {},
  });
  if (scrubError) return json({ error: 'scrub_failed', detail: scrubError.message }, 500);

  // `true` is a soft delete: the row stays, so `profiles_id_fkey` still holds
  // and the tombstone from step 1 survives. Signing in is no longer possible.
  const { error: deleteError } = await admin.auth.admin.deleteUser(uid, true);
  if (deleteError) return json({ error: 'delete_failed', detail: deleteError.message }, 500);

  return json({ ok: true });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
