import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Glyph, Text } from '@shared/ui';

const SAMPLE = require('../../../../assets/images/selfie-sample.png');

/** Slightly heavier than the capture scrim, to carry the primary button. */
const SCRIM = [
  'rgba(14,18,25,0.4)',
  'rgba(14,18,25,0)',
  'rgba(14,18,25,0)',
  'rgba(14,18,25,0.8)',
] as const;

/** Step 15b — keep the selfie or retake it. */
export function SelfieReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="flex-1 overflow-hidden bg-surface-camera">
      <Image source={SAMPLE} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
      <LinearGradient colors={SCRIM} locations={[0, 0.24, 0.52, 1]} className="absolute inset-0" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        onPress={() => router.back()}
        className="absolute left-[20px] top-[60px] h-[38px] w-[38px] items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(14,18,25,0.45)' }}
      >
        <Glyph.CloseCamera size={14} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        className="absolute right-[20px] top-[60px] h-[38px] flex-row items-center gap-[8px] rounded-pill px-[15px]"
        style={{ backgroundColor: 'rgba(14,18,25,0.45)' }}
      >
        <Glyph.RetakeGlyph size={15} />
        <Text weight={500} className="text-[14.5px] text-white">
          {t('verification.review.retake')}
        </Text>
      </Pressable>

      <View className="absolute bottom-[38px] left-[20px] right-[20px] gap-[14px]">
        <Text className="text-center text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {t('verification.review.prompt')}
        </Text>
        <Button
          label={t('verification.review.use')}
          onPress={() => router.push('/(onboarding)/verification-pending')}
        />
      </View>
    </View>
  );
}
