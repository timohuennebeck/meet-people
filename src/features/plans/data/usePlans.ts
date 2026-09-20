import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { planKeys } from '@shared/data/queryKeys';
import type { Membership, Plan, User } from '@shared/data/schemas';
import { dataSource } from '@shared/data/source';
import { useViewer } from '@shared/data/useViewer';

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

/**
 * Ask to join, withdraw a request, join outright or leave — all one write.
 *
 * The optimistic seat needs the viewer's own profile, which is a query rather
 * than a constant now that the source may be Supabase. Until it has loaded the
 * membership still flips immediately and the seat waits for the refetch: a
 * button that responds is worth more than a face that appears a moment early.
 */
export function useSetMembership(planId: string) {
  const { data: viewer } = useViewer();

  return usePlanMutation<MembershipChange>(
    planId,
    ({ membership, note }) => dataSource.plans.setMembership(planId, membership, note),
    (plan, { membership }) => ({
      ...plan,
      membership,
      participants: seatViewer(plan, membership, viewer),
    }),
  );
}

/** What `useSetMembership` is told: where to move, and the note if it is a request. */
export interface MembershipChange {
  membership: Membership;
  /** The message to the host. Only a request carries one. */
  note?: string;
}

/** The participant list as it will read once this membership change lands. */
function seatViewer(plan: Plan, membership: Membership, viewer: User | undefined) {
  if (membership !== 'joined') {
    return plan.participants.filter((participant) => !participant.isViewer);
  }
  if (!viewer || plan.participants.some((participant) => participant.isViewer)) {
    return plan.participants;
  }
  return [...plan.participants, { user: viewer, isHost: false, isViewer: true }];
}

/**
 * Host accepts a request; the applicant takes the next open seat immediately.
 *
 * `requestId` is the applicant's profile id — a request is the `plan_members`
 * row keyed by `(plan_id, profile_id)`, and `Plan.requests[].id` carries that
 * same id — so the lookup below is by the person, and the seat it appends is
 * theirs.
 */
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
