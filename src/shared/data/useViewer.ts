import { useQuery } from '@tanstack/react-query';

import { userKeys } from './queryKeys';
import { dataSource } from './source';

/**
 * The signed-in user, for the features that need to render them into their own
 * optimistic updates — the participant chat adds to a plan's seat grid, the
 * author chat stamps on a bubble before the server has one.
 *
 * It shares `userKeys.me()` with the profile feature's `useMe`, so the two
 * dedupe into a single fetch rather than becoming two sources of truth about
 * the same person. It lives in `shared` because two features need it, and it
 * replaces what used to be a direct import of the `VIEWER` fixture — which was
 * the right person only while the fixtures were the only source.
 */
export function useViewer() {
  return useQuery({
    ...userKeys.me(),
    queryFn: () => dataSource.users.me(),
  });
}

/** The viewer's id, or null before their profile has loaded. */
export function useViewerId(): string | null {
  const { data } = useViewer();
  return data?.id ?? null;
}
