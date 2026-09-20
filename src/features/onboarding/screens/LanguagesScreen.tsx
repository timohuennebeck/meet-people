import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePreferences, useUpdatePreferences } from '@features/settings/data/usePreferences';
import { LEVEL_LABEL, pickLanguages } from '@shared/lib/languages';
import { Button, SelectableRow, Spacer, TextButton } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** The shortlist the design offers on this step. */
const OPTIONS = pickLanguages(['de', 'en', 'tr', 'es', 'pl']);

/** Step 5 — the languages the user speaks, shown later on their profile. */
export function LanguagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const spoken = preferences?.spokenLanguages ?? [];

  const toggle = (code: string, flag: string) => {
    const existing = spoken.find((language) => language.code === code);
    update({
      spokenLanguages: existing
        ? spoken.filter((language) => language.code !== code)
        : [...spoken, { code, flag, level: 'learning' }],
    });
  };

  return (
    <StepLayout
      step={STEPS.languages}
      title={t('onboarding.languages.title')}
      subtitle={t('onboarding.languages.subtitle')}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/(onboarding)/country')} />
      }
    >
      <View className="mt-[20px] gap-[10px]">
        {OPTIONS.map((language) => {
          const chosen = spoken.find((entry) => entry.code === language.code);
          return (
            <SelectableRow
              key={language.code}
              title={language.name}
              // A chosen language shows the user's level; the rest show the endonym.
              subtitle={chosen ? LEVEL_LABEL[chosen.level] : language.endonym}
              flag={language.flag}
              selected={Boolean(chosen)}
              onPress={() => toggle(language.code, language.flag)}
            />
          );
        })}
      </View>

      <TextButton
        label={t('onboarding.languages.searchAnother')}
        tone="brand"
        className="mt-[14px]"
        onPress={() => router.push('/(onboarding)/language-search')}
      />

      <Spacer />
    </StepLayout>
  );
}
