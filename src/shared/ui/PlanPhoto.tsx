import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { gradientAngles, gradients } from '@shared/theme/tokens';

import { Mascot } from './Mascot';
import { Text } from './Text';

export interface PlanPhotoProps {
  /** Frame height: 140 on a map card, 160–220 inside a sheet. */
  height: number;
  /** Mascot size, which the design scales with the frame. */
  mascotSize: number;
  radius?: number;
  /** Status badges pinned to the top-left corner ("VOCÊ É HOST", "VOCÊ ESTÁ DENTRO"). */
  leading?: ReactNode;
  /** Inset for the leading badges: 10 on a map card, 12 inside a sheet. */
  leadingInset?: number;
  /** Badge pinned to the top-right corner. */
  trailing?: ReactNode;
  /**
   * Renders the round × that dismisses a sheet. It is the only visible way out
   * of a transparent modal, so it needs a handler and an accessible name.
   */
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

/**
 * The plan image placeholder: a `158deg` blue gradient with Pips centred on it.
 * Real photos will replace the gradient once plans carry uploads.
 */
export function PlanPhoto({
  height,
  mascotSize,
  radius = 22,
  leading,
  leadingInset = 12,
  trailing,
  onDismiss,
  dismissLabel,
  className,
}: PlanPhotoProps) {
  return (
    <View
      className={cn('relative shrink-0 overflow-hidden', className)}
      style={{ height, borderRadius: radius }}
    >
      <LinearGradient
        colors={gradients.photo}
        {...gradientAngles.photo}
        className="h-full w-full items-center justify-center"
        style={{ borderRadius: radius }}
      >
        <Mascot size={mascotSize} />
      </LinearGradient>
      {leading ? (
        <View
          className="absolute flex-row gap-[6px]"
          style={{ left: leadingInset, top: leadingInset }}
          pointerEvents="none"
        >
          {leading}
        </View>
      ) : null}
      {trailing ? (
        <View className="absolute right-[10px] top-[10px]" pointerEvents="none">
          {trailing}
        </View>
      ) : null}
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          onPress={onDismiss}
          className="absolute right-[10px] top-[10px] h-[32px] w-[32px] items-center justify-center rounded-full bg-white/90"
        >
          <Text weight={600} className="text-[16px]">
            ×
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
