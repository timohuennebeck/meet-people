import * as fixtures from './fixtures';
import type { Conversation, Membership, Message, Place, Plan, Preferences, User } from './schemas';

/**
 * The one place the app reads and writes domain data.
 *
 * Today it resolves against the in-memory fixtures transcribed from the design.
 * When Supabase comes online, each method swaps to a query against the client in
 * `@shared/lib/supabase` — the signatures, and therefore every hook and screen
 * above them, stay unchanged.
 */

/** Mutable copies, so optimistic mutations have somewhere to land. */
let plans: Plan[] = fixtures.PLANS.map((plan) => ({ ...plan }));
let preferences: Preferences = { ...fixtures.DEFAULT_PREFERENCES };
const threads = new Map<string, Message[]>([
  ['c-sara', [...fixtures.DIRECT_MESSAGES]],
  ['c-run', [...fixtures.GROUP_MESSAGES]],
]);

/** Stands in for network latency so loading states are exercised in development. */
const LATENCY_MS = 120;

function settle<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

export const dataSource = {
  plans: {
    list: (): Promise<Plan[]> => settle(plans),

    detail: (planId: string): Promise<Plan> => {
      const plan = plans.find((candidate) => candidate.id === planId);
      if (!plan) return Promise.reject(new Error(`Plan ${planId} not found`));
      return settle(plan);
    },

    /** Moves the viewer between guest / requested / joined states on a plan. */
    setMembership: (planId: string, membership: Membership): Promise<Plan> => {
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
      return settle(updated);
    },

    /** Accepts a pending request, seating the applicant. */
    acceptRequest: (planId: string, requestId: string): Promise<Plan> => {
      let updated: Plan | undefined;
      plans = plans.map((plan) => {
        if (plan.id !== planId) return plan;
        const request = plan.requests.find((candidate) => candidate.id === requestId);
        if (!request) return plan;
        updated = {
          ...plan,
          requests: plan.requests.filter((candidate) => candidate.id !== requestId),
          participants: [
            ...plan.participants,
            { user: request.user, isHost: false, isViewer: false },
          ],
        };
        return updated;
      });
      if (!updated) return Promise.reject(new Error(`Request ${requestId} not found`));
      return settle(updated);
    },

    declineRequest: (planId: string, requestId: string): Promise<Plan> => {
      let updated: Plan | undefined;
      plans = plans.map((plan) => {
        if (plan.id !== planId) return plan;
        updated = {
          ...plan,
          requests: plan.requests.filter((candidate) => candidate.id !== requestId),
        };
        return updated;
      });
      if (!updated) return Promise.reject(new Error(`Plan ${planId} not found`));
      return settle(updated);
    },
  },

  users: {
    me: (): Promise<User> => settle(fixtures.VIEWER),
    detail: (userId: string): Promise<User> => {
      const user = fixtures.PEOPLE[userId];
      if (!user) return Promise.reject(new Error(`User ${userId} not found`));
      return settle(user);
    },
    search: (term: string) =>
      settle(
        term.trim().length === 0
          ? []
          : fixtures.SEARCH_RESULTS.filter((result) =>
              result.user.name.toLowerCase().includes(term.trim().toLowerCase()),
            ),
      ),
    recent: () => settle(fixtures.RECENT_SEARCHES),
  },

  chats: {
    conversations: (): Promise<Conversation[]> => settle(fixtures.CONVERSATIONS),

    thread: (conversationId: string): Promise<Message[]> =>
      settle(threads.get(conversationId) ?? []),

    send: (conversationId: string, body: string): Promise<Message> => {
      const message: Message = {
        id: `m-${Date.now()}`,
        conversationId,
        authorId: fixtures.VIEWER.id,
        body,
        createdAt: new Date().toISOString(),
        receipt: 'Enviada',
      };
      const existing = threads.get(conversationId) ?? [];
      // Only the newest own message carries a receipt, as in the design.
      threads.set(conversationId, [
        ...existing.map((entry) => ({ ...entry, receipt: undefined })),
        message,
      ]);
      return settle(message);
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
      return settle(message);
    },
  },

  places: {
    recent: (): Promise<Place[]> => settle(fixtures.RECENT_PLACES),
    nearby: (): Promise<Place[]> => settle(fixtures.NEARBY_PLACES),
  },

  preferences: {
    get: (): Promise<Preferences> => settle(preferences),
    update: (patch: Partial<Preferences>): Promise<Preferences> => {
      preferences = { ...preferences, ...patch };
      return settle(preferences);
    },
  },
};

export type DataSource = typeof dataSource;
