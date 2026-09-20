import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Glyph, Text } from '@shared/ui';

import { CameraButton, CameraFrame } from '../ui/CameraFrame';

/** Step 15b — keep the selfie or retake it. */
export function SelfieReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    // Heavier at the bottom than the capture scrim, to carry the primary button.
    <CameraFrame scrimOpacity={[0.4, 0.8]} scrimStops={[0, 0.24, 0.52, 1]}>
      <CameraButton
        accessibilityLabel={t('verification.review.retake')}
        onPress={() => router.back()}
        className="right-[20px] gap-[8px] rounded-pill px-[15px]"
      >
        <Glyph.RetakeGlyph size={15} />
        <Text weight={500} className="text-[14.5px] text-white">
          {t('verification.review.retake')}
        </Text>
      </CameraButton>

      <View className="absolute bottom-[38px] left-[20px] right-[20px] gap-[14px]">
        <Text className="text-center text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {t('verification.review.prompt')}
        </Text>
        <Button
          label={t('verification.review.use')}
          onPress={() => router.push('/(onboarding)/verification-pending')}
        />
      </View>
    </CameraFrame>
  );
}
