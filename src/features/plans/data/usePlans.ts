import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { VIEWER } from '@shared/data/fixtures';
import { planKeys } from '@shared/data/queryKeys';
import type { Membership, Plan } from '@shared/data/schemas';
import { dataSource } from '@shared/data/source';

/**
 * Every plan on the map.
 *
 * The day filter above it is presentational for now — the mock source has no
 * day index to narrow by, so it is left out of both the key and the call rather
 * than pretending to filter. See `planKeys.list`.
 */
export function usePlans() {
  return useQuery({
    ...planKeys.list(),
    queryFn: () => dataSource.plans.list(),
  });
}

/** One plan, including its participants, requests and waitlist. */
export function usePlan(planId: string) {
  return useQuery({
    ...planKeys.detail(planId),
    queryFn: () => dataSource.plans.detail(planId),
  });
}

/**
 * Shared optimistic scaffolding: snapshot the plan, let the caller apply the
 * change locally, and roll back if the write fails. Every plan mutation below
 * goes through this so they cannot drift apart.
 *
 * Two writes against the same plan can overlap — the host can tap Accept on a
 * second request before the first has landed — and `scope` alone does not make
 * them safe: React Query serialises the `mutationFn`, but `onMutate` and
 * `onSettled` still run as soon as each mutation is fired. Two things follow
 * from that, and both are handled by counting what is still in flight under
 * this plan's `mutationKey`:
 *
 * - A rollback must not restore a snapshot that predates another write's
 *   optimistic change, so it only runs when nothing else is pending; otherwise
 *   the refetch below settles it.
 * - Only the last write to finish invalidates. Invalidating earlier refetches
 *   server state that has not seen the queued write yet, which makes the row it
 *   removed flicker back into the list.
 */
function usePlanMutation<TVariables>(
  planId: string,
  mutationFn: (variables: TVariables) => Promise<Plan>,
  applyOptimistic: (plan: Plan, variables: TVariables) => Plan,
) {
  const queryClient = useQueryClient();
  const key = planKeys.detail(planId).queryKey;
  const mutationKey = planKeys.mutation(planId);

  /** Counts this mutation too, so 1 means "I am the last one still running". */
  const isLastInFlight = () => queryClient.isMutating({ mutationKey }) <= 1;

  return useMutation({
    mutationKey,
    scope: { id: `plan:${planId}` },
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Plan>(key);
      if (previous) queryClient.setQueryData<Plan>(key, applyOptimistic(previous, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && isLastInFlight()) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      if (!isLastInFlight()) return;
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

/** Ask to join, withdraw a request, join outright or leave — all one write. */
export function useSetMembership(planId: string) {
  return usePlanMutation<Membership>(
    planId,
    (membership) => dataSource.plans.setMembership(planId, membership),
    (plan, membership) => ({
      ...plan,
      membership,
      participants:
        membership === 'joined'
          ? [...plan.participants, { user: VIEWER, isHost: false, isViewer: true }]
          : plan.participants.filter((participant) => !participant.isViewer),
    }),
  );
}

/** Host accepts a request; the applicant takes the next open seat immediately. */
export function useAcceptRequest(planId: string) {
  return usePlanMutation<string>(
    planId,
    (requestId) => dataSource.plans.acceptRequest(planId, requestId),
    (plan, requestId) => {
      const request = plan.requests.find((candidate) => candidate.id === requestId);
      if (!request) return plan;
      return {
        ...plan,
        requests: plan.requests.filter((candidate) => candidate.id !== requestId),
        participants: [
          ...plan.participants,
          { user: request.user, isHost: false, isViewer: false },
        ],
      };
    },
  );
}
