import { useCallback, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { cn } from '@shared/lib/cn';
import { shadows } from '@shared/theme/tokens';

import { Text } from './Text';

/** `28px · white fill · 2px brand ring · soft drop shadow` — the slider handle. */
function Thumb({ left }: { left: number }) {
  return (
    <View
      className="absolute h-[28px] w-[28px] rounded-full border-2 border-brand bg-surface"
      style={[{ left: `${left * 100}%`, marginLeft: -14 }, shadows.sliderThumb]}
    />
  );
}

/** `6px · #E3E9F2` track with a brand fill. */
function Track({ children }: { children: React.ReactNode }) {
  return (
    <View className="relative h-[28px] flex-row items-center">
      <View className="h-[6px] flex-1 rounded-[4px] bg-hair-rail" />
      {children}
    </View>
  );
}

export interface SliderProps {
  /** Current position as a fraction of the track, 0–1. */
  value: number;
  onChange?: (value: number) => void;
  className?: string;
}

/** Single-handle slider — the discovery radius control. */
export function Slider({ value, onChange, className }: SliderProps) {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      className={cn(className)}
      onLayout={onLayout}
      onPress={(event) => {
        if (!onChange || width === 0) return;
        onChange(Math.min(1, Math.max(0, event.nativeEvent.locationX / width)));
      }}
    >
      <Track>
        <View
          className="absolute left-0 h-[6px] rounded-[4px] bg-brand"
          style={{ width: `${value * 100}%` }}
        />
        <Thumb left={value} />
      </Track>
    </Pressable>
  );
}

export interface RangeSliderProps {
  /** Lower and upper handle positions as fractions of the track, 0–1. */
  range: [number, number];
  onChange?: (range: [number, number]) => void;
  className?: string;
}

/** Two-handle slider — the age-range controls in onboarding, settings and create. */
export function RangeSlider({ range, onChange, className }: RangeSliderProps) {
  const [low, high] = range;
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <Pressable
      accessibilityRole="adjustable"
      className={cn(className)}
      onLayout={onLayout}
      onPress={(event) => {
        if (!onChange || width === 0) return;
        const at = Math.min(1, Math.max(0, event.nativeEvent.locationX / width));
        // Move whichever handle is nearer to the tap.
        if (Math.abs(at - low) <= Math.abs(at - high)) onChange([Math.min(at, high), high]);
        else onChange([low, Math.max(at, low)]);
      }}
    >
      <Track>
        <View
          className="absolute h-[6px] rounded-[4px] bg-brand"
          style={{ left: `${low * 100}%`, width: `${(high - low) * 100}%` }}
        />
        <Thumb left={low} />
        <Thumb left={high} />
      </Track>
    </Pressable>
  );
}

/** `18 / 60+` — the min and max labels printed under a range slider. */
export function SliderBounds({ min, max }: { min: string; max: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-[13px] text-ink-ghost">{min}</Text>
      <Text className="text-[13px] text-ink-ghost">{max}</Text>
    </View>
  );
}

/** `38px/600 · -.04em` value with a muted unit beside it, e.g. "2 mi de Lisboa". */
export function SliderReadout({
  value,
  unit,
  size = 38,
}: {
  value: string;
  unit?: string;
  size?: number;
}) {
  return (
    <View className="flex-row items-baseline gap-[8px]">
      <Text weight={600} style={{ fontSize: size, lineHeight: size, letterSpacing: size * -0.04 }}>
        {value}
      </Text>
      {unit ? <Text className="text-[15px] text-ink-ghost">{unit}</Text> : null}
    </View>
  );
}

export interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange?: (value: T) => void;
}

/** `4px gutter · #EAEEF5 trough` — the mi / km unit switch. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row gap-[4px] rounded-pill bg-surface-rail p-[4px]">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange?.(option.value)}
            className={cn('rounded-pill px-[14px] py-[8px]', selected && 'bg-brand')}
          >
            <Text
              weight={selected ? 600 : 500}
              className={cn('text-[14.5px]', selected ? 'text-white' : 'text-ink-body')}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
