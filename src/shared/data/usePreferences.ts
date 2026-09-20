import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { preferenceKeys } from './queryKeys';
import type { Preferences } from './schemas';
import { dataSource } from './source';

/** The signed-in user's discovery and app preferences. */
export function usePreferences() {
  return useQuery({
    ...preferenceKeys.mine(),
    queryFn: () => dataSource.preferences.get(),
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
    mutationFn: (patch: Partial<Preferences>) => dataSource.preferences.update(patch),
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
    },
  });
}
