import { Camera, CameraView } from 'expo-camera';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@shared/ui/button';
import { Text } from '@shared/ui/text';

/**
 * What the camera can do for us right now.
 *
 * `checking` covers the permission round-trip, `unavailable` covers every way
 * there is no camera to show — the web screenshot harness, a simulator, a
 * browser tab without a webcam, a build without the native module.
 */
export type SelfieCameraStatus = 'checking' | 'ready' | 'denied' | 'unavailable';

export interface SelfieCamera {
  status: SelfieCameraStatus;
  /** True once the preview is actually running, so a shot can be taken. */
  live: boolean;
  /** Takes the shot and returns its local URI, or `null` if it failed. */
  capture: () => Promise<string | null>;
  /** Handed to the preview so the shutter has something to shoot with. */
  view: RefObject<CameraView | null>;
  onReady: () => void;
  onMountError: () => void;
}

/**
 * Asks — carefully — what this device will allow. Neither check exists on every
 * platform, so both failures are answers rather than crashes: `isAvailableAsync`
 * is web-only and throws elsewhere, and the permission call throws when the
 * native module is missing altogether.
 */
async function resolveStatus(): Promise<SelfieCameraStatus> {
  try {
    if (!(await CameraView.isAvailableAsync())) return 'unavailable';
  } catch {
    // Not implemented here — a mount error is the signal on this platform.
  }

  try {
    const current = await Camera.getCameraPermissionsAsync();
    // Asking again once it has been refused for good only re-returns the refusal.
    const response =
      current.granted || !current.canAskAgain
        ? current
        : await Camera.requestCameraPermissionsAsync();
    return response.granted ? 'ready' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Permission, preview state and the shutter, for the capture step. */
export function useSelfieCamera(): SelfieCamera {
  const view = useRef<CameraView>(null);
  const [status, setStatus] = useState<SelfieCameraStatus>('checking');
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void resolveStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const capture = useCallback(async () => {
    try {
      const shot = await view.current?.takePictureAsync({ quality: 0.9 });
      return shot?.uri ?? null;
    } catch (error) {
      console.warn('Could not take the selfie', error);
      return null;
    }
  }, []);

  const onReady = useCallback(() => setLive(true), []);
  const onMountError = useCallback(() => {
    setLive(false);
    setStatus('unavailable');
  }, []);

  return { status, live, capture, view, onReady, onMountError };
}

// Stays a type alias: as an interface it would declare no members of its own,
// which is its supertype under a second name.
export type SelfieCameraPreviewProps = Pick<SelfieCamera, 'view' | 'onReady' | 'onMountError'>;

/**
 * The live front-facing preview, filling whatever it is dropped into. It takes
 * the controller's parts one by one, because a ref has to reach the `ref` prop
 * as a plain value rather than as a property read during render.
 */
export function SelfieCameraPreview({ view, onReady, onMountError }: SelfieCameraPreviewProps) {
  return (
    <CameraView
      ref={view}
      facing="front"
      // A selfie should move the way a mirror does while it is being framed.
      mirror
      style={StyleSheet.absoluteFill}
      onCameraReady={onReady}
      onMountError={onMountError}
    />
  );
}

/** Opens the app's own row in the system settings, where one exists. */
function openSettings() {
  try {
    void Linking.openSettings();
  } catch (error) {
    // The web build has no system settings to send anyone to.
    console.warn('Could not open the system settings', error);
  }
}

/**
 * Stands in for the preview when there is nothing to preview: says which of the
 * two it is, and offers the only move that helps in each case.
 */
export function SelfieCameraNotice({
  status,
  onDismiss,
}: {
  status: 'denied' | 'unavailable';
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const denied = status === 'denied';

  return (
    <View className="absolute inset-0 items-center justify-center px-[28px]">
      <Text weight={600} className="text-center text-[22px] leading-[28px] text-white">
        {t(denied ? 'verification.capture.deniedTitle' : 'verification.capture.noCameraTitle')}
      </Text>
      <Text
        className="mt-[10px] text-center text-[15px] leading-[21px]"
        style={{ color: 'rgba(255,255,255,0.85)' }}
      >
        {t(denied ? 'verification.capture.deniedBody' : 'verification.capture.noCameraBody')}
      </Text>
      {denied ? (
        <Button
          label={t('verification.capture.openSettings')}
          className="mt-[24px]"
          onPress={openSettings}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onDismiss}
        className="mt-[16px] w-full items-center py-[8px]"
      >
        <Text weight={500} className="text-[16px] text-white">
          {t('common.notNow')}
        </Text>
      </Pressable>
    </View>
  );
}
