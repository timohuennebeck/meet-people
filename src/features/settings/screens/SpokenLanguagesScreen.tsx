import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { LEVEL_LABEL, pickLanguages } from '@shared/lib/languages';
import { NavHeader, Screen, SectionLabel, SelectableRow, TextButton } from '@shared/ui';

import { usePreferences, useUpdatePreferences } from '../data/usePreferences';

/** The shortlist the design shows on this page. */
const OPTIONS = pickLanguages(['de', 'en', 'pt', 'tr']);

/** Settings → Languages I speak. */
export function SpokenLanguagesScreen() {
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
    <Screen>
      <NavHeader title={t('settings.spokenLanguages')} onBack={() => router.back()} />

      <ScrollView
        className="mt-[20px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel className="tracking-[1.125px]">
          {t('settings.spokenLanguagesPage.sectionLabel')}
        </SectionLabel>

        <View className="gap-[10px]">
          {OPTIONS.map((language) => {
            const chosen = spoken.find((entry) => entry.code === language.code);
            return (
              <SelectableRow
                key={language.code}
                title={language.name}
                subtitle={chosen ? LEVEL_LABEL[chosen.level] : language.endonym}
                flag={language.flag}
                selected={Boolean(chosen)}
                onPress={() => toggle(language.code, language.flag)}
              />
            );
          })}
        </View>

        <TextButton label={t('onboarding.languages.searchAnother')} tone="brand" />
      </ScrollView>
    </Screen>
  );
}
