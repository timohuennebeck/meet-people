import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Text, TextButton } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/**
 * The grey bust that stands in for a portrait before one is chosen: a head
 * circle and a shoulders dome, clipped to a 214px round frame.
 */
function PortraitPlaceholder() {
  return (
    <View className="h-[214px] w-[214px] rounded-full bg-surface p-[8px]">
      <View className="relative h-full w-full overflow-hidden rounded-full bg-[#D8DCE2]">
        <View className="absolute left-1/2 top-[52px] h-[62px] w-[62px] -translate-x-1/2 rounded-full bg-[#B4BAC2]" />
        <View className="absolute left-1/2 top-[128px] h-[104px] w-[122px] -translate-x-1/2 rounded-t-[61px] bg-[#B4BAC2]" />
      </View>
    </View>
  );
}

/** Step 14 — a profile photo. Skippable, but flagged as worth doing. */
export function PhotoScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const next = () => router.push('/(onboarding)/verification');

  return (
    <StepLayout
      step={STEPS.photo}
      className="bg-surface"
      footer={
        <>
          <Button label={t('onboarding.photo.takePhoto')} onPress={next} />
          <Button
            label={t('onboarding.photo.chooseFromGallery')}
            variant="secondary"
            className="mt-[12px]"
            onPress={next}
          />
          <TextButton label={t('common.notNow')} className="mt-[14px]" onPress={next} />
        </>
      }
    >
      <View className="min-h-0 flex-1 items-center justify-center gap-[26px]">
        <PortraitPlaceholder />
        <View className="max-w-[290px] items-center">
          <Text weight={600} className="text-center text-[30px] leading-[33px] tracking-[-0.96px]">
            {t('onboarding.photo.title')}
          </Text>
          <Text className="mt-[10px] text-center text-[15.5px] leading-[22.5px] text-ink-dim">
            {t('onboarding.photo.subtitle')}
          </Text>
        </View>
      </View>
    </StepLayout>
  );
}
