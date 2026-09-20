import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Caret, Mascot, Spacer, Text } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** Step 11 — first name only. */
export function NameScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepLayout
      step={STEPS.name}
      title={t('onboarding.name.title')}
      subtitle={t('onboarding.name.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/birthday')}
        />
      }
    >
      <View className="mt-[20px] shrink-0 gap-[16px] rounded-card bg-brand-tint p-[16px]">
        <View className="h-[212px] items-center justify-center">
          <Mascot size={190} />
        </View>
        <View className="flex-row items-center rounded-field bg-surface px-[16px] py-[18px]">
          <Text weight={500} className="text-[19px]">
            Mara
          </Text>
          <Caret height={22} />
        </View>
      </View>

      <Spacer />
    </StepLayout>
  );
}
