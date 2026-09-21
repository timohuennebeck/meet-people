import { supabase } from '@shared/lib/supabase/client';

import { throwAsDataError } from '../../errors';

/**
 * Talking to Supabase at all: the client, who is asking, and what to do with
 * what comes back.
 *
 * Only what more than one group needs is here. A helper with a single caller
 * stays beside that caller — `likeLiteral` with the people search,
 * `THREAD_PAGE_SIZE` with the thread — so this stays the short list of things
 * every group reaches for.
 */

export function client() {
  if (!supabase) {
    throw new Error('[data] Supabase source used without credentials configured.');
  }
  return supabase;
}

/** The signed-in profile id, or null. Read from the persisted session, not the network. */
export async function sessionId(): Promise<string | null> {
  const { data, error } = await client().auth.getSession();
  if (error) throwAsDataError(error);
  return data.session?.user.id ?? null;
}

/** The signed-in profile id, for the reads and writes that require one. */
export async function viewerId(): Promise<string> {
  const id = await sessionId();
  if (!id) throw new Error('[data] No signed-in user.');
  return id;
}

/** Rejects with a typed `DataError` where the schema named the rule it broke. */
export function unwrap<T>(result: { data: T; error: unknown | null }): T {
  if (result.error) throwAsDataError(result.error);
  return result.data;
}

/**
 * The same, for a read that must return exactly one row. PostgREST types
 * `.single()` as nullable; a missing row here is a bug, not an empty state.
 */
export function unwrapSingle<T>(
  result: { data: T | null; error: unknown | null },
  what: string,
): T {
  const row = unwrap(result);
  if (row === null) throw new Error(`[data] ${what} not found.`);
  return row;
}
