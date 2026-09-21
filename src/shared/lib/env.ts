/**
 * Public runtime configuration. Expo inlines `EXPO_PUBLIC_*` at build time, so
 * these must be referenced as literal property accesses rather than looked up
 * dynamically.
 *
 * Every value is optional, and each integration checks its own key before
 * starting. Supabase is the exception in effect: without it there is no data
 * layer, so `hasSupabase` keeps such a build at the welcome screen.
 */

/** An empty or unset variable is "not configured", not an empty string. */
function read(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const env = {
  supabaseUrl: read(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: read(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  posthogApiKey: read(process.env.EXPO_PUBLIC_POSTHOG_API_KEY),
  posthogHost: read(process.env.EXPO_PUBLIC_POSTHOG_HOST) ?? 'https://eu.i.posthog.com',
  revenueCatIosKey: read(process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY),
  revenueCatAndroidKey: read(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY),
} as const;

/** True once Supabase credentials are present. Nothing past sign-in works without them. */
export const hasSupabase = Boolean(env.supabaseUrl && env.supabasePublishableKey);
