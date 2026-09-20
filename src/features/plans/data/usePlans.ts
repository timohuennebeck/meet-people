import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { VIEWER } from '@shared/data/fixtures';
import { planKeys } from '@shared/data/queryKeys';
import type { Membership, Plan } from '@shared/data/schemas';
import { dataSource } from '@shared/data/source';

/** Every plan on the map, for the selected day filter. */
export function usePlans(filter = 'today') {
  return useQuery({
    ...planKeys.list(filter),
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
 */
function usePlanMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Plan>,
  applyOptimistic: (plan: Plan, variables: TVariables) => Plan,
  planIdOf: (variables: TVariables) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      const key = planKeys.detail(planIdOf(variables)).queryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Plan>(key);
      if (previous) queryClient.setQueryData<Plan>(key, applyOptimistic(previous, variables));
      return { key, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context) void queryClient.invalidateQueries({ queryKey: context.key });
      void queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

/** Ask to join, withdraw a request, join outright or leave — all one write. */
export function useSetMembership() {
  return usePlanMutation<{ planId: string; membership: Membership }>(
    ({ planId, membership }) => dataSource.plans.setMembership(planId, membership),
    (plan, { membership }) => ({
      ...plan,
      membership,
      participants:
        membership === 'joined'
          ? [...plan.participants, { user: VIEWER, isHost: false, isViewer: true }]
          : plan.participants.filter((participant) => !participant.isViewer),
    }),
    ({ planId }) => planId,
  );
}

/** Host accepts a request; the applicant takes the next open seat immediately. */
export function useAcceptRequest() {
  return usePlanMutation<{ planId: string; requestId: string }>(
    ({ planId, requestId }) => dataSource.plans.acceptRequest(planId, requestId),
    (plan, { requestId }) => {
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
    ({ planId }) => planId,
  );
}

/** Host declines a request; the row disappears from the list straight away. */
export function useDeclineRequest() {
  return usePlanMutation<{ planId: string; requestId: string }>(
    ({ planId, requestId }) => dataSource.plans.declineRequest(planId, requestId),
    (plan, { requestId }) => ({
      ...plan,
      requests: plan.requests.filter((candidate) => candidate.id !== requestId),
    }),
    ({ planId }) => planId,
  );
}
