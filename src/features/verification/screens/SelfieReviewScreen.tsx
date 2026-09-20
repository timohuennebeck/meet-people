import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Glyph, Text } from '@shared/ui';

import { CameraButton, CameraFrame } from '../ui/CameraFrame';

/** Step 15b — keep the selfie or retake it. */
export function SelfieReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  // The shot the capture step just took. Reached any other way — a deep link,
  // a reload — there is no selfie to show, and none is invented.
  const { uri } = useLocalSearchParams<{ uri?: string }>();

  return (
    // Heavier at the bottom than the capture scrim, to carry the primary button.
    <CameraFrame
      background={
        uri ? <Image source={{ uri }} className="absolute inset-0" contentFit="cover" /> : null
      }
      scrimOpacity={[0.4, 0.8]}
      scrimStops={[0, 0.24, 0.52, 1]}
      // The × abandons verification; Retake, beside it, is the one that goes back.
      onClose={() => router.dismissTo('/(onboarding)/verification')}
    >
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
