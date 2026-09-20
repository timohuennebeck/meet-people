/**
 * Product limits the client enforces politely before the database enforces them
 * for real, so nobody meets one as a database error.
 */

/**
 * The `interest_cap` check constraint on `profiles.interests`. Past ten the
 * profile's chip row stops saying anything about the person.
 */
export const MAX_INTERESTS = 10;

/**
 * Client-only since the interests became an array: the per-item length check
 * went with the table that held them. A longer chip wraps on the profile.
 */
export const MAX_INTEREST_LENGTH = 30;
