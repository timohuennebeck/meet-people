import type { z } from 'zod';

import { i18n } from '@shared/i18n';
import { ageFromBirthdate } from '@shared/lib/datetime';
import { supabase } from '@shared/lib/supabase/client';
import {
  avatarUrlFor,
  conversationTimeLabel,
  distanceLabel,
  radiusMetres,
  spokenLanguagesFor,
  toPlan,
  toUser,
  type LanguageCode,
  type NearbyPlanRow,
  type PlanContext,
  type PublicProfileRow,
} from '@shared/lib/supabase/mapping';

import { DataError, throwAsDataError } from '../errors';
import { DEFAULT_PREFERENCES } from '../fixtures';
import {
  conversationSchema,
  messageSchema,
  placeSchema,
  planSchema,
  preferencesSchema,
  profileViewSchema,
  searchResultsSchema,
  userSchema,
  type AudienceGender,
  type Conversation,
  type DistanceUnit,
  type Membership,
  type Message,
  type Place,
  type Plan,
  type Preferences,
  type ProfileView,
  type ReportReason,
  type SearchResults,
  type User,
} from '../schemas';
import type { DataSource, NewPlan } from './types';

/**
 * The Supabase source.
 *
 * One rule runs through it: the server decides, the client renders. Membership,
 * distance, the block exclusion and the pending queue all come back from
 * `nearby_plans()` already resolved, so no screen recomputes them and the list
 * and the sheet cannot disagree. What is left here is the translation into the
 * domain types, which lives in `@shared/lib/supabase/mapping`.
 */

function client() {
  if (!supabase) {
    throw new Error('[data] Supabase source used without credentials configured.');
  }
  return supabase;
}

/** The signed-in profile id, or null. Read from the persisted session, not the network. */
async function sessionId(): Promise<string | null> {
  const { data, error } = await client().auth.getSession();
  if (error) throwAsDataError(error);
  return data.session?.user.id ?? null;
}

/** The signed-in profile id, for the reads and writes that require one. */
async function viewerId(): Promise<string> {
  const id = await sessionId();
  if (!id) throw new Error('[data] No signed-in user.');
  return id;
}

/**
 * Preferences chosen before the account exists.
 *
 * The design asks for a radius, an age range, interests and languages at steps
 * 2 to 4, and only creates the account at step 6. Those answers have no row to
 * land in and no `auth.uid()` for a policy to match, so writing them straight
 * through would fail — and, because the settings controls are optimistic, would
 * visibly snap back to the default the user had just moved away from.
 *
 * They are held here instead and replayed by `flushDeferredPreferences()` the
 * moment a session appears. The same shape as the profile writes in
 * `@features/onboarding/lib/profileWrites`, and for the same reason: a step
 * saves its own answer as the user continues, so an abandoned sign-up keeps
 * everything up to where it stopped.
 *
 * The alternative is reordering the flow so the account comes first, which is a
 * product decision about the design rather than a fix for this one.
 */
let deferredPreferences: Partial<Preferences> = {};

/**
 * Replays the preferences chosen before sign-up. Called from
 * `flushProfileWrites()`, so the two queues drain together and a screen only
 * has to know about one of them.
 */
export async function flushDeferredPreferences(): Promise<void> {
  if (!supabase || Object.keys(deferredPreferences).length === 0) return;
  if (!(await sessionId())) return;

  const patch = deferredPreferences;
  deferredPreferences = {};
  try {
    await supabaseSource.preferences.update(patch);
  } catch (error) {
    // Put it back rather than lose it: a later step, or the next launch, tries
    // again. Anything newer than the failed patch wins, since it is what the
    // user last chose.
    deferredPreferences = { ...patch, ...deferredPreferences };
    console.warn('[data] Could not save the preferences chosen before sign-up:', error);
  }
}

/**
 * How much of a conversation one read brings back. The screen scrolls to the
 * end on open, so this is the tail; older messages need a "load earlier" path
 * that does not exist yet.
 */
const THREAD_PAGE_SIZE = 100;

/**
 * Escapes the three characters `like` treats as syntax, so a search term is
 * matched as itself. Typing `%` otherwise matched every name, and `_` matched
 * any single character.
 */
