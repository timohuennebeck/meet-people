import { useQuery } from '@tanstack/react-query';

import { userKeys } from '@shared/data/queryKeys';
import { dataSource } from '@shared/data/source';

/** The signed-in user. */
export function useMe() {
  return useQuery({
    ...userKeys.me(),
    queryFn: () => dataSource.users.me(),
  });
}

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
