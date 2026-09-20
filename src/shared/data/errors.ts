/**
 * The failures a screen has to tell apart.
 *
 * Four of the database's rules are enforced by `raise exception` in a trigger —
 * the free-tier request quota, the seat count, the block gate and the interest
 * cap (see `supabase/migrations/20260920000100_functions_and_triggers.sql`).
 * PostgREST hands those back as a `PostgrestError` whose `message` is the bare
 * word the trigger raised, which is not something a person should ever read.
 *
 * `toDataError` turns that word into a `DataError` carrying a code the UI can
 * switch on and the i18n key holding the sentence to show. Anything else stays
 * whatever it was: a failure we have no copy for is not improved by pretending
 * we recognised it.
 */

/** The rules the schema raises by name. */
export const DATA_ERROR_CODES = [
  'NO_CREDITS',
  'PLAN_FULL',
  'BLOCKED',
  'TOO_MANY_INTERESTS',
] as const;

export type DataErrorCode = (typeof DATA_ERROR_CODES)[number];

/** Where the copy for each code lives, so a screen never builds the key itself. */
const MESSAGE_KEYS: Record<DataErrorCode, string> = {
  NO_CREDITS: 'errors.noCredits',
  PLAN_FULL: 'errors.planFull',
  BLOCKED: 'errors.blocked',
  TOO_MANY_INTERESTS: 'errors.tooManyInterests',
};

/**
 * One of the four named rules, refused. Discriminate on `code`: every branch is
 * a different sentence and, on the join sheet, a different next step — a spent
 * quota opens the paywall, a full plan does not.
 */
export class DataError extends Error {
  readonly code: DataErrorCode;
  /** i18n key for the sentence this failure shows. */
  readonly messageKey: string;
  /** The original rejection, kept for logs. */
  readonly cause?: unknown;

  constructor(code: DataErrorCode, cause?: unknown) {
    super(code);
    this.name = 'DataError';
    this.code = code;
    this.messageKey = MESSAGE_KEYS[code];
    this.cause = cause;
  }
}

export function isDataError(error: unknown): error is DataError {
  return error instanceof DataError;
}

/** The code a rejection names, or null when it names none of them. */
export function dataErrorCode(error: unknown): DataErrorCode | null {
  if (isDataError(error)) return error.code;
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  return DATA_ERROR_CODES.find((code) => message.includes(code)) ?? null;
}

/**
 * Wraps a Postgres rejection as a `DataError` when it names one of the four
 * rules, and returns the original otherwise.
 */
export function toDataError(error: unknown): unknown {
  const code = dataErrorCode(error);
  return code === null ? error : new DataError(code, error);
}

/** Rejects with the typed error where there is one. Every write goes through this. */
export function throwAsDataError(error: unknown): never {
  throw toDataError(error);
}
