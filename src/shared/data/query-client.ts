import { QueryClient } from '@tanstack/react-query';

/**
 * Shared client. Defaults suit a social feed: data is fresh enough for a minute,
 * failed reads retry once, and refetch-on-mount is left on so returning to the
 * map picks up plans that filled while the app was backgrounded.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
