import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { plans } from '@shared/data/api/plans';
import { useViewer } from '@shared/data/queries/use-viewer';
import { chatKeys, planKeys, userKeys } from '@shared/data/query-keys';
import type { Membership, Plan, User, NewPlan } from '@shared/data/schemas';

/**
 * Every plan on the map: upcoming, inside the radius, ordered by `starts_at`.
 *
 * The day filter above it narrows this list in the screen rather than in the
 * query — the rows are already here, so the chips are a `useMemo` and not a
 * round trip, and the key stays one list. See `planKeys.list`.
 */
export function usePlans() {
  return useQuery({
    ...planKeys.list(),
    queryFn: () => plans.list(),
  });
}

/** One plan, including its participants, requests and waitlist. */
export function usePlan(planId: string) {
  return useQuery({
    ...planKeys.detail(planId),
    queryFn: () => plans.detail(planId),
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
  // The plan comes back `null` when the write landed on one the viewer can no
  // longer see — past its start, or outside a radius that has since narrowed.
  // Nothing here reads the result: the optimistic state stands and `onSettled`
  // refetches, so `null` is a success with nothing new to show.
  mutationFn: (variables: TVariables) => Promise<Plan | null>,
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
      // A seat change is not only a seat change. `private.sync_plan_chat()`
      // adds or removes the `conversation_members` row for the plan's group
      // chat, so joining makes a thread the Chats tab would not show and
      // leaving leaves a dead one behind. The same move changes `plansCount`
      // and `sharedPlansCount`, which hang off the profile screens.
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations().queryKey });
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
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
    ({ membership, note }) => plans.setMembership({ planId, membership, note }),
    (plan, { membership }) => ({
      ...plan,
      membership,
      participants: seatViewer({ plan, membership, viewer }),
    }),
  );
}

/** What `useSetMembership` is told: where to move, and the note if it is a request. */
export interface MembershipChange {
  membership: Membership;
  /**
   * A message that travels with the move: to the host on a request, to the
   * plan's group chat on the way out. A plain join carries none.
   */
  note?: string;
}

/** The participant list as it will read once this membership change lands. */
function seatViewer({
  plan,
  membership,
  viewer,
}: {
  plan: Plan;
  membership: Membership;
  /** Undefined until the viewer's own profile has loaded. */
  viewer: User | undefined;
}) {
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
    (requestId) => plans.acceptRequest(planId, requestId),
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

/**
 * Host makes room for somebody on the waitlist.
 *
 * The seat and the person arrive together, so the optimistic update does both:
 * the plan grows by one and they move off the list into it.
 */
export function useAddSeat(planId: string) {
  return usePlanMutation<string>(
    planId,
    (profileId) => plans.addSeat(planId, profileId),
    (plan, profileId) => {
      const waiting = plan.waitlist.find((candidate) => candidate.id === profileId);
      if (!waiting) return plan;
      return {
        ...plan,
        capacity: plan.capacity === null ? null : plan.capacity + 1,
        waitlist: plan.waitlist.filter((candidate) => candidate.id !== profileId),
        requests: plan.requests.filter((candidate) => candidate.id !== profileId),
        participants: [
          ...plan.participants,
          { user: waiting.user, isHost: false, isViewer: false },
        ],
      };
    },
  );
}

/**
 * Host turns a request down; it leaves the list and seats nobody.
 *
 * This is also the only thing that gives the applicant their weekly request
 * credit back — `private.request_quota_spent()` counts every row that is not
 * `declined` — so a host who has no way to say no costs each applicant one for
 * good, and on the free tier three of those end every further request with
 * `NO_CREDITS`.
 */
export function useDeclineRequest(planId: string) {
  return usePlanMutation<string>(
    planId,
    (requestId) => plans.declineRequest(planId, requestId),
    (plan, requestId) => ({
      ...plan,
      requests: plan.requests.filter((candidate) => candidate.id !== requestId),
    }),
  );
}

/**
 * Publishes the plan the create flow has been collecting.
 *
 * Nothing is optimistic: until the insert returns there is no plan and no id
 * to navigate to, and a refusal — an unverified host publishing an uncapped
 * event, a place that has gone — has to reach the last step rather than a
 * confirmation screen that lies.
 */
export function usePublishPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: NewPlan) => plans.create(plan),
    onSuccess: (plan) => {
      queryClient.setQueryData(planKeys.detail(plan.id).queryKey, plan);
      void queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      // `open_plan_chat` made the group chat and `seat_plan_host` seated the
      // host, so both the Chats tab and the host's own counts have moved.
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations().queryKey });
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Host records who turned up.
 *
 * `plan_members.outcome` is what `attendance_rate_of` counts, and that number
 * is what a stranger reads before deciding to sit down with somebody — so the
 * column is not in the client's grant and this goes through a function that
 * checks the caller hosts the plan and that the plan has ended.
 */
export function useRecordAttendance(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (absentIds: readonly string[]) => plans.recordAttendance(planId, absentIds),
    onSuccess: () => {
      // Everyone in the plan has a new attendance rate on their profile.
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      void queryClient.invalidateQueries({ queryKey: planKeys.detail(planId).queryKey });
    },
  });
}
