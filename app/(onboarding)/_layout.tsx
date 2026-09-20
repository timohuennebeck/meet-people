import { Stack } from 'expo-router';

/**
 * Onboarding runs as a plain push stack so every step keeps a working back
 * gesture. Headers are off because each screen draws its own progress header.
 */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
