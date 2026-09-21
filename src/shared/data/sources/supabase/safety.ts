import { throwAsDataError } from '../../errors';
import type { ReportReason } from '../../schemas';
import type { DataSource } from '../types';
import { client, unwrap, viewerId } from './shared';

/** Reporting and blocking. */

export const safetySource: DataSource['safety'] = {
  /**
   * Files a report. The reporter is `auth.uid()`: the insert policy takes
   * nothing else, and `no_self_report` refuses a report against yourself.
   */
  report: async (
    subjectId: string,
    reason: ReportReason,
    detail: string,
    planId?: string,
  ): Promise<void> => {
    const db = client();
    const uid = await viewerId();
    unwrap(
      await db.from('reports').insert({
        reporter_id: uid,
        subject_id: subjectId,
        plan_id: planId ?? null,
        reason,
        detail: detail.trim() || null,
      }),
    );
  },

  /**
   * Blocks somebody. Idempotent: blocking a second time is not an error the
   * screen should show, so a duplicate key is ignored rather than raised.
   *
   * `private.decline_requests_on_block()` fires on the insert and turns any
   * request between the two down, which is also what refunds the applicant's
   * weekly credit.
   */
  block: async (profileId: string): Promise<void> => {
    const db = client();
    const uid = await viewerId();
    const result = await db.from('blocks').insert({ blocker_id: uid, blocked_id: profileId });
    // 23505: already blocked.
    if (result.error && result.error.code !== '23505') throwAsDataError(result.error);
  },

  unblock: async (profileId: string): Promise<void> => {
    const db = client();
    const uid = await viewerId();
    unwrap(await db.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', profileId));
  },
};
