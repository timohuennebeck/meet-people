import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { preferences } from '@shared/data/api/preferences';

import { preferenceKeys, userKeys } from './query-keys';
import type { Preferences } from './schemas';

/** The signed-in user's discovery and app preferences. */
export function usePreferences() {
  return useQuery({
    ...preferenceKeys.mine(),
    queryFn: () => preferences.get(),
  });
}

/**
 * Saves a preference change. Settings controls move the moment they are
 * touched, so the patch is applied to the cache first and rolled back on error.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const key = preferenceKeys.mine().queryKey;

  return useMutation({
    mutationFn: (patch: Partial<Preferences>) => preferences.update(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Preferences>(key);
      if (previous) queryClient.setQueryData<Preferences>(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      // Interests and spoken languages are columns on `profiles`, so this
      // writes the same row `users.me()` reads — editing them in settings left
      // the profile screen showing the old list.
      void queryClient.invalidateQueries({ queryKey: userKeys.me().queryKey });
    },
  });
}
