import { throwAsDataError } from '../errors';
import type { ReportReason } from '../schemas';
import { client, unwrap, viewerId } from './shared';

/**
 * What one person does about another: reporting them, blocking them, and
 * lifting a block.
 *
 * Named for the actions rather than for `safety`, which named a feeling and
 * not a verb — nothing about the word said that blocking lived here.
 */

export const moderation = {
  /**
   * Files a report. The reporter is `auth.uid()`: the insert policy takes
   * nothing else, and `no_self_report` refuses a report against yourself.
   */
  report: async ({
    subjectId,
    reason,
    detail,
    planId,
  }: {
    subjectId: string;
    reason: ReportReason;
    detail: string;
    /** The plan the report is about, when it started from one. */
    planId?: string;
  }): Promise<void> => {
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

  /** Lifts a block. */
  unblock: async (profileId: string): Promise<void> => {
    const db = client();
    const uid = await viewerId();
    unwrap(await db.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', profileId));
  },
};
