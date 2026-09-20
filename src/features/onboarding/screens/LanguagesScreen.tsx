import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SpokenLanguageList } from '@shared/components/SpokenLanguageList';
import { Button, Spacer, TextButton } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** The shortlist the design offers on this step. */
const OPTIONS = ['de', 'en', 'tr', 'es', 'pl'];

/** Step 5 — the languages the user speaks, shown later on their profile. */
export function LanguagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepLayout
      step={STEPS.languages}
      title={t('onboarding.languages.title')}
      subtitle={t('onboarding.languages.subtitle')}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/(onboarding)/country')} />
      }
    >
      <View className="mt-[20px]">
        <SpokenLanguageList codes={OPTIONS} />
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