function likeLiteral(term: string): string {
  return term.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/** Rejects with a typed `DataError` where the schema named the rule it broke. */
function unwrap<T>(result: { data: T; error: unknown | null }): T {
  if (result.error) throwAsDataError(result.error);
  return result.data;
}

/**
 * The same, for a read that must return exactly one row. PostgREST types
 * `.single()` as nullable; a missing row here is a bug, not an empty state.
 */
function unwrapSingle<T>(result: { data: T | null; error: unknown | null }, what: string): T {
  const row = unwrap(result);
  if (row === null) throw new Error(`[data] ${what} not found.`);
  return row;
}

/**
 * Validates on the way out, exactly as the fixture source does.
 *
 * In development a mismatch is a console error and the raw value still renders,
 * so a schema drift is loud without blanking the screen that found it. In
 * production the parse is skipped: the shape has already been checked by then,
 * and a release is not the place to discover it.
 */
function validate<T>(schema: z.ZodType<T>, value: T): T {
  if (!__DEV__) return value;
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  console.error('[data] Value does not match its schema:', result.error.issues);
  return value;
}

/** View rows type every column as nullable; the view's own `where` says otherwise. */
function asProfileRow(row: unknown): PublicProfileRow {
  return row as PublicProfileRow;
}

// ---------------------------------------------------------------------------
// Preferences, which most reads need before they can format anything
// ---------------------------------------------------------------------------

/** The subset of `profiles` columns the settings screen writes. */
type PreferencesUpdate = Partial<{
  radius: number;
  distance_unit: DistanceUnit;
  age_min: number;
  age_max: number;
  audience_gender: 'everyone' | 'women' | 'men' | 'non_binary';
  app_language: string;
  notifications_enabled: boolean;
  interests: string[];
  languages: LanguageCode[];
}>;

const AUDIENCE_TO_DB: Record<AudienceGender, 'everyone' | 'women' | 'men' | 'non_binary'> = {
  everyone: 'everyone',
  women: 'women',
  men: 'men',
  nonBinary: 'non_binary',
};

const AUDIENCE_FROM_DB: Record<'everyone' | 'women' | 'men' | 'non_binary', AudienceGender> = {
  everyone: 'everyone',
  women: 'women',
  men: 'men',
  non_binary: 'nonBinary',
};

/**
 * The viewer's id, radius and unit — what a plan needs before it can say how
 * far away it is or where its pin goes.
 */
async function planContext(): Promise<PlanContext> {
  const db = client();
  const uid = await viewerId();
  const row = unwrap(
    await db.from('profiles').select('radius, distance_unit').eq('id', uid).maybeSingle(),
  );
  const unit: DistanceUnit = row?.distance_unit ?? 'mi';
  // The default matches `profiles.radius`'s own default, so a profile whose row
  // has not been created yet still places its pins somewhere sensible.
  const radius = row?.radius ?? 2;
  return { viewerId: uid, radiusM: radiusMetres(radius, unit), unit };
}

/** The plan ids the viewer currently holds a seat on — the "em comum" denominator. */
async function viewerPlanIds(): Promise<string[]> {
  const db = client();
  const uid = await viewerId();
  const rows = unwrap(
    await db.from('plan_members').select('plan_id').eq('profile_id', uid).eq('status', 'seated'),
  );
  return (rows ?? []).map((row) => row.plan_id);
}

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

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

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
  return plan ? validate(planSchema, plan) : null;
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/** How many of the given people share a plan with the viewer, keyed by profile id. */
async function sharedPlanCounts(profileIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (profileIds.length === 0) return counts;
  const planIds = await viewerPlanIds();
  if (planIds.length === 0) return counts;

  const rows = unwrap(
    await client()
      .from('plan_members')
      .select('profile_id')
      .in('plan_id', planIds)
      .in('profile_id', profileIds)
      .eq('status', 'seated'),
  );
  for (const row of rows ?? []) {
    counts.set(row.profile_id, (counts.get(row.profile_id) ?? 0) + 1);
  }
  return counts;
}

/** "Kreuzberg · 2 planos em comum" — the line under a name in people search. */
function searchDetailLine(neighbourhood: string, shared: number): string {
  const sharedLine =
    shared === 0 ? i18n.t('search.noSharedPlans') : i18n.t('search.sharedPlans', { count: shared });
  if (!neighbourhood) return sharedLine;
  return i18n.t('search.resultDetail', { neighbourhood, shared: sharedLine });
}

async function searchPeople(term: string): Promise<SearchResults> {
  const needle = term.trim();
  if (needle.length === 0) return [];

  const db = client();
  const uid = await viewerId();
  const rows =
    unwrap(
      await db
        .from('public_profiles')
        .select('*')
        .ilike('name', `%${likeLiteral(needle)}%`)
        .neq('id', uid)
        .order('name')
        .limit(20),
    ) ?? [];

  const profiles = rows.map(asProfileRow);
  const counts = await sharedPlanCounts(profiles.map((profile) => profile.id));

  return validate(
    searchResultsSchema,
    profiles.map((profile) => {
      const shared = counts.get(profile.id) ?? 0;
      return {
        user: toUser(profile, { sharedPlansCount: shared || undefined }),
        detail: searchDetailLine(profile.neighbourhood ?? '', shared),
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

interface ConversationMemberJson {
  id: string;
  name: string | null;
  avatarStoragePath: string | null;
}

/**
 * A `conversation_list` row as the list renders it.
 *
 * `online` and `onlineCount` are absent from the view on purpose — presence
 * comes over Realtime and a stored boolean is wrong seconds after a connection
 * drops — so they read as nobody until that channel exists.
 */
function toConversation(row: {
  id: string | null;
  kind: string | null;
  title: string | null;
  members: unknown;
  member_count: number | null;
  preview: string | null;
  last_message_at: string | null;
  unread_count: number | null;
}): Conversation {
  const id = row.id ?? '';
  const members = (row.members ?? []) as ConversationMemberJson[];
  const avatarUrls = members
    .slice(0, 2)
    .map((member) => avatarUrlFor(member.avatarStoragePath, member.id));
  const memberCount = row.member_count ?? 1;
  const extra = memberCount - avatarUrls.length;

  return {
    id,
    kind: row.kind === 'group' ? 'group' : 'direct',
    title: row.title ?? '',
    // A conversation with no other members still has to draw one avatar; the
    // fallback is seeded on the conversation so it at least stays put.
    avatarUrls: avatarUrls.length > 0 ? avatarUrls : [avatarUrlFor(null, id)],
    extraMembers: extra > 0 ? extra : undefined,
    preview: row.preview ?? '',
    timeLabel: conversationTimeLabel(row.last_message_at),
    unreadCount: row.unread_count ?? 0,
    memberCount,
    onlineCount: 0,
  };
}

/** A row of `messages`. */
interface MessageRow {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

/** A `messages` row as a bubble. */
function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    body: row.content,
    createdAt: row.created_at,
  };
}

/** The design puts a receipt under the newest own message and nowhere else. */
function withSentReceipt(messages: Message[], uid: string): Message[] {
  let newestOwn = -1;
  messages.forEach((message, index) => {
    if (message.authorId === uid) newestOwn = index;
  });
  if (newestOwn === -1) return messages;
  return messages.map((message, index) =>
    index === newestOwn ? { ...message, receipt: i18n.t('chat.sent') } : message,
  );
}

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

/**
 * Places with their distance from the viewer, nearest first.
 *
 * `distance_to()` takes one place at a time — it is the function that lets a
 * client learn a distance without ever seeing a coordinate — so this is one
 * call per row. That is fine for the handful the create flow offers and wrong
 * for a list; a `nearby_places()` RPC alongside `nearby_plans()` is what
 * replaces it.
 */
async function placesWithDistance(
  rows: { id: string; name: string; address: string; provider_place_id: string | null }[],
  unit: DistanceUnit,
): Promise<Place[]> {
  const db = client();
  const withDistance = await Promise.all(
    rows.map(async (row) => ({
      row,
      metres: unwrap(await db.rpc('distance_to', { place: row.id })),
    })),
  );

  return withDistance
    .sort((a, b) => (a.metres ?? Infinity) - (b.metres ?? Infinity))
    .map(({ row, metres }) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      distanceLabel: distanceLabel(metres, unit),
      providerPlaceId: row.provider_place_id ?? undefined,
    }));
}

// ---------------------------------------------------------------------------
// The source
// ---------------------------------------------------------------------------

export const supabaseSource: DataSource = {
  plans: {
    list: async (): Promise<Plan[]> => validate(planSchema.array(), await fetchPlans()),

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
  },

  users: {
    /**
     * The signed-in user, from their own `profiles` row.
     *
     * The base table rather than `public_profiles`, because this is the one
     * person entitled to everything it holds — the age below is computed from
     * the `birthdate` no other screen ever sees, and the interests and the
     * languages are columns beside it, so the whole person is one read.
     * `verified` is the exception: it is derived from the verification
     * submissions, which only the view can reach, so it comes from there.
     */
    me: async (): Promise<User> => {
      const db = client();
      const uid = await viewerId();

      const [profile, publicRow] = await Promise.all([
        db
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single()
          .then((result) => unwrapSingle(result, `Profile ${uid}`)),
        db
          .from('public_profiles')
          .select('verified')
          .eq('id', uid)
          .maybeSingle()
          .then((result) => unwrap(result)),
      ]);

      return validate(userSchema, {
        id: profile.id,
        name: profile.name,
        age: profile.birthdate ? ageFromBirthdate(new Date(profile.birthdate)) : 18,
        avatarUrl: avatarUrlFor(profile.avatar_storage_path, profile.id),
        verified: publicRow?.verified ?? false,
        neighbourhood: profile.neighbourhood ?? '',
        countryCode: profile.country_code ?? undefined,
        pronouns: profile.pronouns ?? undefined,
        bio: profile.bio ?? undefined,
        interests: profile.interests,
        languages: spokenLanguagesFor(profile.languages),
        joinedAt: profile.created_at,
      });
    },

    /** Somebody else's profile, as `public_profiles` is willing to show it. */
    detail: async (userId: string): Promise<User> => {
      const db = client();

      const [row, attendanceRate, plansCount, sharedCounts] = await Promise.all([
        db
          .from('public_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
          .then((result) => unwrap(result)),
        db.rpc('attendance_rate_of', { uid: userId }).then((result) => unwrap(result)),
        db
          .from('plan_members')
          .select('plan_id', { count: 'exact', head: true })
          .eq('profile_id', userId)
          .eq('status', 'seated')
          .then((result) => {
            if (result.error) throwAsDataError(result.error);
            return result.count ?? 0;
          }),
        sharedPlanCounts([userId]),
      ]);

      if (!row) throw new Error(`User ${userId} not found`);

      return validate(
        userSchema,
        toUser(asProfileRow(row), {
          attendanceRate,
          plansCount,
          sharedPlansCount: sharedCounts.get(userId) ?? 0,
        }),
      );
    },

    search: searchPeople,

    /**
     * Recently viewed profiles.
     *
     * Nothing records a profile view — there is no table behind this and no
     * screen that writes one — so it is an empty list rather than a guess.
     * A `profile_views` table, or a client-side list in AsyncStorage, is what
     * fills it; inventing rows from search history would put people under
     * "BUSCAS RECENTES" the viewer never looked at.
     */
    recent: (): Promise<SearchResults> => Promise.resolve([]),

    /**
     * How many people looked this week. Free, and the only half of this the
     * paywall shows a free account — which is why it is its own round trip
     * rather than the length of the list below.
     */
    viewCount: async (): Promise<number> => unwrap(await client().rpc('profile_view_count')) ?? 0,

    /**
     * Who looked, newest first.
     *
     * `viewer` is a whole `public_profiles` row as JSON, so it goes through
     * the same `toUser` as a participant embedded on a plan and a viewer
     * renders exactly what their profile would. A free account is refused by
     * the function, and `unwrap` turns that into the `PLUS_REQUIRED`
     * `DataError` the screen answers with the paywall.
     */
    viewers: async (): Promise<ProfileView[]> => {
      const rows = unwrap(await client().rpc('profile_viewers'));
      return validate(
        profileViewSchema.array(),
        (rows ?? []).map((row) => ({
          user: toUser(asProfileRow(row.viewer)),
          viewedAt: new Date(row.viewed_at).toISOString(),
        })),
      );
    },

    /**
     * Records that the viewer opened somebody's profile.
     *
     * Nothing is checked here first. The function drops a look at your own
     * profile, at somebody who blocked you and at a half-finished one, and
     * returns void either way — the server is what decides a view is not worth
     * recording, and it never says so. What is *not* swallowed is the call
     * failing: a request that never arrived is a different thing from one the
     * server chose to ignore, and the caller decides what to do about it.
     */
    recordView: async (userId: string): Promise<void> => {
      unwrap(await client().rpc('record_profile_view', { profile: userId }));
    },
  },

  chats: {
    conversations: async (): Promise<Conversation[]> => {
      const rows = unwrap(
        await client()
          .from('conversation_list')
          .select('*')
          .order('last_message_at', { ascending: false, nullsFirst: false }),
      );
      return validate(conversationSchema.array(), (rows ?? []).map(toConversation));
    },

    /**
     * One RPC finds or creates the thread and seats both people in it. The
     * Plus gate and the block check live in the function, so a screen only
     * has to read the `DataError` it comes back with.
     */
    openDirect: async (userId: string): Promise<string> =>
      unwrapSingle(
        await client().rpc('open_direct_conversation', { other: userId }),
        'Direct conversation',
      ),

    markRead: async (conversationId: string): Promise<void> => {
      const db = client();
      const uid = await viewerId();
      unwrap(
        await db
          .from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('profile_id', uid),
      );
    },

    thread: async (conversationId: string): Promise<Message[]> => {
      const db = client();
      const uid = await viewerId();
      // Newest first so the limit keeps the end of the conversation rather
      // than its beginning, then reversed for the screen, which renders
      // oldest at the top. A months-old group chat would otherwise be fetched
      // whole every time it is opened.
      const rows = unwrap(
        await db
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(THREAD_PAGE_SIZE),
      );
      const messages = (rows ?? []).reverse().map(toMessage);
      return validate(messageSchema.array(), withSentReceipt(messages, uid));
    },

    send: async (conversationId: string, body: string): Promise<Message> => {
      const db = client();
      const uid = await viewerId();
      const row = unwrapSingle<MessageRow>(
        await db
          .from('messages')
          .insert({ conversation_id: conversationId, author_id: uid, content: body })
          .select('*')
          .single(),
        'Sent message',
      );
      return validate(messageSchema, { ...toMessage(row), receipt: i18n.t('chat.sent') });
    },

    /**
     * No-op.
     *
     * `receive` exists to play the design's scripted reply back on the fixture
     * source. A real incoming message arrives on the `messages` Realtime
     * publication, which writes into the thread cache directly; there is
     * nothing for a client to insert on somebody else's behalf, and the RLS
     * policy would refuse it if there were.
     */
    receive: (): Promise<Message | null> => Promise.resolve(null),
  },

  safety: {
    /**
     * Files a report. The reporter is `auth.uid()`: the insert policy takes
     * nothing else, and `no_self_report` refuses a report against yourself.
     */
    report: async (
      subjectId: string,
      reason: ReportReason,
      detail: string,
      planId?: string,
    ): Promise<void> => {
      const db = client();
      const uid = await viewerId();
      unwrap(
        await db.from('reports').insert({
          reporter_id: uid,
          subject_id: subjectId,
          plan_id: planId ?? null,
          reason,
          detail: detail.trim() || null,
        }),
      );
    },

    /**
     * Blocks somebody. Idempotent: blocking a second time is not an error the
     * screen should show, so a duplicate key is ignored rather than raised.
     *
     * `private.decline_requests_on_block()` fires on the insert and turns any
     * request between the two down, which is also what refunds the applicant's
     * weekly credit.
     */
    block: async (profileId: string): Promise<void> => {
      const db = client();
      const uid = await viewerId();
      const result = await db.from('blocks').insert({ blocker_id: uid, blocked_id: profileId });
      // 23505: already blocked.
      if (result.error && result.error.code !== '23505') throwAsDataError(result.error);
    },

    unblock: async (profileId: string): Promise<void> => {
      const db = client();
      const uid = await viewerId();
      unwrap(await db.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', profileId));
    },
  },

  places: {
    /** Places the viewer added themselves, which is what "recent" means so far. */
    recent: async (): Promise<Place[]> => {
      const db = client();
      const uid = await viewerId();
      const { unit } = await planContext();
      const rows = unwrap(
        await db
          .from('places')
          .select('id, name, address, provider_place_id')
          .eq('profile_id', uid)
          .order('created_at', { ascending: false })
          .limit(8),
      );
      return validate(placeSchema.array(), await placesWithDistance(rows ?? [], unit));
    },

    nearby: async (): Promise<Place[]> => {
      const db = client();
      const { unit } = await planContext();
      const rows = unwrap(
        await db.from('places').select('id, name, address, provider_place_id').limit(12),
      );
      return validate(placeSchema.array(), await placesWithDistance(rows ?? [], unit));
    },
  },

  preferences: {
    /**
     * The viewer's preferences, which are columns on their `profiles` row —
     * discovery settings, the app's own settings, and the two lists the
     * settings screen edits on the same page. One read covers all of them.
     */
    get: async (): Promise<Preferences> => {
      const db = client();
      const uid = await sessionId();

      // Before the account exists there is no row to read. The column defaults
      // are the fixture defaults, so the early steps open on the same values
      // they would have after sign-up, with anything already chosen on top.
      if (!uid) {
        return validate(preferencesSchema, { ...DEFAULT_PREFERENCES, ...deferredPreferences });
      }

      const row = await db
        .from('profiles')
        .select(
          'radius, distance_unit, age_min, age_max, audience_gender, interests, languages, app_language, notifications_enabled',
        )
        .eq('id', uid)
        .single()
        .then((result) => unwrapSingle(result, 'Preferences'));

      return validate(preferencesSchema, {
        radius: row.radius,
        distanceUnit: row.distance_unit,
        ageRange: [row.age_min, row.age_max],
        audienceGender: AUDIENCE_FROM_DB[row.audience_gender],
        interests: row.interests,
        spokenLanguages: spokenLanguagesFor(row.languages),
        appLanguage: row.app_language,
        notificationsEnabled: row.notifications_enabled,
      });
    },

    /**
     * Applies a patch.
     *
     * Every field is a column on the same row, so the whole patch is one
     * update — interests and languages included, since assigning an array is
     * how a list is replaced now. The update may be refused with
     * TOO_MANY_INTERESTS: the cap and the case-insensitive uniqueness of the
     * interest list are check constraints on `profiles`, and `toDataError`
     * folds either onto that code.
     */
    update: async (patch: Partial<Preferences>): Promise<Preferences> => {
      const db = client();
      const uid = await sessionId();

      if (!uid) {
        deferredPreferences = { ...deferredPreferences, ...patch };
        return validate(preferencesSchema, { ...DEFAULT_PREFERENCES, ...deferredPreferences });
      }

      const columns: PreferencesUpdate = {};
      if (patch.radius !== undefined) columns.radius = patch.radius;
      if (patch.distanceUnit !== undefined) columns.distance_unit = patch.distanceUnit;
      if (patch.ageRange !== undefined) {
        columns.age_min = patch.ageRange[0];
        columns.age_max = patch.ageRange[1];
      }
      if (patch.audienceGender !== undefined) {
        columns.audience_gender = AUDIENCE_TO_DB[patch.audienceGender];
      }
      if (patch.appLanguage !== undefined) columns.app_language = patch.appLanguage;
      if (patch.notificationsEnabled !== undefined) {
        columns.notifications_enabled = patch.notificationsEnabled;
      }
      if (patch.interests !== undefined) columns.interests = [...patch.interests];
      if (patch.spokenLanguages !== undefined) {
        // The column is the `language_code` enum and `SpokenLanguage.code` is
        // a validated `string` — it also carries codes read back out of the
        // database and out of `nearby_plans()`' untyped JSON, so it cannot be
        // the enum itself. What makes the narrowing sound is that every code a
        // person can pick comes from the catalogue in `@shared/lib/languages`,
        // and `LanguageCatalogueCode` there is checked against this same enum
        // at compile time: a catalogue entry the enum lacks fails `typecheck`
        // rather than reaching Postgres.
        columns.languages = patch.spokenLanguages.map((language) => language.code as LanguageCode);
      }

      if (Object.keys(columns).length > 0) {
        unwrap(await db.from('profiles').update(columns).eq('id', uid));
      }

      return supabaseSource.preferences.get();
    },
  },
};
