import type { Database } from './database.generated';

/**
 * The database's own words, named.
 *
 * Postgres enum values arrive and leave as bare strings, so `'seated'` in a
 * query reads like any other literal — and the app has its own vocabulary that
 * overlaps this one without matching it. `'requested'` is a `member_status`
 * here and a `Membership` in `@shared/data/schemas`, and they are not the same
 * set; `'non_binary'` is this column's spelling of what the app calls
 * `'nonBinary'`. Naming both sides makes it impossible to write one where the
 * other belongs.
 *
 * Every set `satisfies` its generated type, so dropping or renaming a value in
 * the schema and re-running `npm run db:types` fails the build here rather
 * than at a query that quietly matches nothing.
 *
 * These are for the modules that talk to Postgres. A screen never sees them:
 * the mapping layer translates to the app's vocabulary on the way in and back
 * on the way out.
 */
type Enums = Database['public']['Enums'];

/** `plan_members.status` — where a row stands, as the table records it. */
export const MEMBER_STATUS = {
  REQUESTED: 'requested',
  DECLINED: 'declined',
  SEATED: 'seated',
  LEFT: 'left',
} as const satisfies Record<string, Enums['member_status']>;
export type MemberStatus = Enums['member_status'];

/** `profiles.audience_gender` — the column's spelling, not the app's. */
export const DB_AUDIENCE_GENDER = {
  EVERYONE: 'everyone',
  WOMEN: 'women',
  MEN: 'men',
  NON_BINARY: 'non_binary',
} as const satisfies Record<string, Enums['audience_gender']>;
export type DbAudienceGender = Enums['audience_gender'];

/** `plan_members.outcome` — who actually turned up. */
export const ATTENDANCE_OUTCOME = {
  ATTENDED: 'attended',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const satisfies Record<string, Enums['attendance_outcome']>;
export type AttendanceOutcome = Enums['attendance_outcome'];

/** `legal_documents.kind`. */
export const LEGAL_DOC_KIND = {
  TERMS: 'terms',
  PRIVACY: 'privacy',
} as const satisfies Record<string, Enums['legal_doc_kind']>;
export type LegalDocKind = Enums['legal_doc_kind'];
