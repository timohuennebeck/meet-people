import { hasSupabase } from '@shared/lib/env';

import { fixtureSource } from './sources/fixtures';
import { supabaseSource } from './sources/supabase';
import type { DataSource } from './sources/types';

/**
 * The one place the app reads and writes domain data.
 *
 * Two implementations sit behind it, both declared as `DataSource` so neither
 * can drift from the other:
 *
 * - `sources/supabase.ts` when `.env` carries a project URL and key,
 * - `sources/fixtures.ts` otherwise — a fresh clone, a design review, or a
 *   development machine with no network. That one is not a leftover: it is the
 *   only thing that renders a screen when there is nothing to talk to.
 *
 * The choice is made once, at module load, on the same flag the client itself
 * checks. Nothing above this line knows which one answered.
 */
export const dataSource: DataSource = hasSupabase ? supabaseSource : fixtureSource;

export type { DataSource } from './sources/types';
