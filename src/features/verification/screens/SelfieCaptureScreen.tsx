import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Glyph, Text } from '@shared/ui';

const SAMPLE = require('../../../../assets/images/selfie-sample.png');

/**
 * The dark gradient that keeps the close button and the shutter legible over
 * whatever the camera is showing.
 */
const SCRIM = [
  'rgba(14,18,25,0.45)',
  'rgba(14,18,25,0)',
  'rgba(14,18,25,0)',
  'rgba(14,18,25,0.72)',
] as const;

/** Step 15a — the selfie camera. */
export function SelfieCaptureScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="flex-1 overflow-hidden bg-surface-camera">
      <Image source={SAMPLE} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
      <LinearGradient colors={SCRIM} locations={[0, 0.26, 0.58, 1]} className="absolute inset-0" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        onPress={() => router.back()}
        className="absolute left-[20px] top-[60px] h-[38px] w-[38px] items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(14,18,25,0.45)' }}
      >
        <Glyph.CloseCamera size={14} />
      </Pressable>

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
    </View>
  );
}
