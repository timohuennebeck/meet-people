import { Stack } from 'expo-router';

/** The create-plan flow: a push stack, each step drawing its own header. */
export default function CreateLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
