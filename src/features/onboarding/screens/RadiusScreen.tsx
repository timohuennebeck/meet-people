import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { usePreferences, useUpdatePreferences } from '@features/settings/data/usePreferences';
import { RadiusControl } from '@shared/components/RadiusControl';
import { RadiusMap } from '@shared/components/RadiusMap';
import type { DistanceUnit } from '@shared/data/schemas';
import { Button, Spacer } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** Step 3 — how far the user is willing to travel. */
export function RadiusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const radius = preferences?.radius ?? 2;
  const unit: DistanceUnit = preferences?.distanceUnit ?? 'mi';

  return (
    <StepLayout
      step={STEPS.radius}
      title={t('onboarding.radius.title')}
      subtitle={t('onboarding.radius.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/age-range')}
        />
      }
    >
      <RadiusMap height={268} className="mt-[20px]" />
      <RadiusControl
        className="mt-[20px]"
        radius={radius}
        unit={unit}
        origin={t('onboarding.radius.from')}
        summary={t('onboarding.radius.plansInRadius')}
        onChangeRadius={(next) => update({ radius: next })}
        onChangeUnit={(next) => update({ distanceUnit: next })}
      />
      <Spacer min={16} />
    </StepLayout>
  );
}
