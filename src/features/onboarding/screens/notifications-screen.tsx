import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useUpdatePreferences } from '@shared/data/queries/use-preferences';
import { STEPS } from '@shared/lib/steps';
import { gradientAngles, gradients, shadows } from '@shared/theme/tokens';
import { Button, Spacer, TextButton } from '@shared/ui/button';
import { Mascot } from '@shared/ui/mascot';
import { StepScaffold } from '@shared/ui/step-scaffold';
import { Text } from '@shared/ui/text';

const APP_MARK = require('../../../../assets/images/app-icon-mark.png');

/** A sample push notification, so the ask shows what it is asking for. */
function SampleNotification() {
  const { t } = useTranslation();

  return (
    <View
      className="flex-row gap-[12px] rounded-well p-[14px]"
      style={[{ backgroundColor: 'rgba(255,255,255,0.95)' }, shadows.notification]}
    >
      <View className="h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-hair bg-surface">
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

/** The notification permission ask. */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: update } = useUpdatePreferences();

  /**
   * The answer is the preference. The system prompt is a separate ask that
   * needs a push library this app does not have yet, but whether the person
   * wants to be told is theirs to say either way, and it is stored either way.
   */
  const answer = (notificationsEnabled: boolean) => {
    update({ notificationsEnabled });
    router.push('/(onboarding)/rules');
  };

  return (
    <StepScaffold
      position={STEPS.notifications}
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      footer={
        <>
          <Button label={t('onboarding.notifications.allow')} onPress={() => answer(true)} />
          <TextButton
            label={t('common.notNow')}
            className="mt-[15px]"
            onPress={() => answer(false)}
          />
        </>
      }
    >
      <LinearGradient
        colors={gradients.photo}
        {...gradientAngles.photo}
        className="mt-[20px] h-[300px] shrink-0 overflow-hidden rounded-[28px] p-[18px]"
      >
        <SampleNotification />
        <View className="flex-1 items-center justify-end">
          <Mascot size={136} />
        </View>
      </LinearGradient>

      <Spacer />
    </StepScaffold>
  );
}
