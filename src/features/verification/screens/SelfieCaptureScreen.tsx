import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { haptics } from '@shared/lib/haptics';
import { Text } from '@shared/ui';

import { CameraFrame } from '../ui/CameraFrame';
import { SelfieCameraNotice, SelfieCameraPreview, useSelfieCamera } from '../ui/SelfieCamera';

/** Step 15a — the selfie camera. */
export function SelfieCaptureScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const camera = useSelfieCamera();
  const [shooting, setShooting] = useState(false);

  const leave = () => router.back();

  const shoot = async () => {
    if (shooting || !camera.live) return;
    setShooting(true);
    const uri = await camera.capture();
    setShooting(false);
    // A shot that failed leaves the camera up rather than sending an empty
    // review step on its way.
    if (uri) router.push({ pathname: '/(onboarding)/selfie-review', params: { uri } });
  };

  return (
    <CameraFrame
      background={
        camera.status === 'ready' ? (
          <SelfieCameraPreview
            view={camera.view}
            onReady={camera.onReady}
            onMountError={camera.onMountError}
          />
        ) : null
      }
      scrimOpacity={[0.45, 0.72]}
      scrimStops={[0, 0.26, 0.58, 1]}
      onClose={leave}
    >
      {camera.status === 'denied' || camera.status === 'unavailable' ? (
        <SelfieCameraNotice status={camera.status} onDismiss={leave} />
      ) : null}

      {camera.status === 'ready' ? (
        <>
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
              accessibilityLabel={t('verification.capture.shutter')}
              onPress={() => {
                haptics.commit();
                void shoot();
              }}
              // 78px white disc with a 5px translucent ring drawn outside it.
              className="h-[88px] w-[88px] rounded-full border-[5px] bg-white"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            />
            <Text className="text-[14.5px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {t('verification.capture.disclaimer')}
            </Text>
          </View>
        </>
      ) : null}
    </CameraFrame>
  );
}
