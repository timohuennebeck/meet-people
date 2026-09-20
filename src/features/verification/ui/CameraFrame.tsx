import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { Glyph } from '@shared/ui';

const SAMPLE = require('../../../../assets/images/selfie-sample.png');

/** The translucent fill every control over the camera sits on. */
const CONTROL_FILL = 'rgba(14,18,25,0.45)';

/**
 * A dark gradient over the camera, so controls stay legible whatever is behind
 * them. Both screens fade from the top, clear the middle, and darken again at
 * the bottom — only how dark, and where the stops fall, differs.
 */
function scrim(top: number, bottom: number) {
  return [
    `rgba(14,18,25,${top})`,
    'rgba(14,18,25,0)',
    'rgba(14,18,25,0)',
    `rgba(14,18,25,${bottom})`,
  ] as const;
}

export interface CameraButtonProps {
  children: ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  className?: string;
}

/** `38px · rgba(14,18,25,.45)` — a round or pill control laid over the camera. */
export function CameraButton({
  children,
  accessibilityLabel,
  onPress,
  className,
}: CameraButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={cn('absolute top-[60px] h-[38px] flex-row items-center justify-center', className)}
      style={({ pressed }) => [
        { backgroundColor: CONTROL_FILL },
        pressed ? { opacity: 0.7 } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export interface CameraFrameProps {
  /** Opacity of the top and bottom scrim stops. */
  scrimOpacity: readonly [top: number, bottom: number];
  /** Where the four stops fall, as fractions of the height. */
  scrimStops: readonly [number, number, number, number];
  /**
   * Where the × goes. It leaves verification entirely, which is not the same
   * as going back — on the review step, back is the retake button beside it.
   */
  onClose: () => void;
  children: ReactNode;
}

/**
 * The selfie camera behind both verification steps: the preview, the scrim over
 * it, and the × that abandons verification.
 */
export function CameraFrame({ scrimOpacity, scrimStops, onClose, children }: CameraFrameProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 overflow-hidden bg-surface-camera">
      <Image source={SAMPLE} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
      <LinearGradient
        colors={scrim(scrimOpacity[0], scrimOpacity[1])}
        locations={scrimStops}
        className="absolute inset-0"
      />

      <CameraButton
        accessibilityLabel={t('common.cancel')}
        onPress={onClose}
        className="left-[20px] w-[38px] rounded-full"
      >
        <Glyph.CloseCamera size={14} />
      </CameraButton>

      {children}
    </View>
  );
}
