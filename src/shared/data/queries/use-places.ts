import { useQuery } from '@tanstack/react-query';

import { places } from '@shared/data/api/places';
import { placeKeys } from '@shared/data/query-keys';

/** Places the user has met at before, offered first in the create flow. */
export function useRecentPlaces() {
  return useQuery({
    ...placeKeys.recent(),
    queryFn: () => places.recent(),
  });
}

/** Suggested places within walking distance. */
export function useNearbyPlaces() {
  return useQuery({
    ...placeKeys.nearby(),
    queryFn: () => places.nearby(),
  });
}
