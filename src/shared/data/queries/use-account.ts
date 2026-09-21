import { useMutation, useQueryClient } from '@tanstack/react-query';

import { account } from '@shared/data/api/account';

/**
 * Ends the account.
 *
 * Nothing is optimistic and nothing is rolled back: the screen may only move on
 * once the profile has been anonymised, the storage purged and the login
 * closed, because the sentence it showed said all three would happen.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => account.delete(),
    onSuccess: () => {
      // Every cached answer belonged to an account that no longer exists.
      queryClient.clear();
    },
  });
}
