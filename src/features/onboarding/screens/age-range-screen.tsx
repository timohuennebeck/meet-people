import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { usePreferences, useUpdatePreferences } from '@shared/data/queries/use-preferences';
import { STEPS } from '@shared/lib/steps';
import { AgePresets, AgeRangeControl } from '@shared/ui/age-range-control';
import { Button, Spacer } from '@shared/ui/button';
import { StepScaffold } from '@shared/ui/step-scaffold';

/** Which ages the user wants to see on the map. */
export function AgeRangeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const range = preferences?.ageRange ?? [21, 34];

  return (
    <StepScaffold
      position={STEPS.ageRange}
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
        standalone
        className="mt-[16px]"
        range={range}
        onChange={(next) => update({ ageRange: [next[0], next[1]] })}
        allLabel={t('onboarding.ageRange.presetAll')}
      />
      <Spacer min={16} />
    </StepScaffold>
  );
}
