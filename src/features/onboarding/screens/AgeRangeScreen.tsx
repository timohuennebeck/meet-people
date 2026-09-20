import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { usePreferences, useUpdatePreferences } from '@features/settings/data/usePreferences';
import { AgePresets, AgeRangeControl } from '@shared/components/AgeRangeControl';
import { Button, Spacer } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** Step 4 — which ages the user wants to see on the map. */
export function AgeRangeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const range = preferences?.ageRange ?? [21, 34];

  return (
    <StepLayout
      step={STEPS.ageRange}
      title={t('onboarding.ageRange.title')}
      subtitle={t('onboarding.ageRange.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/interests')}
        />
      }
    >
      <AgeRangeControl
        className="mt-[20px]"
        range={range}
        onChange={(next) => update({ ageRange: [next[0], next[1]] })}
        summary={t('onboarding.ageRange.plansInRange')}
        allLabel={t('onboarding.ageRange.presetAll')}
        unitLabel={t('common.years')}
      />
      <AgePresets
        className="mt-[16px]"
        range={range}
        onChange={(next) => update({ ageRange: [next[0], next[1]] })}
        allLabel={t('onboarding.ageRange.presetAll')}
      />
      <Spacer min={16} />
    </StepLayout>
  );
}
