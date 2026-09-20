/**
 * The failures a screen has to tell apart.
 *
 * Three of the database's rules are enforced by `raise exception` in a trigger
 * — the free-tier request quota, the seat count and the block gate (see
 * `supabase/migrations/20260920000100_functions_and_triggers.sql` and, for
 * membership, `…000800_language_enum_members_places.sql`). PostgREST
 * hands those back as a `PostgrestError` whose `message` is the bare word the
 * trigger raised, which is not something a person should ever read.
 *
 * The fourth, the interest cap, is a check constraint on `profiles` since the
 * list became a `text[]` column, and a constraint refuses in a shape of its
 * own: `code` is `23514` and `message` reads
 *
 *   new row for relation "profiles" violates check constraint "interest_cap"
 *
 * — the constraint's name rather than a word we chose. `CONSTRAINT_CODES` maps
 * the names back. `interests_folded_unique` is the same rule seen from the
 * other side: it is what stops "Café" and "café" both counting towards the ten,
 * so it shows the same sentence.
 *
 * `toDataError` turns either shape into a `DataError` carrying a code the UI
 * can switch on and the i18n key holding the sentence to show. Anything else
 * stays whatever it was: a failure we have no copy for is not improved by
 * pretending we recognised it.
 */

/**
 * The rules the schema refuses by name.
 *
 * The first four are things a person can run into and each has its own
 * sentence. The rest are raised by the `plan_members` triggers when a client
 * asks for a move the table does not allow — requesting a seat on an open
 * plan, accepting a request on somebody else's plan, a host leaving their own
 * plan. A correct client never sends those, so they are not four more
 * sentences; they are recognised so a screen can tell "the server said no" from
 * "the network fell over", and they all show the same generic line.
 */
export const DATA_ERROR_CODES = [
  'NO_CREDITS',
  'PLAN_FULL',
  'BLOCKED',
  'TOO_MANY_INTERESTS',
  'PLAN_IS_OPEN',
  'PLAN_NEEDS_APPROVAL',
  'NOT_THE_HOST',
  'NOT_THE_MEMBER',
  'HOST_CANNOT_LEAVE',
  'BAD_TRANSITION',
] as const;

export type DataErrorCode = (typeof DATA_ERROR_CODES)[number];

/** Check constraints whose name is the only thing a refusal says about them. */
const CONSTRAINT_CODES: Record<string, DataErrorCode> = {
  interest_cap: 'TOO_MANY_INTERESTS',
  interests_folded_unique: 'TOO_MANY_INTERESTS',
};

/** Where the copy for each code lives, so a screen never builds the key itself. */
const MESSAGE_KEYS: Record<DataErrorCode, string> = {
  NO_CREDITS: 'errors.noCredits',
  PLAN_FULL: 'errors.planFull',
  BLOCKED: 'errors.blocked',
  TOO_MANY_INTERESTS: 'errors.tooManyInterests',
  PLAN_IS_OPEN: 'errors.badTransition',
  PLAN_NEEDS_APPROVAL: 'errors.badTransition',
  NOT_THE_HOST: 'errors.badTransition',
  NOT_THE_MEMBER: 'errors.badTransition',
  HOST_CANNOT_LEAVE: 'errors.badTransition',
  BAD_TRANSITION: 'errors.badTransition',
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

  const raised = DATA_ERROR_CODES.find((code) => message.includes(code));
  if (raised) return raised;

  // `violates check constraint "interest_cap"`. Read off the quoted name
  // rather than searched for anywhere in the message, so an interest somebody
  // typed cannot pass for the constraint it broke.
  const constraint = /violates check constraint "([^"]+)"/.exec(message)?.[1];
  return constraint ? (CONSTRAINT_CODES[constraint] ?? null) : null;
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
