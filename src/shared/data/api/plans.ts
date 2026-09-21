import { toPlan, type LanguageCode, type NearbyPlanRow } from '@shared/lib/supabase/mapping';

import { DataError } from '../errors';
import type { Membership, NewPlan, Plan } from '../schemas';
import { planContext } from './preferences';
import { client, unwrap, unwrapSingle, viewerId } from './shared';

/**
 * Plans: reading them, creating one, and moving in and out of a seat.
 *
 * `planConversationId()` is exported for the chat group, which needs the same
 * lookup to open a plan's thread. It is the only edge between the two.
 */

/**
 * The viewer's own `plan_members` row on a plan, or null when there is none.
 *
 * One primary-key lookup, readable under the "own row" arm of the select
 * policy whatever its status. `setMembership` reads this rather than the
 * `membership` on the `nearby_plans()` row because that value folds `left` and
 * `declined` into `guest`, and a plan the viewer is leaving may already have
 * dropped out of that list (it stops three hours after the start).
 */
async function ownMembershipRow(planId: string, uid: string) {
  return unwrap(
    await client()
      .from('plan_members')
      .select('status')
      .eq('plan_id', planId)
      .eq('profile_id', uid)
      .maybeSingle(),
  );
}

/** The conversation `private.open_plan_chat()` made for a plan. */
export async function planConversationId(planId: string): Promise<string | null> {
  const row = unwrap(
    await client().from('conversations').select('id').eq('plan_id', planId).maybeSingle(),
  );
  return row?.id ?? null;
}

/**
 * Posts a message into a plan's group chat.
 *
 * Used by the leave sheet, whose note is addressed to the people still going.
 * A plan whose chat has not been opened — it is made by a trigger on the plan's
 * own insert, so this is only ever a plan that predates that trigger — silently
 * has nothing to post to, because failing to leave over an undelivered goodbye
 * would be the worse outcome.
 */
async function postToPlanChat(planId: string, uid: string, body: string): Promise<void> {
  const db = client();
  const conversationId = await planConversationId(planId);
  if (!conversationId) return;

  unwrap(
    await db
      .from('messages')
      .insert({ conversation_id: conversationId, author_id: uid, content: body }),
  );
}

/**
 * Answers one pending request, as the host.
 *
 * `requestId` is the applicant's profile id — a request has no id of its own
 * now that it is the same `plan_members` row as the seat it becomes.
 *
 * The row count is the point. Row-level security filters rather than refuses,
 * so a caller who is not the host, or an applicant who withdrew a moment
 * earlier, produces zero rows and no error at all — and the sheet would seat
 * somebody the database never moved.
 */
async function answerRequest(
  planId: string,
  requestId: string,
  status: 'seated' | 'declined',
): Promise<Plan | null> {
  const answered = await client()
    .from('plan_members')
    .update({ status }, { count: 'exact' })
    .eq('plan_id', planId)
    .eq('profile_id', requestId)
    .eq('status', 'requested');
  unwrap(answered);
  if ((answered.count ?? 0) === 0) throw new DataError('BAD_TRANSITION');
  return findPlan(planId);
}

/**
 * Every plan the viewer may see, in one round trip.
 *
 * `detail` reads the same call and picks its row rather than reading the tables
 * directly: membership, the queue and the distance are all computed inside the
 * function, and a second implementation of any of them would eventually make
 * the card and the sheet say different things about the same plan.
 */
async function fetchPlans(): Promise<Plan[]> {
  const db = client();
  const [context, rows] = await Promise.all([
    planContext(),
    db.rpc('nearby_plans').then((result) => unwrap(result)),
  ]);
  return ((rows ?? []) as unknown as NearbyPlanRow[]).map((row) => toPlan(row, context));
}

async function planDetail(planId: string): Promise<Plan> {
  const plan = await findPlan(planId);
  if (!plan) throw new Error(`Plan ${planId} not found`);
  return plan;
}

/**
 * The plan as `nearby_plans()` now reports it, or `null` when it is not in
 * there any more.
 *
 * That is not the same question as "did the write work". `nearby_plans` drops
 * a plan three hours after it starts and clips the list to the viewer's radius,
 * which the free tier clamps further — so a plan joined from a list rendered a
 * moment ago can be gone by the time the seat is written. Reading that as a
 * failure rolled the seat back and told the person the join had not worked
 * while the server had them seated.
 */
async function findPlan(planId: string): Promise<Plan | null> {
  const plan = (await fetchPlans()).find((candidate) => candidate.id === planId);
  return plan ? plan : null;
}

