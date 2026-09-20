import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePreferences } from '@features/settings/data/usePreferences';
import { createQueryClient } from '@shared/data/queryClient';
import { setLocale } from '@shared/i18n';
import { AnalyticsProvider } from '@shared/providers/AnalyticsProvider';
import { BillingProvider } from '@shared/providers/BillingProvider';
import { SessionProvider, useSession } from '@shared/providers/SessionProvider';

import '../global.css';

/**
 * Route groups and the conditions that unlock them.
 *
 * expo-router renders only the `Stack.Protected` groups whose `guard` passes,
 * and redirects to the first reachable route when the active one becomes
 * unreachable. That keeps the navigation rules here rather than scattered
 * across screens as redirect effects.
 */
/**
 * Keeps the interface language in step with the stored preference — on launch,
 * once preferences have loaded, and again whenever the picker writes a new one.
 * i18n boots from the device locale, which this then overrides if the user has
 * chosen differently.
 */
function LocaleSync() {
  const { data: preferences } = usePreferences();
  const appLanguage = preferences?.appLanguage;

  useEffect(() => {
    if (appLanguage) setLocale(appLanguage);
  }, [appLanguage]);

  return null;
}

function RootNavigator() {
  const { isAuthenticated, hasOnboarded, isReady } = useSession();

  // Hold the tree until the persisted session is known, so a signed-in user
  // never sees a frame of the welcome screen on launch.
  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated || !hasOnboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && hasOnboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="plan/[id]" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="create" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="people/[id]" />
        <Stack.Screen name="search" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="verification-badge" />
      </Stack.Protected>

      {/* Outside both guards: the welcome screen links here before sign-in and
          settings after. Declared LAST on purpose — when a guard flips and no
          route in the current state survives, `StackRouter` falls back to
          `routeNames[0]`, and this Stack sets no anchor. First in the list, the
          legal modal would become where the app lands on every sign-in. */}
      <Stack.Screen name="legal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const queryClient = useMemo(() => createQueryClient(), []);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Inter carries the whole type scale, so nothing renders until it is ready.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>
            <BillingProvider>
              <SessionProvider>
                <StatusBar style="dark" />
                <LocaleSync />
                <RootNavigator />
              </SessionProvider>
            </BillingProvider>
          </AnalyticsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
