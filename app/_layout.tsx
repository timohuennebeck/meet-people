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

import { useChatInbox } from '@features/chat/data/useChat';
import { createQueryClient } from '@shared/data/queryClient';
import { usePreferences } from '@shared/data/usePreferences';
import { setLocale } from '@shared/i18n';
import { AnalyticsProvider } from '@shared/providers/AnalyticsProvider';
import { BillingProvider } from '@shared/providers/BillingProvider';
import { SessionProvider, useSession } from '@shared/providers/SessionProvider';

import '../global.css';

/**
 * The plan and report sheets, as real iOS form sheets.
 *
 * `react-native-screens` draws the panel, the corner radius, the grabber and
 * the dimming behind it, and gives the sheet its drag-to-dismiss and
 * tap-outside-to-dismiss behaviour — all of which the app used to only paint.
 * `fitToContents` measures the screen's content column to size the sheet, so
 * nothing at the top of one of these screens may claim `flex: 1`: a child
 * stretching into a container with no resolved height measures to zero.
 */
const SHEET_OPTIONS = {
  presentation: 'formSheet',
  sheetAllowedDetents: 'fitToContents',
  /** `radii.sheet` — the design's `rounded-t-sheet`, now drawn natively. */
  sheetCornerRadius: 30,
  sheetGrabberVisible: true,
  sheetElevation: 24,
} as const;

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

/**
 * Holds the app's one Realtime subscription, so a message arriving moves the
 * Chats badge wherever the reader happens to be.
 *
 * Mounted under `SessionProvider` and only once signed in: replication is
 * scoped by the caller's own read policy, so there is nothing to listen to
 * before there is a session.
 */
function ChatInbox() {
  const { isAuthenticated } = useSession();
  return isAuthenticated ? <ChatInboxSubscription /> : null;
}

function ChatInboxSubscription() {
  useChatInbox();
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

        {/* The plan and report directories carry no `_layout`, so their screens
            are routes on this stack rather than a nested navigator — a nested
            navigator inside a `fitToContents` sheet cannot be measured. Each
            sheet therefore declares its presentation here. */}
        <Stack.Screen name="plan/[id]/index" options={SHEET_OPTIONS} />
        <Stack.Screen name="plan/[id]/join" options={SHEET_OPTIONS} />
        <Stack.Screen name="plan/[id]/leave" options={SHEET_OPTIONS} />
        <Stack.Screen name="plan/[id]/attendance" options={SHEET_OPTIONS} />
        {/* A `MascotScreen` confirmation: full-bleed by design, never a sheet. */}
        <Stack.Screen name="plan/[id]/attendance-thanks" />

        <Stack.Screen name="create" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="people/[id]" />

        <Stack.Screen name="report/[id]/index" options={SHEET_OPTIONS} />
        <Stack.Screen name="report/[id]/detail" options={SHEET_OPTIONS} />
        {/* The other `MascotScreen` confirmation — same reason. */}
        <Stack.Screen name="report/[id]/sent" />

        <Stack.Screen name="profile-views" />
        <Stack.Screen name="search" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="verification-badge" />
      </Stack.Protected>

      {/* Outside both guards: the welcome screen links here before sign-in and
          settings after. Declared LAST on purpose — when a guard flips and no
          route in the current state survives, `StackRouter` falls back to
          `routeNames[0]`, and this Stack sets no anchor. First in the list, the
          legal modal would become where the app lands on every sign-in. */}
      <Stack.Screen name="legal" />
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
                <ChatInbox />
                <RootNavigator />
              </SessionProvider>
            </BillingProvider>
          </AnalyticsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
