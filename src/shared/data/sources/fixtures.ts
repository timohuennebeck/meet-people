import { z } from 'zod';

import { i18n } from '@shared/i18n';
import { whenLabel } from '@shared/lib/supabase/mapping';

import * as fixtures from '../fixtures';
import {
  conversationSchema,
  messageSchema,
  placeSchema,
  planSchema,
  preferencesSchema,
  profileViewSchema,
  searchResultsSchema,
  userSchema,
  type Conversation,
  type Membership,
  type Message,
  type Place,
  type Plan,
  type Preferences,
  type ProfileView,
  type User,
} from '../schemas';
import type { DataSource, NewPlan } from './types';

/**
 * The in-memory source, transcribed from the design.
 *
 * It is not a leftover. It is what runs with no `.env` — a fresh clone, a
 * design review, a screenshot pass — and it is the only thing that renders a
 * screen when the network is down in development. Every method mutates a local
 * copy and resolves, so optimistic updates and rollbacks behave exactly as they
 * do against Supabase.
 */

/** Mutable copies, so optimistic mutations have somewhere to land. */
let plans: Plan[] = fixtures.PLANS.map((plan) => ({ ...plan }));
let preferences: Preferences = { ...fixtures.DEFAULT_PREFERENCES };
const threads = new Map<string, Message[]>([
  ['c-mara', [...fixtures.DIRECT_MESSAGES]],
  ['c-run', [...fixtures.GROUP_MESSAGES]],
]);

/** Stands in for network latency so loading states are exercised in development. */
const LATENCY_MS = 120;

/**
 * Who looked at the viewer's profile, and how long ago.
 *
 * Built on every read rather than written down once, so the three of them stay
 * inside the seven-day window the count is about however long the app has been
 * open — a fixed timestamp would quietly drop out of "esta semana" and leave
 * the row saying three and the list showing none.
 */
function profileViews(): ProfileView[] {
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
  return [
    { user: fixtures.SARA, viewedAt: hoursAgo(4) },
    { user: fixtures.LEA, viewedAt: hoursAgo(27) },
    { user: fixtures.NOAH, viewedAt: hoursAgo(74) },
  ];
}

/**
 * Resolves a value after the simulated latency, validating it on the way out.
 *
 * Fixtures are trusted, so in production the parse is skipped and the value
 * passes straight through. In development it runs and the *parsed* value is
 * what resolves, so defaults and coercions apply here exactly as they do on the
 * Supabase source — and drift surfaces as a console error rather than silently
 * rendering a shape the schema rejects.
 */
function settle<T>(schema: z.ZodType<T>, value: T): Promise<T> {
  let resolved = value;
  if (__DEV__) {
    const result = schema.safeParse(value);
    if (result.success) resolved = result.data;
    else console.error('[data] Value does not match its schema:', result.error.issues);
  }
  return new Promise((resolve) => setTimeout(() => resolve(resolved), LATENCY_MS));
}

/**
 * Answers one pending request. Accepting seats the applicant; declining just
 * takes the request off the list — there is no declined pile to render.
 */
function answerRequest(planId: string, requestId: string, seat: boolean): Promise<Plan> {
  let updated: Plan | undefined;
  plans = plans.map((plan) => {
    if (plan.id !== planId) return plan;
    const request = plan.requests.find((candidate) => candidate.id === requestId);
    if (!request) return plan;
    updated = {
      ...plan,
      requests: plan.requests.filter((candidate) => candidate.id !== requestId),
      participants: seat
        ? [...plan.participants, { user: request.user, isHost: false, isViewer: false }]
        : plan.participants,
    };
    return updated;
  });
  if (!updated) return Promise.reject(new Error(`Request ${requestId} not found`));
  return settle(planSchema, updated);
}

