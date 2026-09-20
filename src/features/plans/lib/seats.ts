import type { Plan } from '@shared/data/schemas';
import type { Seat } from '@shared/ui';

/**
 * Turns a plan's participants into the seat row a sheet renders, padding out
 * the remaining capacity with empty seats.
 */
export function seatsFor(plan: Plan, freeLabel: string, viewerLabel: string): Seat[] {
  const taken: Seat[] = plan.participants.map((participant) => ({
    avatarUri: participant.user.avatarUrl,
    label: participant.isViewer ? viewerLabel : participant.user.name,
    isViewer: participant.isViewer,
  }));

  const open = Math.max(0, plan.capacity - taken.length);
  return [...taken, ...Array.from({ length: open }, () => ({ label: freeLabel }))];
}

/** How many seats are still unclaimed. */
export function openSeatCount(plan: Plan): number {
  return Math.max(0, plan.capacity - plan.participants.length);
}