export const plans = {
  /** Every plan the viewer may see, soonest first. */
  list: async (): Promise<Plan[]> => await fetchPlans(),

  /** One plan, with its participants, its requests and its waitlist. */
  detail: planDetail,

  /**
   * Publishes a plan.
   *
   * Only the `plans` row is written. `private.seat_plan_host()` seats the
   * host and `private.open_plan_chat()` opens the group chat, both on this
   * insert — doing either from here would race them and double up.
   *
   * The insert policy demands `host_id = auth.uid()`, and demands the host be
   * verified unless the plan is capped; an unverified host publishing an
   * uncapped event comes back as a refusal rather than a silent no-op.
   */
  create: async (plan: NewPlan): Promise<Plan> => {
    const db = client();
    const uid = await viewerId();

    const inserted = await db
      .from('plans')
      .insert({
        host_id: uid,
        place_id: plan.placeId,
        title: plan.title.trim(),
        starts_at: plan.startsAt,
        duration_minutes: plan.durationMinutes,
        join_mode: plan.joinMode,
        seats: plan.seats,
        age_min: plan.ageRange?.[0] ?? null,
        age_max: plan.ageRange?.[1] ?? null,
        languages: plan.languages as LanguageCode[],
      })
      .select('id')
      .single();
    const row = unwrapSingle(inserted, 'New plan');

    // Read it back the way every other screen sees it, so the card the host
    // lands on is the same row the map will draw rather than a local echo of
    // what was typed.
    return planDetail(row.id);
  },

  /**
   * Moves the viewer between guest / requested / joined.
   *
   * Everything is one row of `plan_members`, keyed by `(plan_id, profile_id)`,
   * and the triggers decide which moves are legal — a request only on an
   * approval plan, a direct seat only on an open one, and either may be
   * refused with NO_CREDITS, PLAN_FULL or BLOCKED. This just picks the verb.
   *
   * Asking for a seat is an update first and an insert second. The viewer's
   * row does not go away when they leave or are declined — `left` and
   * `declined` are statuses on the same primary key, kept because attendance
   * is derived from them — so asking again has to move that row rather than
   * add one beside it, which the key would refuse. The update reports how
   * many rows it touched; zero means there was no row, and only then is one
   * inserted. Read-then-branch would open a window between the two calls;
   * this way the second write only runs when the first found nothing.
   *
   * Leaving is the one move that needs to know where the viewer stands: a
   * request is withdrawn by deleting the row (the delete policy allows
   * exactly that), a seat is given up by updating it to `left`. The row's
   * own status decides which.
   */
  setMembership: async (
    planId: string,
    membership: Membership,
    note?: string,
  ): Promise<Plan | null> => {
    const db = client();
    const uid = await viewerId();

    switch (membership) {
      case 'requested':
      case 'joined': {
        const status = membership === 'requested' ? 'requested' : 'seated';
        // The note travels with a request and is cleared by a plain join, so
        // a host never reads a message written for a plan the person later
        // walked straight into.
        const message = status === 'requested' ? note?.trim() || null : null;
        const moved = await db
          .from('plan_members')
          .update({ status, message }, { count: 'exact' })
          .eq('plan_id', planId)
          .eq('profile_id', uid);
        unwrap(moved);
        if ((moved.count ?? 0) === 0) {
          unwrap(
            await db
              .from('plan_members')
              .insert({ plan_id: planId, profile_id: uid, status, message }),
          );
        }
        break;
      }

      case 'guest': {
        const own = await ownMembershipRow(planId, uid);
        // "RECADO PARA O GRUPO" on the leave sheet is a message to the plan's
        // chat, and it has to go first: `private.sync_plan_chat()` takes the
        // leaver out of the conversation, and after that the messages insert
        // policy has nothing to let them write through.
        if (own?.status === 'seated' && note?.trim()) {
          await postToPlanChat(planId, uid, note.trim());
        }
        if (own?.status === 'requested') {
          unwrap(
            await db.from('plan_members').delete().eq('plan_id', planId).eq('profile_id', uid),
          );
        } else if (own?.status === 'seated') {
          unwrap(
            await db
              .from('plan_members')
              .update({ status: 'left' })
              .eq('plan_id', planId)
              .eq('profile_id', uid),
          );
        }
        // No row, or one already `left`/`declined`: the viewer is a guest
        // already, and there is nothing to write.
        break;
      }

      default:
        // `host` is decided when the plan is created and `waitlisted` is a
        // position in a derived queue; neither is something a viewer sets.
        throw new Error(`[data] Membership ${membership} is not settable.`);
    }

    return findPlan(planId);
  },

  /**
   * Host accepts a request: the applicant's row moves from `requested` to
   * `seated`. The trigger stamps `seated_at` and may refuse with PLAN_FULL.
   */
  acceptRequest: (planId: string, requestId: string): Promise<Plan | null> =>
    answerRequest(planId, requestId, 'seated'),

  /**
   * Host turns a request down, which is also what gives the applicant their
   * weekly credit back: `private.request_quota_spent()` counts every row that
   * is not `declined`, so a request nobody ever answers costs them one for
   * good.
   */
  declineRequest: (planId: string, requestId: string): Promise<Plan | null> =>
    answerRequest(planId, requestId, 'declined'),

  /**
   * `plan_members.outcome` is not in the column grant — anyone could
   * otherwise award themselves an attendance record, and that number is what
   * a stranger reads before deciding to sit down with somebody. So the write
   * is a function, which checks that the caller hosts this plan and that the
   * plan has actually happened.
   */
  addSeat: async (planId: string, profileId: string): Promise<Plan | null> => {
    unwrap(await client().rpc('add_seat', { plan: planId, profile: profileId }));
    return findPlan(planId);
  },

  /**
   * Host records who turned up, once the plan has ended.
   *
   * `plan_members.outcome` is not in the column grant — anyone could otherwise
   * award themselves an attendance record, and that number is what a stranger
   * reads before deciding to sit down with them — so the write goes through a
   * function that checks the caller hosts this plan and that the plan has
   * actually happened.
   *
   * Everyone seated counts as having attended except the ids passed here, so
   * an honest answer costs a tap only when somebody did not come. Re-running
   * replaces the answer rather than adding to it.
   */
  recordAttendance: async (planId: string, absentIds: readonly string[]): Promise<void> => {
    unwrap(await client().rpc('record_attendance', { plan: planId, absentees: [...absentIds] }));
  },
};
