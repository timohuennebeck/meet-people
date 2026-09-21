import { PostHogProvider } from 'posthog-react-native';
import type { ReactNode } from 'react';

import { env } from '@shared/lib/env';

/**
 * PostHog. Screen views are captured automatically from expo-router, and
 * autocapture of taps is left off — a social app's taps carry plan and person
 * names, which should be sent deliberately through `capture`, not swept up.
 *
 * With no API key configured the children render untouched, so development and
 * tests never emit events.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!env.posthogApiKey) return <>{children}</>;

  return (
    <PostHogProvider
      apiKey={env.posthogApiKey}
      options={{ host: env.posthogHost }}
      autocapture={{ captureScreens: true, captureTouches: false }}
    >
      {children}
    </PostHogProvider>
  );
}
