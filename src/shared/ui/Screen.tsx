import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@shared/lib/cn';

/**
 * Padding presets lifted from the design. Screens in the export are absolutely
 * positioned inside a 402×874 frame with literal paddings, e.g.
 * `padding:56px 20px 34px`, so those numbers are reproduced here by name.
 */
const PADDING = {
  /** `56px 20px 34px` — the default onboarding / settings step. */
  step: { top: 56, horizontal: 20, bottom: 34 },
  /** `56px 24px 34px` — the location step, which runs slightly wider margins. */
  stepWide: { top: 56, horizontal: 24, bottom: 34 },
  /** `62px 24px 34px` — welcome and success screens. */
  hero: { top: 62, horizontal: 24, bottom: 34 },
  /** `56px 20px 0` — screens whose keyboard is open, so no bottom inset. */
  keyboard: { top: 56, horizontal: 20, bottom: 0 },
  /** `56px 20px 20px` — the sign-up screen, which keeps a small bottom inset. */
  form: { top: 56, horizontal: 20, bottom: 20 },
  /** `56px 20px 30px` — the paywall. */
  paywall: { top: 56, horizontal: 20, bottom: 30 },
} as const;

export type ScreenPadding = keyof typeof PADDING;

export interface ScreenProps extends ViewProps {
  children: ReactNode;
  /** Which padding preset from the design to apply. */
  padding?: ScreenPadding;
  /**
   * Honour the device safe area. The design's 56px top and 34px bottom already
   * match an iPhone's insets closely; this keeps content clear of the notch and
   * home indicator on hardware whose insets run larger.
   */
  safe?: boolean;
  className?: string;
}

/**
 * Root container for a screen: sets the background, applies the design's
 * padding preset and clips overflow the way the design frame does.
 */
export function Screen({
  children,
  padding = 'step',
  safe = true,
  className,
  style,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = PADDING[padding];

  return (
    <View
      {...rest}
      className={cn('flex-1 overflow-hidden bg-surface-app', className)}
      style={[
        {
          paddingTop: safe ? Math.max(pad.top, insets.top) : pad.top,
          paddingLeft: pad.horizontal,
          paddingRight: pad.horizontal,
          paddingBottom: safe ? Math.max(pad.bottom, insets.bottom) : pad.bottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
