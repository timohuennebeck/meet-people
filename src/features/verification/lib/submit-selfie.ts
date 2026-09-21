import { supabase } from '@shared/lib/supabase/client';
import { currentProfileId } from '@shared/lib/supabase/session';
import { uploadImage } from '@shared/lib/supabase/storage';

/**
 * Sends a selfie for review.
 *
 * Two steps that have to happen in this order: the object goes into the private
 * `verification` bucket, and only then does a row point at it. A row written
 * first would send the reviewer to a path with nothing at it; an object with no
 * row is a stray file the purge job collects.
 *
 * The bucket is private and its policies are owner-only, so the only thing that
 * ever reads the picture back is the reviewer, running as the secret key.
 * `outcome` is left null: the person submitting does not get to say how it went,
 * and the insert policy refuses a row that tries.
 */
export async function submitSelfie(uri: string): Promise<boolean> {
  if (!supabase) return false;

  const profileId = await currentProfileId();
  if (!profileId) return false;

  const storagePath = await uploadImage('verification', profileId, uri);
  if (!storagePath) return false;

  const { error } = await supabase
    .from('verification_submissions')
    .insert({ profile_id: profileId, storage_path: storagePath });

  if (error) {
    console.warn('[verification] Could not submit the selfie:', error.message);
    return false;
  }
  return true;
}
