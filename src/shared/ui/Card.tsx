import type { ReactNode } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Check } from './icons';
import { Text } from './Text';

/**
 * The design draws card outlines with `box-shadow` rings rather than borders:
 * `0 0 0 1px #E6EBF3` for a resting card and `inset 0 0 0 2px #2F7CF6` for a
 * selected one. A CSS ring sits outside the box and does not consume padding,
 * while a React Native border does — so each state's padding is reduced by its
 * border width, keeping the *content* in the same place as the export.
 */
const RINGS = {
  /** `0 0 0 1px #E6EBF3` — resting. */
  hair: { className: 'border border-hair', inset: 1 },
  /** `inset 0 0 0 2px #2F7CF6` — selected. */
  brand: { className: 'border-2 border-brand', inset: 2 },
  /** `0 0 0 1px #E0E7F2` — the paywall's unselected plan tile. */
  cool: { className: 'border border-hair-cool', inset: 1 },
  /** No outline. */
  none: { className: '', inset: 0 },
} as const;

export type CardRing = keyof typeof RINGS;

export interface CardProps extends ViewProps {
  children: ReactNode;
  ring?: CardRing;
  /** Design padding in px, before the border-width compensation is applied. */
  padding?: { vertical: number; horizontal: number };
  className?: string;
}

/** White rounded panel — the base for settings groups, sliders and tiles. */
export function Card({ children, ring = 'hair', padding, className, style, ...rest }: CardProps) {
  const recipe = RINGS[ring];

  return (
    <View
      {...rest}
      className={cn('rounded-panel bg-surface', recipe.className, className)}
      style={[
        padding
          ? {
              paddingVertical: padding.vertical - recipe.inset,
              paddingHorizontal: padding.horizontal - recipe.inset,
            }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface SelectableCardProps extends Omit<CardProps, 'ring'> {
  selected?: boolean;
  onPress?: () => void;
  /** Ring to use when not selected. */
  restingRing?: CardRing;
}

/** A `Card` that swaps to the brand ring when chosen. */
export function SelectableCard({
  children,
  selected = false,
  onPress,
  restingRing = 'hair',
  className,
  padding,
  ...rest
}: SelectableCardProps) {
  const ring: CardRing = selected ? 'brand' : restingRing;
  const recipe = RINGS[ring];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn('rounded-panel bg-surface', recipe.className, className)}
      style={({ pressed }) => [
        padding
          ? {
              paddingVertical: padding.vertical - recipe.inset,
              paddingHorizontal: padding.horizontal - recipe.inset,
            }
          : null,
        pressed ? { opacity: 0.85 } : null,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

/**
 * The 24px filled dot with a tick that marks a chosen row, and its hollow
 * resting counterpart (`inset 0 0 0 2px #DFE5EF`).
 */
export function SelectionDot({ selected, size = 24 }: { selected: boolean; size?: number }) {
  if (!selected) {
    return (
      <View
        className="shrink-0 rounded-full border-2 border-hair-mid"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <View
      className="shrink-0 items-center justify-center rounded-full bg-brand"
      style={{ width: size, height: size }}
    >
      <Check size={size * 0.54} />
    </View>
  );
}

/** `12.5px/600 · .09em tracking · #8A91A0` — the small caps label above a group. */
export function SectionLabel({ children, className }: { children: string; className?: string }) {
  return (
    <Text weight={600} className={cn('text-[12.5px] tracking-[1.125px] text-ink-ghost', className)}>
      {children}
    </Text>
  );
}

/** `32px/600 · 1.08 line-height · -.032em` — the question at the top of a step. */
export function StepTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text
      weight={600}
      className={cn('text-[32px] leading-[34.56px] tracking-[-1.024px]', className)}
    >
      {children}
    </Text>
  );
}

/** `15.5px/400 · 1.45 line-height · #72798A` — the one-line explainer under a title. */
export function StepSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text className={cn('text-[15.5px] leading-[22.5px] text-ink-dim', className)}>{children}</Text>
  );
}
