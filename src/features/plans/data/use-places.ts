import { useQuery } from '@tanstack/react-query';

import { placeKeys } from '@shared/data/query-keys';
import { dataSource } from '@shared/data/source';

/** Places the user has met at before, offered first in the create flow. */
export function useRecentPlaces() {
  return useQuery({
    ...placeKeys.recent(),
    queryFn: () => dataSource.places.recent(),
  });
}

/** Suggested places within walking distance. */
export function useNearbyPlaces() {
  return useQuery({
    ...placeKeys.nearby(),
    queryFn: () => dataSource.places.nearby(),
  });
}
