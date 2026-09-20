import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { env, hasSupabase } from '../env';

/**
 * Supabase client for local development.
 *
 * `supabase start` prints the URL and anon key to put in `.env`; until they are
 * set, `supabase` is `null` and the app reads from fixtures instead. Sessions
 * persist in AsyncStorage so a signed-in user survives a reload, and URL
 * detection is off because React Native has no browser redirect to inspect.
 */
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
