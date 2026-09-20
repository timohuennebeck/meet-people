import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useUpdatePreferences } from '@features/settings/data/usePreferences';
import { StepScaffold } from '@shared/components/StepScaffold';
import { setLocale } from '@shared/i18n';
import { APP_LANGUAGES } from '@shared/lib/languages';
import { STEPS } from '@shared/lib/steps';
import { Button, SelectableRow, Spacer } from '@shared/ui';

/** Step 1 — the app's language, asked before anything else. */
export function AppLanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: update } = useUpdatePreferences();
  const [selected, setSelected] = useState('pt');

  return (
    <StepScaffold
      position={STEPS.appLanguage}
      title={t('onboarding.appLanguage.title')}
      subtitle={t('onboarding.appLanguage.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => {
            // Committing the locale here rather than on tap keeps this step's
            // own copy stable while the choice is being made. Storing it as
            // well is what makes the choice survive a relaunch, since the
            // locale is restored from preferences on launch.
            update({ appLanguage: selected });
            setLocale(selected);
            router.push('/(onboarding)/location');
          }}
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
    </StepScaffold>
  );
}
