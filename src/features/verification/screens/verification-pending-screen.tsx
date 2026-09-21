import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { STEPS } from '@shared/lib/steps';
import { Button, Spacer } from '@shared/ui/button';
import { StepScaffold } from '@shared/ui/step-scaffold';
import { Text } from '@shared/ui/text';
import { TimelineStep } from '@shared/ui/timeline';

/** The review timeline, shown while a human checks the selfie. */
export function VerificationPendingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepScaffold
      position={STEPS.verification}
      title={t('verification.pending.title')}
      subtitle={t('verification.pending.subtitle')}
      footer={
        <>
          <Button
            label={t('common.continue')}
            onPress={() => router.push('/(onboarding)/notifications')}
          />
          {/* Informational, not an action — the design styles it like one. */}
          <Text weight={500} className="mt-[15px] text-center text-[16px] text-ink-body">
            {t('verification.pending.notice')}
          </Text>
        </>
      }
    >
      <View className="mt-[24px] shrink-0 gap-[20px] px-[18px] py-[20px]">
        <TimelineStep
          state="done"
          connector={30}
          title={t('verification.pending.receivedTitle')}
          description={t('verification.pending.receivedBody')}
        />
        <TimelineStep
          state="active"
          connector={30}
          tight
          title={t('verification.pending.inReviewTitle')}
          description={t('verification.pending.inReviewBody')}
        />
        <TimelineStep
          state="pending"
          tight
          title={t('verification.pending.releasedTitle')}
          description={t('verification.pending.releasedBody')}
        />
      </View>

      <Spacer />
    </StepScaffold>
  );
}
