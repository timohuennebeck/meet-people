/**
 * Why someone is being reported.
 *
 * These ids are the `report_reason` enum from `docs/database.md` §3.1 — the
 * value that will land in `reports.reason` — so the screen's rows are labelled
 * through i18n and identified by these, never by their copy. The order here is
 * the order the design lists them in, which is not the enum's declaration
 * order; the database stores a value, not a position.
 */
export const REPORT_REASONS = [
  'no_show',
  'harassment',
  'fake_profile',
  'inappropriate',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** Narrows a reason arriving as a route parameter, which is any string. */
export function isReportReason(value: string | undefined): value is ReportReason {
  return REPORT_REASONS.includes(value as ReportReason);
}
