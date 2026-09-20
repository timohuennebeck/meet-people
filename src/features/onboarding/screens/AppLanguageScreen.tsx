import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { setLocale } from '@shared/i18n';
import { APP_LANGUAGES } from '@shared/lib/languages';
import { STEPS } from '@shared/lib/steps';
import { Button, SelectableRow, Spacer } from '@shared/ui';

/** Step 1 — the app's language, asked before anything else. */
export function AppLanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState('pt');

  return (
    <StepScaffold
      position={STEPS.appLanguage}
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
            onPress={() => {
              setSelected(language.code);
              // The rest of onboarding is already translated, so the switch
              // takes effect on the next step rather than after sign-up.
              setLocale(language.code);
            }}
          />
        ))}
      </View>
      <Spacer min={16} />
    </StepScaffold>
  );
}