export const fixtureSource: DataSource = {
  plans: {
    // A copy, so the cache never holds the same array this module mutates.
    list: (): Promise<Plan[]> => settle(planSchema.array(), [...plans]),

    /**
     * Publishes a plan into the in-memory list, seating the viewer as its host
     * the way `seat_plan_host()` does on the real insert.
     *
     * The pin is placed near the middle of the map canvas rather than derived
     * from the place, which has no coordinates here — enough for the new plan
     * to be visible and tappable in the offline flow.
     */
    create: (plan: NewPlan): Promise<Plan> => {
      const place =
        [...fixtures.RECENT_PLACES, ...fixtures.NEARBY_PLACES].find(
          (candidate) => candidate.id === plan.placeId,
        ) ?? fixtures.NEARBY_PLACES[0]!;
      const created: Plan = {
        id: `plan-${Date.now()}`,
        title: plan.title,
        languages: plan.languages,
        joinMode: plan.joinMode,
        membership: 'host',
        host: fixtures.VIEWER,
        place,
        whenLabel: whenLabel(plan.startsAt, plan.durationMinutes),
        startsAt: plan.startsAt,
        durationMinutes: plan.durationMinutes,
        capacity: plan.seats,
        participants: [{ user: fixtures.VIEWER, isHost: true, isViewer: true }],
        requests: [],
        waitlist: [],
        ageRange: plan.ageRange ? [plan.ageRange[0], plan.ageRange[1]] : null,
        pin: { x: 196, y: 300 },
        pinLabel: plan.title,
      };

      plans = [created, ...plans];
      return settle(planSchema, created);
    },

    detail: (planId: string): Promise<Plan> => {
      const plan = plans.find((candidate) => candidate.id === planId);
      if (!plan) return Promise.reject(new Error(`Plan ${planId} not found`));
      return settle(planSchema, plan);
    },

    /**
     * Moves the viewer between guest / requested / joined states on a plan. The
     * note is accepted for the interface's sake and dropped: no fixture screen
     * renders the viewer's own request row, so there is nowhere to show it.
     */
    setMembership: (planId: string, membership: Membership, _note?: string): Promise<Plan> => {
      let updated: Plan | undefined;
      plans = plans.map((plan) => {
        if (plan.id !== planId) return plan;
        const participants =
          membership === 'joined'
            ? [...plan.participants, { user: fixtures.VIEWER, isHost: false, isViewer: true }]
            : plan.participants.filter((participant) => !participant.isViewer);
        updated = { ...plan, membership, participants };
        return updated;
      });
      if (!updated) return Promise.reject(new Error(`Plan ${planId} not found`));
      return settle(planSchema, updated);
    },

    /** Accepts a pending request, seating the applicant. */
    acceptRequest: (planId: string, requestId: string): Promise<Plan> =>
      answerRequest(planId, requestId, true),

    declineRequest: (planId: string, requestId: string): Promise<Plan> =>
      answerRequest(planId, requestId, false),

    /**
     * Accepted and dropped: no fixture screen reads an outcome back, and the
     * attendance rate the design draws is a constant on the profile.
     */
    /** Widen the plan, then seat them — the same two steps the function does. */
    addSeat: (planId: string, profileId: string): Promise<Plan> => {
      plans = plans.map((plan) =>
        plan.id === planId && plan.capacity !== null
          ? { ...plan, capacity: plan.capacity + 1 }
          : plan,
      );
      return answerRequest(planId, profileId, true);
    },

    recordAttendance: (): Promise<void> => Promise.resolve(),
  },

  users: {
    me: (): Promise<User> => settle(userSchema, fixtures.VIEWER),
    detail: (userId: string): Promise<User> => {
      const user = fixtures.PEOPLE[userId];
      if (!user) return Promise.reject(new Error(`User ${userId} not found`));
      return settle(userSchema, user);
    },
    search: (term: string) =>
      settle(
        searchResultsSchema,
        term.trim().length === 0
          ? []
          : fixtures.SEARCH_RESULTS.filter((result) =>
              result.user.name.toLowerCase().includes(term.trim().toLowerCase()),
            ),
      ),
    recent: () => settle(searchResultsSchema, fixtures.RECENT_SEARCHES),

    /** Three, which is what `viewers` lists — the offline path renders the same screen. */
    viewCount: (): Promise<number> => settle(z.number().int().min(0), profileViews().length),

    viewers: (): Promise<ProfileView[]> => settle(profileViewSchema.array(), profileViews()),

    /**
     * Accepted and dropped.
     *
     * A look is recorded against the person who was looked at, and the only
     * profile this source can answer for is the viewer's own — there is
     * nowhere for somebody else's `profile_views` row to land and nothing that
     * would read it back. It resolves rather than refuses because the screen
     * doing the recording has no state to change either way.
     */
    recordView: (_userId: string): Promise<void> => Promise.resolve(),
  },

  chats: {
    conversations: (): Promise<Conversation[]> =>
      settle(conversationSchema.array(), fixtures.CONVERSATIONS),

    /**
     * The fixture conversations carry the unread counts the design draws, and
     * they are what the Chats tab is *for* here — clearing them would empty the
     * screen this source exists to render.
     */
    markRead: (): Promise<void> => Promise.resolve(),

    /**
     * The fixture plans and the fixture conversations were transcribed from
     * the design separately, so only the run has both halves. Everything else
     * answers `null`, which the sheet reads as "no chat to open yet".
     */
    planConversation: (planId: string): Promise<string | null> =>
      Promise.resolve(planId === 'plan-run' ? 'c-run' : null),

    /**
     * Nothing to watch: the only other person in a fixture thread is the
     * scripted reply, which `useScriptedThread` plays back locally.
     */
    subscribeToMessages: (): (() => void) => () => undefined,

    /**
     * The design scripts one direct thread, with Sara. Anyone else gets a
     * fresh id so the chat screen still opens — on an empty thread, since
     * nothing here refuses: the Plus gate is the server's rule.
     */
    openDirect: (userId: string): Promise<string> =>
      Promise.resolve(userId === fixtures.SARA.id ? 'c-mara' : `c-${userId}`),

    thread: (conversationId: string): Promise<Message[]> =>
      settle(messageSchema.array(), [...(threads.get(conversationId) ?? [])]),

    send: (conversationId: string, body: string): Promise<Message> => {
      const message: Message = {
        id: `m-${Date.now()}`,
        conversationId,
        authorId: fixtures.VIEWER.id,
        body,
        createdAt: new Date().toISOString(),
        receipt: i18n.t('chat.sent'),
      };
      const existing = threads.get(conversationId) ?? [];
      // Only the newest own message carries a receipt, as in the design.
      threads.set(conversationId, [
        ...existing.map((entry) => ({ ...entry, receipt: undefined })),
        message,
      ]);
      return settle(messageSchema, message);
    },

    /** Appends the scripted reply that the design plays back after sending. */
    receive: (conversationId: string, authorId: string, body: string): Promise<Message> => {
      const message: Message = {
        id: `m-${Date.now()}-in`,
        conversationId,
        authorId,
        body,
        createdAt: new Date().toISOString(),
      };
      threads.set(conversationId, [...(threads.get(conversationId) ?? []), message]);
      return settle(messageSchema, message);
    },
  },

  legal: {
    /**
     * Null, which the screen reads as "render the prose in the locale files".
     * The offline source has no document table and therefore no version to
     * accept — and an acceptance nobody can produce should not be invented.
     */
    current: (): Promise<null> => Promise.resolve(null),
    accept: (): Promise<void> => Promise.resolve(),
  },

  account: {
    /** Nothing to end: the offline source has no account behind it. */
    delete: (): Promise<void> => Promise.resolve(),
  },

  safety: {
    /**
     * Accepted and dropped. The offline source has no moderation queue and no
     * second person to hide, and every screen in the flow reads from its own
     * state — so the report and the block have nowhere to go and nothing to
     * change.
     */
    report: (): Promise<void> => Promise.resolve(),
    block: (): Promise<void> => Promise.resolve(),
    unblock: (): Promise<void> => Promise.resolve(),
  },

  places: {
    recent: (): Promise<Place[]> => settle(placeSchema.array(), fixtures.RECENT_PLACES),
    nearby: (): Promise<Place[]> => settle(placeSchema.array(), fixtures.NEARBY_PLACES),
  },

  preferences: {
    get: (): Promise<Preferences> => settle(preferencesSchema, preferences),
    update: (patch: Partial<Preferences>): Promise<Preferences> => {
      preferences = { ...preferences, ...patch };
      return settle(preferencesSchema, preferences);
    },
  },
};
