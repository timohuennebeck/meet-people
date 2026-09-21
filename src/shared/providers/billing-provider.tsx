import { useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import { env } from '@shared/lib/env';

/**
 * Configures RevenueCat once, with the platform's API key.
 *
 * Purchases are not wired to the paywall yet — that lands with the rest of the
 * billing flow — but configuring here means `Purchases.getOfferings()` is ready
 * for the paywall to call, and nothing happens at all when no key is set.
 */
export function BillingProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apiKey = Platform.select({
      ios: env.revenueCatIosKey,
      android: env.revenueCatAndroidKey,
      default: undefined,
    });
    if (!apiKey) return;

    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
  }, []);

  return <>{children}</>;
}
