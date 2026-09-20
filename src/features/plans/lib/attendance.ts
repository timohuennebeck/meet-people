import type { Plan } from '@shared/data/schemas';

/**
 * Who a plan asks about once it is over, and what their row says.
 *
 * The check-list is drawn after the end time has passed, so everything here is
 * derived from the plan the viewer already holds — no attendance is stored yet
 * (`plan_members.outcome` is written by the server, never by a screen), which is why nothing below writes.
 */

export type Attendee = Plan['participants'][number];

/**
 * Whether the plan has finished.
 *
 * An open-ended plan (`durationMinutes: null`) never states an end, so its
 * start is the only marker the data gives and it counts as over once it has
 * begun.
 */
export function hasEnded(plan: Plan, now = new Date()): boolean {
  const end = new Date(plan.startsAt).getTime() + (plan.durationMinutes ?? 0) * 60_000;
  return now.getTime() > end;
}

/**
 * Everyone the viewer is asked about — which is everyone but the viewer. You
 * are not one of the faces on your own check-list, exactly as the leave sheet
 * names the others and leaves "você" to the sentence around them.
 */
export function attendeesOf(plan: Plan): Attendee[] {
  return plan.participants.filter((participant) => !participant.isViewer);
}

/**
 * The grey line under a name, as a key and the values it interpolates. The
 * design shows three: the host with how much they have hosted, someone you
 * have shared plans with, and someone you are meeting for the first time.
 */
export type AttendeeDetail =
  | { key: 'host' }
  | { key: 'hostPlans'; count: number }
  | { key: 'shared'; neighbourhood: string; count: number }
  | { key: 'first' };

export function attendeeDetail({ user, isHost }: Attendee): AttendeeDetail {
  if (isHost) {
    // A host whose plan count has not loaded is still the host; the line simply
    // drops the number rather than claiming zero plans.
    return user.plansCount === undefined
      ? { key: 'host' }
      : { key: 'hostPlans', count: user.plansCount };
  }

  const shared = user.sharedPlansCount ?? 0;
  if (shared > 0) return { key: 'shared', neighbourhood: user.neighbourhood, count: shared };
  return { key: 'first' };
}
