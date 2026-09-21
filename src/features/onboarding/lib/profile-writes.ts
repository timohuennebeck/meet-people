import type { SupabaseClient } from '@supabase/supabase-js';

import { flushDeferredPreferences } from '@shared/data/sources/supabase';
import { supabase } from '@shared/lib/supabase/client';
import type { Database, TablesUpdate } from '@shared/lib/supabase/database-types';
import { currentProfileId } from '@shared/lib/supabase/session';
import { uploadImage } from '@shared/lib/supabase/storage';

/**
 * Each onboarding step saves its own answer as the user continues, so an
 * abandoned sign-up keeps everything up to the point it stopped. There is no
 * store of answers in between: a step hands its answer to the function below
 * and forgets it.
 *
 * One wrinkle: the design asks five questions — location, radius, age,
 * interests, languages, country — before it creates the account, so the
 * earliest steps have no row to write to yet.
 * Rather than lose those answers, a write made before a session exists is held
 * and replayed by `flushProfileWrites()` the moment one does. What is held is
 * the write itself, already formed by the screen that made it — never the
 * answer, and never anything a later step reads back.
 */
type Write = (client: SupabaseClient<Database>, profileId: string) => Promise<void>;

let pending: Write[] = [];

/** Runs a write now, or holds it until there is an account to run it against. */
async function run(perform: Write): Promise<void> {
  if (!supabase) return;
  const profileId = await currentProfileId();
  if (!profileId) {
    pending.push(perform);
    return;
  }
  await perform(supabase, profileId);
}

/**
 * Replays everything collected before the account existed. Called once, by the
 * screen that created or restored the session.
 *
 * The queue is emptied first so a write that throws cannot be replayed twice,
 * and put back untouched if there still is no session — which happens when
 * sign-up needs an e-mail confirmed before it hands one over.
 */
export async function flushProfileWrites(): Promise<void> {
  if (!supabase) return;

  // The discovery answers — radius, age range, interests, languages — are held
  // by the data source rather than here, because they are written through
  // `usePreferences` and so share a cache with the settings screens that edit
  // the same rows. Draining both from one call means a screen only has to know
  // about one of them.
  await flushDeferredPreferences();

  if (pending.length === 0) return;

  const queued = pending;
  pending = [];

  const profileId = await currentProfileId();
  if (!profileId) {
    pending = queued;
    return;
  }

  for (const perform of queued) {
    await perform(supabase, profileId);
  }
}

/**
 * Patches the signed-in user's profile row.
 *
 * Always an update: a profile and a preferences row are created by a trigger
 * the moment the account exists, so there is nothing here to insert and nothing
 * to guess about which of the two ran first.
 */
export function saveProfile(patch: TablesUpdate<'profiles'>): void {
  void run(async (client, profileId) => {
    const { error } = await client.from('profiles').update(patch).eq('id', profileId);
    if (error) console.warn('[onboarding] Could not save the profile:', error.message);
  }).catch((error: unknown) => console.warn('[onboarding] Could not save the profile:', error));
}

/**
 * Uploads the chosen photo and points the profile at it.
 *
 * The row is only updated once the object is actually there, so a failed upload
 * leaves the old photo in place rather than a path to nothing.
 */
export function saveAvatar(uri: string): void {
  void run(async (client, profileId) => {
    const path = await uploadImage('avatars', profileId, uri);
    if (!path) return;

    const { error } = await client
      .from('profiles')
      .update({ avatar_storage_path: path })
      .eq('id', profileId);
    if (error) console.warn('[onboarding] Could not save the avatar:', error.message);
  }).catch((error: unknown) => console.warn('[onboarding] Could not save the avatar:', error));
}

/**
 * Writes the user's home point, and the neighbourhood read back from it.
 *
 * PostGIS takes GeoJSON straight from PostgREST, so the point goes over as
 * `{ type: 'Point', coordinates: [lng, lat] }` — longitude first, as GeoJSON
 * orders it. Nothing can read `profile_locations` back, by design, so this is
 * write-only and the neighbourhood on the profile is the only part of it the
 * app ever sees again.
 *
 * Called by `LocationScreen`, which asks for permission, takes a balanced-accuracy
 * fix and reverse-geocodes it. The `district` it reads back is the neighbourhood:
 * nobody types theirs, and the step promises "ninguém vê seu endereço, só o
 * bairro". A denial is not an error — the step continues without a point, and
 * the map simply has nothing to measure from.
 */
export function saveLocation(
  point: { latitude: number; longitude: number },
  neighbourhood?: string | null,
): void {
  void run(async (client, profileId) => {
    const row = {
      point: { type: 'Point', coordinates: [point.longitude, point.latitude] },
      updated_at: new Date().toISOString(),
    };

    // Update first, insert only if nothing was there — not `upsert`. An upsert
    // is `insert … on conflict do update`, and Postgres will only take the
    // update branch for a conflicting row the caller can *see*. This table has
    // no select policy at all, so the second time anyone moved house the
    // conflict would be with a row invisible to them and the whole statement
    // would come back as a policy violation. The affected count comes from the
    // response header, which needs no read either.
    const { error, count } = await client
      .from('profile_locations')
      .update(row, { count: 'exact' })
      .eq('profile_id', profileId);

    if (error) console.warn('[onboarding] Could not save the location:', error.message);
    else if (count === 0) {
      const { error: insertError } = await client
        .from('profile_locations')
        .insert({ profile_id: profileId, ...row });
      if (insertError) {
        console.warn('[onboarding] Could not save the location:', insertError.message);
      }
    }

    if (neighbourhood) {
      const { error: profileError } = await client
        .from('profiles')
        .update({ neighbourhood })
        .eq('id', profileId);
      if (profileError) {
        console.warn('[onboarding] Could not save the neighbourhood:', profileError.message);
      }
    }
  }).catch((error: unknown) => console.warn('[onboarding] Could not save the location:', error));
}
