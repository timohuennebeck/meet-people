import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { gradients, shadows } from '@shared/theme/tokens';
import { Button, Mascot, Spacer, Text, TextButton } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

const APP_MARK = require('../../../../assets/images/app-icon-mark.png');

/** A sample push notification, so the ask shows what it is asking for. */
function SampleNotification() {
  const { t } = useTranslation();

  return (
    <View
      className="flex-row gap-[12px] rounded-well p-[14px]"
      style={[{ backgroundColor: 'rgba(255,255,255,0.95)' }, shadows.notification]}
    >
      <View className="h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-hair bg-surface">
        <Image source={APP_MARK} style={{ width: 34, height: 34 }} contentFit="contain" />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-baseline gap-[8px]">
          <Text weight={500} className="text-[12.5px] tracking-[0.5px]">
            {t('onboarding.notifications.sampleApp')}
          </Text>
          <View className="flex-1" />
          <Text className="text-[12.5px] text-ink-dim">
            {t('onboarding.notifications.sampleWhen')}
          </Text>
        </View>
        <Text weight={600} className="mt-[3px] text-[15.5px]">
          {t('onboarding.notifications.sampleTitle')}
        </Text>
        <Text className="mt-[2px] text-[15px] text-ink-body">
          {t('onboarding.notifications.sampleBody')}
        </Text>
      </View>
    </View>
  );
}

/** Step 16 — the notification permission ask. */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const next = () => router.push('/(onboarding)/rules');

  return (
    <StepLayout
      step={STEPS.notifications}
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      footer={
        <>
          <Button label={t('onboarding.notifications.allow')} onPress={next} />
          <TextButton label={t('common.notNow')} className="mt-[15px]" onPress={next} />
        </>
      }
    >
      <LinearGradient
        colors={gradients.photo}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        className="mt-[20px] h-[300px] shrink-0 overflow-hidden rounded-[28px] p-[18px]"
      >
        <SampleNotification />
        <View className="flex-1 items-center justify-end">
          <Mascot size={136} />
        </View>
      </LinearGradient>

      <Spacer />
    </StepLayout>
  );
}
