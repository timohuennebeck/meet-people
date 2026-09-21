import { reportReasonSchema, type ReportReason } from '@shared/data/schemas';

/**
 * The reasons this screen offers, in the order the design lists them.
 *
 * The values are the `report_reason` enum, which `@shared/data/schemas` owns
 * because the data layer writes it too — so a reason the database will not take
 * cannot be listed here.
 */
export const REPORT_REASONS = reportReasonSchema.options;

/** Narrows a reason arriving as a route parameter, which is any string. */
export function isReportReason(value: string | undefined): value is ReportReason {
  return reportReasonSchema.safeParse(value).success;
}

export type { ReportReason };
