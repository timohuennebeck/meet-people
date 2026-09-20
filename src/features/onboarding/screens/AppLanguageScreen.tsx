import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, SelectableRow, Spacer } from '@shared/ui';

import { APP_LANGUAGES, STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** Step 1 — the app's language, asked before anything else. */
export function AppLanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState('pt');

  return (
    <StepLayout
      step={STEPS.appLanguage}
      title={t('onboarding.appLanguage.title')}
      subtitle={t('onboarding.appLanguage.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/location')}
        />
      }
    >
      <View className="mt-[20px] gap-[10px]">
        {APP_LANGUAGES.map((language) => (
          <SelectableRow
            key={language.code}
            title={language.name}
            flag={language.flag}
            selected={selected === language.code}
            onPress={() => setSelected(language.code)}
          />
        ))}
      </View>
      <Spacer min={16} />
    </StepLayout>
  );
}
