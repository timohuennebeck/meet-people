import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Caret, Flag, Spacer, Text } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/**
 * Phone verification. Taken out of the main onboarding flow for now — the
 * design keeps it built but unlinked — and reachable from account settings.
 */
export function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepLayout
      step={STEPS.phone}
      title={t('onboarding.phone.title')}
      subtitle={t('onboarding.phone.subtitle')}
      footer={
        <Button
          label={t('onboarding.phone.sendCode')}
          onPress={() => router.push('/(onboarding)/code')}
        />
      }
    >
      <View className="mt-[20px] shrink-0 flex-row gap-[10px]">
        <View className="flex-row items-center gap-[8px] rounded-well border border-hair bg-surface px-[14px] py-[17px]">
          <Flag code="de" size={26} />
          <Text weight={500} className="text-[17px]">
            +49
          </Text>
        </View>
        <View className="flex-1 flex-row items-center rounded-well border-2 border-brand bg-surface px-[14px] py-[15px]">
          <Text weight={500} className="text-[17px]">
            151 23456789
          </Text>
          <Caret height={21} />
        </View>
      </View>

      <Spacer />
    </StepLayout>
  );
}
