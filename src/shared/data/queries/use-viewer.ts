import { useQuery } from '@tanstack/react-query';

import { users } from '@shared/data/api/users';

import { userKeys } from '../query-keys';

/**
 * The signed-in user, for the features that need to render them into their own
 * optimistic updates — the participant chat adds to a plan's seat grid, the
 * author chat stamps on a bubble before the server has one.
 *
 * It is keyed on `userKeys.me()`, so every screen asking for the viewer
 * dedupes into a single fetch rather than becoming a second source of truth
 * about the same person. It lives in `shared` because several features need
 * it, and it replaces what used to be a direct import of a `VIEWER` constant
 * — which was the right person only while the sample content was the app.
 */
export function useViewer() {
  return useQuery({
    ...userKeys.me(),
    queryFn: () => users.me(),
  });
}

/** The viewer's id, or null before their profile has loaded. */
export function useViewerId(): string | null {
  const { data } = useViewer();
  return data?.id ?? null;
}
