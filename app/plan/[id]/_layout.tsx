import { Stack } from 'expo-router';

/**
 * Plan detail and its two follow-on sheets. Every screen here is a transparent
 * modal so the map stays visible behind the scrim, exactly as in the design.
 */
export default function PlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'transparentModal',
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
