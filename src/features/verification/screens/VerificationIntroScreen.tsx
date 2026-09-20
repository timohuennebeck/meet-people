import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { Button, Mascot, Spacer, Text, TextButton } from '@shared/ui';

/** `#EAF1FE · radius:24px` card describing one verification step. */
function StepCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <View className="flex-row items-center gap-[14px] rounded-panel bg-brand-tint p-[18px]">
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-[10px]">
          <View className="h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-brand">
            <Text weight={600} className="text-[14px] text-white">
              {index}
            </Text>
          </View>
          <Text weight={600} className="text-[20px] tracking-[-0.4px]">
            {title}
          </Text>
        </View>
        <Text className="mt-[10px] text-[15px] leading-[21px] text-ink-body">{body}</Text>
      </View>
      <Mascot size={104} />
    </View>
  );
}

/** What the two verification steps involve, before the camera opens. */
export function VerificationIntroScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepScaffold
      position={STEPS.verification}
      eyebrow={t('verification.intro.eyebrow')}
      title={t('verification.intro.title')}
      subtitle={t('verification.intro.subtitle')}
      footer={
        <>
          <Button
            label={t('verification.intro.start')}
            onPress={() => router.push('/(onboarding)/selfie')}
          />
          <TextButton
            label={t('verification.intro.skip')}
            className="mt-[15px]"
            onPress={() => router.push('/(onboarding)/notifications')}
          />
        </>
      }
    >
      <View className="mt-[20px] shrink-0 gap-[14px]">
        <StepCard
          index={1}
          title={t('verification.intro.selfieTitle')}
          body={t('verification.intro.selfieBody')}
        />
        <StepCard
          index={2}
          title={t('verification.intro.reviewTitle')}
          body={t('verification.intro.reviewBody')}
        />
      </View>

      <Spacer />
    </StepScaffold>
  );
}
