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
 * The mutations are scoped to the plan, which makes React Query run them one at
 * a time: two writes against the same plan would otherwise snapshot each other's
 * optimistic state, and a rollback would take the other write's change with it.
 */
function usePlanMutation<TVariables>(
  planId: string,
  mutationFn: (variables: TVariables) => Promise<Plan>,
  applyOptimistic: (plan: Plan, variables: TVariables) => Plan,
) {
  const queryClient = useQueryClient();
  const key = planKeys.detail(planId).queryKey;

  return useMutation({
    scope: { id: `plan:${planId}` },
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Plan>(key);
      if (previous) queryClient.setQueryData<Plan>(key, applyOptimistic(previous, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
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

/** Host declines a request; the row disappears from the list straight away. */
export function useDeclineRequest(planId: string) {
  return usePlanMutation<string>(
    planId,
    (requestId) => dataSource.plans.declineRequest(planId, requestId),
    (plan, requestId) => ({
      ...plan,
      requests: plan.requests.filter((candidate) => candidate.id !== requestId),
    }),
  );
}
