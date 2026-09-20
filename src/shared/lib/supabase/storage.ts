import { supabase } from './client';

/**
 * A random object name.
 *
 * Nothing here is a secret — the name only has to be unique inside one
 * account's folder, so that uploading a second photo cannot overwrite the first
 * while a request for it is still in flight. React Native ships no
 * `crypto.randomUUID`, and pulling in a polyfill to name a file would be a
 * dependency for nothing.
 */
function randomName(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}

/** Buckets the app writes to. Both key ownership off the first path segment. */
export type ImageBucket = 'avatars' | 'verification';

/**
 * Uploads a local image and returns the path it landed at.
 *
 * The path is always `<profile id>/<name>.jpg`, which is what the storage
 * policies check: the folder is the account, so nobody can write into — or list
 * — anybody else's.
 *
 * React Native's `fetch` reads a `file://` URI, and an `ArrayBuffer` is the one
 * body Supabase Storage accepts on React Native: a `Blob` there carries no data
 * the JS side can hand over, and would upload an empty object.
 */
export async function uploadImage(
  bucket: ImageBucket,
  profileId: string,
  uri: string,
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const body = await fetch(uri).then((response) => response.arrayBuffer());
    const path = `${profileId}/${randomName()}.jpg`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, body, { contentType: 'image/jpeg' });

    if (error) {
      console.warn(`[storage] Could not upload to ${bucket}:`, error.message);
      return null;
    }
    return path;
  } catch (error) {
    console.warn(`[storage] Could not read the image for ${bucket}:`, error);
    return null;
  }
}
