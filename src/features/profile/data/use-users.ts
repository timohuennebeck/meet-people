import { useMutation, useQuery } from '@tanstack/react-query';

import { isDataError } from '@shared/data/errors';
import { userKeys } from '@shared/data/query-keys';
import { dataSource } from '@shared/data/source';

/** Another person's profile. */
export function useUser(userId: string) {
  return useQuery({
    ...userKeys.detail(userId),
    queryFn: () => dataSource.users.detail(userId),
    enabled: userId.length > 0,
  });
}

/** Live people search. Skipped until the term is non-empty. */
export function useUserSearch(term: string) {
  return useQuery({
    ...userKeys.search(term),
    queryFn: () => dataSource.users.search(term),
    enabled: term.trim().length > 0,
  });
}

/** Recently viewed profiles, listed under the search results. */
export function useRecentSearches() {
  return useQuery({
    ...userKeys.recent(),
    queryFn: () => dataSource.users.recent(),
  });
}

/**
 * How many people looked at the viewer's profile this week. Free, so this one
 * resolves for everybody — it is what the locked viewers screen shows.
 */
export function useProfileViewCount() {
  return useQuery({
    ...userKeys.views(),
    queryFn: () => dataSource.users.viewCount(),
  });
}

/**
 * Who looked, newest first.
 *
 * `PLUS_REQUIRED` is not retried. The client's default is to try a failed read
 * once more, which is right for a request that fell over and wrong for one the
 * server considered and refused: asking again gets the same refusal a second
 * later, and until it arrives the screen is still holding a spinner over an
 * answer it already has. Every other failure keeps the default.
 */
export function useProfileViewers() {
  return useQuery({
    ...userKeys.viewers(),
    queryFn: () => dataSource.users.viewers(),
    retry: (failureCount, error) =>
      isDataError(error) && error.code === 'PLUS_REQUIRED' ? false : failureCount < 1,
  });
}

/**
 * Records that the viewer opened somebody's profile.
 *
 * Nothing is invalidated on success: the row this writes belongs to the person
 * who was looked at, so none of the viewer's own cached queries — including
 * their own view count — can have changed.
 */
export function useRecordProfileView() {
  return useMutation({
    mutationFn: (userId: string) => dataSource.users.recordView(userId),
  });
}
