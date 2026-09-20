import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { SpokenLanguageList } from '@shared/components/SpokenLanguageList';
import { NavHeader, Screen, SectionLabel, TextButton } from '@shared/ui';

/** The shortlist the design shows on this page. */
const OPTIONS = ['de', 'en', 'pt', 'tr'];

/** Settings → Languages I speak. */
export function SpokenLanguagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <NavHeader title={t('settings.spokenLanguages')} onBack={() => router.back()} />

      <ScrollView
        className="mt-[20px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>{t('settings.spokenLanguagesPage.sectionLabel')}</SectionLabel>

        <SpokenLanguageList codes={OPTIONS} />

        <TextButton label={t('onboarding.languages.searchAnother')} tone="brand" />
      </ScrollView>
    </Screen>
  );
}
