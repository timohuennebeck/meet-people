import type { z } from 'zod';

import { i18n } from '@shared/i18n';

import * as fixtures from '../fixtures';
import {
  conversationSchema,
  messageSchema,
  placeSchema,
  planSchema,
  preferencesSchema,
  searchResultsSchema,
  userSchema,
  type Conversation,
  type Membership,
  type Message,
  type Place,
  type Plan,
  type Preferences,
  type User,
} from '../schemas';
import type { DataSource } from './types';

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

export const fixtureSource: DataSource = {
  plans: {
    // A copy, so the cache never holds the same array this module mutates.
    list: (): Promise<Plan[]> => settle(planSchema.array(), [...plans]),

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
      return settle(planSchema, updated);
    },
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
  },

  chats: {
    conversations: (): Promise<Conversation[]> =>
      settle(conversationSchema.array(), fixtures.CONVERSATIONS),

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
