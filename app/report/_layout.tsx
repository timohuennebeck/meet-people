import { Stack } from 'expo-router';

/** The three report steps, each drawing its own nav header. */
export default function ReportLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
