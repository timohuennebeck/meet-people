import type { Plan } from '@shared/data/schemas';
import type { Seat } from '@shared/ui';

/**
 * Turns a plan's participants into the seat row a sheet renders, padding out
 * the remaining capacity with empty seats.
 *
 * A plan with no capacity is an uncapped event, and there is nothing to pad:
 * the grid draws one avatar per seat, so an open-ended plan has no grid to
 * finish. The sheets show who is going instead of how many places are left.
 */
export function seatsFor(plan: Plan, freeLabel: string, viewerLabel: string): Seat[] {
  const taken: Seat[] = plan.participants.map((participant) => ({
    avatarUri: participant.user.avatarUrl,
    label: participant.isViewer ? viewerLabel : participant.user.name,
    isViewer: participant.isViewer,
  }));

  if (plan.capacity === null) return taken;

  const open = Math.max(0, plan.capacity - taken.length);
  return [...taken, ...Array.from({ length: open }, () => ({ label: freeLabel }))];
}

/**
 * How many seats are still unclaimed, or `null` when the plan is uncapped.
 *
 * Null rather than a large number, because every caller has something
 * different to say: the guest sheet drops the "N vagas livres" line, the host
 * sheet never reads as full, and no waitlist can form behind a plan that
 * cannot fill.
 */
export function openSeatCount(plan: Plan): number | null {
  if (plan.capacity === null) return null;
  return Math.max(0, plan.capacity - plan.participants.length);
}
