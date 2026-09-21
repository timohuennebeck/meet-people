import { z } from 'zod';

/**
 * Public runtime configuration. Expo inlines `EXPO_PUBLIC_*` at build time, so
 * these must be referenced as literal property accesses rather than looked up
 * dynamically.
 *
 * Every value is optional: the app runs against fixtures with nothing
 * configured, and each integration checks its own key before starting.
 */
const envSchema = z.object({
  supabaseUrl: z.string().url().optional(),
  supabasePublishableKey: z.string().min(1).optional(),
  posthogApiKey: z.string().min(1).optional(),
  posthogHost: z.string().url().default('https://eu.i.posthog.com'),
  revenueCatIosKey: z.string().min(1).optional(),
  revenueCatAndroidKey: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || undefined,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || undefined,
  posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY || undefined,
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST || undefined,
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || undefined,
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || undefined,
});

if (!parsed.success) {
  console.warn('[env] Invalid configuration, falling back to defaults:', parsed.error.issues);
}

export const env = parsed.success ? parsed.data : envSchema.parse({});

/** True once Supabase credentials are present; until then the app uses fixtures. */
export const hasSupabase = Boolean(env.supabaseUrl && env.supabasePublishableKey);
