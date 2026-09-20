import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@shared/ui';

import { CameraFrame } from '../ui/CameraFrame';

/** Step 15a — the selfie camera. */
export function SelfieCaptureScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <CameraFrame scrimOpacity={[0.45, 0.72]} scrimStops={[0, 0.26, 0.58, 1]}>
      <Text
        weight={500}
        className="absolute left-0 right-0 top-[112px] text-center text-[15px] text-white"
      >
        {t('verification.capture.prompt')}
      </Text>

      {/* The oval the face should sit inside — 250×316 with a 2px ring outside. */}
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <View
          className="h-[320px] w-[254px] rounded-[130px] border-2"
          style={{ borderColor: 'rgba(255,255,255,0.85)' }}
        />
      </View>

      <View className="absolute bottom-[56px] left-0 right-0 items-center gap-[16px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('verification.capture.prompt')}
          onPress={() => router.push('/(onboarding)/selfie-review')}
          // 78px white disc with a 5px translucent ring drawn outside it.
          className="h-[88px] w-[88px] rounded-full border-[5px] bg-white"
          style={{ borderColor: 'rgba(255,255,255,0.3)' }}
        />
        <Text className="text-[14.5px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {t('verification.capture.disclaimer')}
        </Text>
      </View>
    </CameraFrame>
  );
}
