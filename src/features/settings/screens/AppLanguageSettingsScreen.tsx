import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { setLocale } from '@shared/i18n';
import { APP_LANGUAGES } from '@shared/lib/languages';
import { NavHeader, Screen, SectionLabel, SelectableRow, Text } from '@shared/ui';

import { usePreferences, useUpdatePreferences } from '../data/usePreferences';

/**
 * Settings → App language. Changes the interface only; the languages the user
 * speaks are a separate page, and the note under the list says so.
 */
export function AppLanguageSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const current = preferences?.appLanguage ?? 'pt-BR';

  return (
    <Screen>
      <NavHeader title={t('settings.appLanguage')} onBack={() => router.back()} />

      <ScrollView
        className="mt-[20px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>{t('settings.appLanguagePage.sectionLabel')}</SectionLabel>

        <View className="gap-[10px]">
          {APP_LANGUAGES.map((language) => (
            <SelectableRow
              key={language.code}
              title={language.name}
              subtitle={language.endonym}
              flag={language.flag}
              selected={current.startsWith(language.code)}
              onPress={() => {
                update({ appLanguage: language.code });
                setLocale(language.code);
              }}
            />
          ))}
        </View>

        <Text className="mt-[6px] text-[13.5px] leading-[19.6px] text-ink-dim">
          {t('settings.appLanguagePage.note')}
        </Text>
      </ScrollView>
    </Screen>
  );
}
