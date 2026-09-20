/**
 * Product limits the client enforces politely before the database enforces them
 * for real. Each mirrors a key in `app_config` (see `docs/database.md` §3.2) and
 * becomes a live read once the app talks to Supabase; until then the number
 * lives here so the two cannot silently disagree by more than one edit.
 */

/** `app_config.max_interests` — past this the profile's chip row stops saying anything. */
export const MAX_INTERESTS = 10;

/** `profile_interests.interest` length check; a longer chip wraps on the profile. */
export const MAX_INTEREST_LENGTH = 30;
