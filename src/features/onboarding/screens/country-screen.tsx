import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/step-scaffold';
import { COUNTRIES } from '@shared/lib/languages';
import { STEPS } from '@shared/lib/steps';
import { Button, SelectableRow, Spacer, TextButton } from '@shared/ui';

import { saveProfile } from '../lib/profile-writes';

/** Home country, whose flag ends up on the profile avatar. Skippable. */
export function CountryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState('es');

  const next = () => router.push('/(onboarding)/account');

  /**
   * This step runs before the account does, so the write is held and replayed
   * once sign-up hands over a session — see `profile-writes`. The column is ISO
   * 3166-1 alpha-2, which is upper case; the flag catalogue is lower.
   */
  const confirm = () => {
    saveProfile({ country_code: selected.toUpperCase() });
    next();
  };

  return (
    <StepScaffold
      position={STEPS.country}
      title={t('onboarding.country.title')}
      subtitle={t('onboarding.country.subtitle')}
      footer={
        <>
          <Button label={t('common.continue')} onPress={confirm} />
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
