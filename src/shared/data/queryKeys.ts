/**
 * Query key factories, in the `@lukemorales/query-key-factory` shape: every key
 * is derived from one place, so invalidation can target a feature (`plans.all`)
 * or a single record (`plans.detail(id).queryKey`) without hand-written arrays
 * drifting apart.
 *
 * The factory is written out rather than pulled from the library so the keys
 * stay plain `readonly` tuples that React Query and our own helpers can share.
 */

function key<const T extends readonly unknown[]>(parts: T) {
  return { queryKey: parts };
}

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  /** Plans on the map for a given day filter. */
  list: (filter: string) => key([...planKeys.lists(), filter] as const),
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (planId: string) => key([...planKeys.details(), planId] as const),
  /** Join requests the host still has to answer. */
  requests: (planId: string) => key([...planKeys.all, 'requests', planId] as const),
  /** Plans the signed-in user hosts or has joined. */
  mine: () => key([...planKeys.all, 'mine'] as const),
} as const;

export const userKeys = {
  all: ['users'] as const,
  /** The signed-in user. */
  me: () => key([...userKeys.all, 'me'] as const),
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (userId: string) => key([...userKeys.details(), userId] as const),
  /** People search results for a query string. */
  search: (term: string) => key([...userKeys.all, 'search', term] as const),
  /** Recently viewed profiles, shown under the search results. */
  recent: () => key([...userKeys.all, 'recent'] as const),
} as const;

export const chatKeys = {
  all: ['chats'] as const,
  /** The conversations list. */
  conversations: () => key([...chatKeys.all, 'conversations'] as const),
  threads: () => [...chatKeys.all, 'thread'] as const,
  /** Messages in one conversation. */
  thread: (conversationId: string) => key([...chatKeys.threads(), conversationId] as const),
} as const;

export const preferenceKeys = {
  all: ['preferences'] as const,
  mine: () => key([...preferenceKeys.all, 'mine'] as const),
} as const;

export const placeKeys = {
  all: ['places'] as const,
  /** Recently used places in the create-plan flow. */
  recent: () => key([...placeKeys.all, 'recent'] as const),
  /** Suggested places near the user. */
  nearby: () => key([...placeKeys.all, 'nearby'] as const),
  search: (term: string) => key([...placeKeys.all, 'search', term] as const),
} as const;

export const billingKeys = {
  all: ['billing'] as const,
  /** RevenueCat entitlements for the signed-in user. */
  entitlements: () => key([...billingKeys.all, 'entitlements'] as const),
  /** Available subscription packages. */
  offerings: () => key([...billingKeys.all, 'offerings'] as const),
} as const;
