import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@shared/data/queryClient';
import '@shared/i18n';
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
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack.Protected>
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
                <RootNavigator />
              </SessionProvider>
            </BillingProvider>
          </AnalyticsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
