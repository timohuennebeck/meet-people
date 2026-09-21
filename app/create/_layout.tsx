import { Stack } from 'expo-router';

import { CreatePlanProvider } from '@features/plans/lib/create-plan-provider';

/**
 * The create-plan flow: a push stack, each step drawing its own header.
 *
 * The provider is mounted here rather than at the app root so the draft lives
 * exactly as long as the flow does — leaving and coming back starts a new plan
 * rather than resuming a half-remembered one.
 */
export default function CreateLayout() {
  return (
    <CreatePlanProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CreatePlanProvider>
  );
}
