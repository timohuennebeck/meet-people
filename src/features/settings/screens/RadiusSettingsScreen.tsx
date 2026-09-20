import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { RadiusControl } from '@shared/components/RadiusControl';
import { RadiusMap } from '@shared/components/RadiusMap';
import { Button, NavHeader, Screen, Spacer, StepSubtitle } from '@shared/ui';

import { usePreferences, useUpdatePreferences } from '../data/usePreferences';

/** Settings → Radius. The same controls as the onboarding step, saved in place. */
export function RadiusSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  return (
    <Screen>
      <NavHeader title={t('settings.radius')} onBack={() => router.back()} />

      <StepSubtitle className="mt-[20px] shrink-0">{t('onboarding.radius.subtitle')}</StepSubtitle>

      <RadiusMap height={250} className="mt-[16px]" />

      <RadiusControl
        className="mt-[20px]"
        radius={preferences?.radius ?? 2}
        unit={preferences?.distanceUnit ?? 'mi'}
        origin={t('onboarding.radius.from')}
        summary={t('onboarding.radius.plansInRadius')}
        onChangeRadius={(radius) => update({ radius })}
        onChangeUnit={(distanceUnit) => update({ distanceUnit })}
      />

      <Spacer min={16} />

      <Button label={t('common.save')} onPress={() => router.back()} />
    </Screen>
  );
}
