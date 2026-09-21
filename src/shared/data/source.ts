import { supabaseSource } from './sources/supabase';
import type { DataSource } from './sources/types';

/**
 * The one place the app reads and writes domain data.
 *
 * There used to be a second implementation behind this, reading transcribed
 * copies of the design's content so a clone with no `.env` still rendered every
 * screen. It went when the design passes finished: a third of its methods had
 * become no-ops that reported success — a report filed nowhere, a block that
 * blocked nobody, an account deletion that deleted nothing — which is the one
 * failure this app cannot afford to practise.
 *
 * So a build needs credentials. `hasSupabase` still gates the client, and the
 * router keeps an unconfigured build at the welcome screen rather than letting
 * it into rooms whose reads would throw.
 */
export const dataSource: DataSource = supabaseSource;

export type { DataSource } from './sources/types';
