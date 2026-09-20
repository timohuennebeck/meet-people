import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { COUNTRIES } from '@shared/lib/languages';
import { STEPS } from '@shared/lib/steps';
import { Button, SelectableRow, Spacer, TextButton } from '@shared/ui';

/** Step 6 — home country, whose flag ends up on the profile avatar. Skippable. */
export function CountryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState('es');

  const next = () => router.push('/(onboarding)/account');

  return (
    <StepScaffold
      position={STEPS.country}
      title={t('onboarding.country.title')}
      subtitle={t('onboarding.country.subtitle')}
      footer={
        <>
          <Button label={t('common.continue')} onPress={next} />
          <TextButton
            label={t('common.preferNotToSay')}
            tone="mutedTall"
            className="mt-[13px]"
            onPress={next}
          />
        </>
      }
    >
      <View className="mt-[20px] gap-[10px]">
        {COUNTRIES.map((country) => (
          <SelectableRow
            key={country.code}
            title={country.name}
            subtitle={country.endonym}
            flag={country.flag}
            selected={selected === country.code}
            onPress={() => setSelected(country.code)}
          />
        ))}
      </View>

      <TextButton
        label={t('onboarding.country.searchAnother')}
        tone="brand"
        className="mt-[14px]"
      />

      <Spacer />
    </StepScaffold>
  );
}
