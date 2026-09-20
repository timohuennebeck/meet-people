import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { env, hasSupabase } from '../env';
import type { Database } from './database.types';

/**
 * The app's Supabase client, typed against the schema in `database.types.ts`.
 *
 * `npm run db:types` regenerates that file from the hosted project, so every
 * table name, column and enum below is checked at build time rather than
 * discovered at runtime.
 *
 * Until `.env` carries a URL and a publishable key, `supabase` is `null` and the
 * app reads from fixtures instead. Sessions persist in AsyncStorage so a
 * signed-in user survives a reload, and URL detection is off because React
 * Native has no browser redirect to inspect.
 */
export const supabase: SupabaseClient<Database> | null = hasSupabase
  ? createClient<Database>(env.supabaseUrl!, env.supabasePublishableKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
