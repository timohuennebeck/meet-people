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
  /**
   * Plans on the map. The day filter is deliberately not part of the key: the
   * source cannot narrow by day yet, so keying on it would cache the same four
   * plans three times over. It becomes `list(filter)` when the query does.
   */
  list: () => key(planKeys.lists()),
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (planId: string) => key([...planKeys.details(), planId] as const),
  /**
   * Tags every write against one plan, so a mutation can ask how many of its
   * siblings are still in flight before it rolls back or invalidates.
   */
  mutation: (planId: string) => [...planKeys.all, 'mutation', planId] as const,
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
} as const;
