import { useMutation, useQueryClient } from '@tanstack/react-query';

import { moderation } from '@shared/data/api/moderation';
import { chatKeys, planKeys, userKeys } from '@shared/data/query-keys';
import type { ReportReason } from '@shared/data/schemas';

export interface ReportInput {
  subjectId: string;
  reason: ReportReason;
  detail: string;
  /** The plan the report is about, when it started from one. */
  planId?: string;
}

/**
 * Files a report and blocks the person in the same step.
 *
 * The confirmation screen states both as done rather than asking, which is what
 * `docs/database.md` §3.9 describes — so both have to have happened by the time
 * it renders. The block is second because the report is the part that must not
 * be lost: if blocking fails, the report is still filed and the screen's undo
 * simply has nothing to undo.
 */
export function useReportAndBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, reason, detail, planId }: ReportInput) => {
      await moderation.report({ subjectId, reason, detail, planId });
      await moderation.block(subjectId);
    },
    onSuccess: () => invalidateAfterBlock(queryClient),
  });
}

/** Lifts the block the report screen applied. */
export function useUnblock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => moderation.unblock(profileId),
    onSuccess: () => invalidateAfterBlock(queryClient),
  });
}

/**
 * A block moves almost everything the app shows.
 *
 * `public_profiles` hides the two from each other both ways, `nearby_plans`
 * drops the plans that would put them together, `conversation_list` changes,
 * and `decline_requests_on_block` has turned any request between them down.
 */
function invalidateAfterBlock(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: planKeys.all });
  void queryClient.invalidateQueries({ queryKey: userKeys.all });
  void queryClient.invalidateQueries({ queryKey: chatKeys.all });
}
