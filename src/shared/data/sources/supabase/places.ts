import { distanceLabel } from '@shared/lib/supabase/mapping';

import type { DistanceUnit, Place } from '../../schemas';
import type { DataSource } from '../types';
import { planContext } from './preferences';
import { client, unwrap, viewerId } from './shared';

/** Places a plan can be held at, each with how far away it is. */

/**
 * Places with their distance from the viewer, nearest first.
 *
 * `distance_to()` takes one place at a time — it is the function that lets a
 * client learn a distance without ever seeing a coordinate — so this is one
 * call per row. That is fine for the handful the create flow offers and wrong
 * for a list; a `nearby_places()` RPC alongside `nearby_plans()` is what
 * replaces it.
 */
async function placesWithDistance(
  rows: { id: string; name: string; address: string; provider_place_id: string | null }[],
  unit: DistanceUnit,
): Promise<Place[]> {
  const db = client();
  const withDistance = await Promise.all(
    rows.map(async (row) => ({
      row,
      metres: unwrap(await db.rpc('distance_to', { place: row.id })),
    })),
  );

  return withDistance
    .sort((a, b) => (a.metres ?? Infinity) - (b.metres ?? Infinity))
    .map(({ row, metres }) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      distanceLabel: distanceLabel(metres, unit),
      providerPlaceId: row.provider_place_id ?? undefined,
    }));
}

export const placesSource: DataSource['places'] = {
  /** Places the viewer added themselves, which is what "recent" means so far. */
  recent: async (): Promise<Place[]> => {
    const db = client();
    const uid = await viewerId();
    const { unit } = await planContext();
    const rows = unwrap(
      await db
        .from('places')
        .select('id, name, address, provider_place_id')
        .eq('profile_id', uid)
        .order('created_at', { ascending: false })
        .limit(8),
    );
    return await placesWithDistance(rows ?? [], unit);
  },

  nearby: async (): Promise<Place[]> => {
    const db = client();
    const { unit } = await planContext();
    const rows = unwrap(
      await db.from('places').select('id, name, address, provider_place_id').limit(12),
    );
    return await placesWithDistance(rows ?? [], unit);
  },
};
