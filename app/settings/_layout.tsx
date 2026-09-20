import { Stack } from 'expo-router';

/** Settings overview plus its detail pages, each drawing its own nav header. */
export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
