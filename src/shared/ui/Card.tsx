import type { ReactNode } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Check } from './icons';
import { Text, type TextProps } from './Text';

/**
 * The design draws card outlines with `box-shadow` rings rather than borders,
 * and the two kinds behave differently once converted to a React Native border.
 *
 * An **outset** ring (`0 0 0 1px #E6EBF3`) is painted outside the element and
 * overlaps nothing. A React Native border sits between the element's outer edge
 * and its padding, so the gap from the outline to the content is already the
 * design's padding — nothing to compensate. The only difference is that the
 * design's ring escapes the layout box while the border is inside it.
 *
 * An **inset** ring (`inset 0 0 0 2px #2F7CF6`) is painted over the first 2px
 * of the padding, so the content sits `padding − 2` from the outline. Here the
 * padding *is* reduced by the border width to put the content back.
 */
const RINGS = {
  /** `0 0 0 1px #E6EBF3` — resting, outset. */
  hair: { className: 'border border-hair', padCompensation: 0 },
  /** `inset 0 0 0 2px #2F7CF6` — selected, inset. */
  brand: { className: 'border-2 border-brand', padCompensation: 2 },
  /** `0 0 0 1px #E0E7F2` — the paywall's unselected plan tile, outset. */
  cool: { className: 'border border-hair-cool', padCompensation: 0 },
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
              paddingVertical: padding.vertical - recipe.padCompensation,
              paddingHorizontal: padding.horizontal - recipe.padCompensation,
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
}

/** A `Card` that swaps to the brand ring when chosen. */
export function SelectableCard({
  children,
  selected = false,
  onPress,
  className,
  padding,
  ...rest
}: SelectableCardProps) {
  const ring: CardRing = selected ? 'brand' : 'hair';
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
              paddingVertical: padding.vertical - recipe.padCompensation,
              paddingHorizontal: padding.horizontal - recipe.padCompensation,
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
export function SelectionDot({
  selected,
  size = 24,
  restingClassName = 'border-hair-mid',
}: {
  selected: boolean;
  size?: number;
  /** Ring colour when unselected — the paywall uses the cooler `#C9D5E8`. */
  restingClassName?: string;
}) {
  if (!selected) {
    return (
      <View
        className={cn('shrink-0 rounded-full border-2', restingClassName)}
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

/**
 * The small-caps label above a group. Two sizes: `12.5px/.09em/#8A91A0` on
 * settings and create pages, and `12px/.4px/#7A8595` inside a bottom sheet.
 */
export function SectionLabel({
  children,
  sheet = false,
  className,
}: {
  children: string;
  sheet?: boolean;
  className?: string;
}) {
  return (
    <Text
      weight={600}
      className={cn(
        sheet
          ? 'text-[12px] tracking-[0.4px] text-ink-faint'
          : 'text-[12.5px] tracking-[1.125px] text-ink-ghost',
        className,
      )}
    >
      {children}
    </Text>
  );
}

type BlockProps = {
  children: ReactNode;
  className?: string;
  style?: TextProps['style'];
};

/** `32px/600 · 1.08 line-height · -.032em` — the question at the top of a step. */
export function StepTitle({ children, className, style }: BlockProps) {
  return (
    <Text
      weight={600}
      className={cn('text-[32px] leading-[34.56px] tracking-[-1.024px]', className)}
      style={style}
    >
      {children}
    </Text>
  );
}

/** `15.5px/400 · 1.45 line-height · #72798A` — the one-line explainer under a title. */
export function StepSubtitle({ children, className, style }: BlockProps) {
  return (
    <Text className={cn('text-[15.5px] leading-[22.5px] text-ink-dim', className)} style={style}>
      {children}
    </Text>
  );
}

export interface LabelledDividerProps {
  label: string;
  className?: string;
}

/** `1px #DFE5EF rules · 14px #8A91A0 label` — "ou" between two alternatives. */
export function LabelledDivider({ label, className }: LabelledDividerProps) {
  return (
    <View className={cn('shrink-0 flex-row items-center gap-[12px]', className)}>
      <View className="h-[1px] flex-1 bg-hair-mid" />
      <Text className="text-[14px] text-ink-ghost">{label}</Text>
      <View className="h-[1px] flex-1 bg-hair-mid" />
    </View>
  );
}
