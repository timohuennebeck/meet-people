import { supabase } from './client';

/**
 * The signed-in account's id, or `null` when nobody is signed in.
 *
 * A profile row carries the same id as the `auth.users` row it was created
 * from, so this is both the auth id and the profile id — which is what every
 * `profile_id` column and every storage folder name is checked against.
 *
 * Read from the client rather than from `useSession()`, because the callers are
 * event handlers rather than renders: what matters is the session at the moment
 * of the write, not the one the screen rendered with.
 */
export async function currentProfileId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('[supabase] Could not read the session:', error.message);
    return null;
  }
  return data.session?.user.id ?? null;
}
