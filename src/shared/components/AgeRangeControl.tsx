import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { Card, Chip, RangeSlider, SliderBounds, SliderReadout, Text } from '@shared/ui';

/** The slider spans 18–60+; fractions below are measured against that span. */
export const AGE_MIN = 18;
export const AGE_MAX = 60;

export type AgeRange = readonly [number, number];

/** Converts an age to its position on the track. */
export function ageToFraction(age: number): number {
  return (age - AGE_MIN) / (AGE_MAX - AGE_MIN);
}

/** Converts a position on the track back to a whole-year age. */
export function fractionToAge(fraction: number): number {
  return Math.round(AGE_MIN + fraction * (AGE_MAX - AGE_MIN));
}

export interface AgeRangeControlProps {
  range: AgeRange;
  onChange?: (range: AgeRange) => void;
  /** Count line inside the card, e.g. "9 planos nesta faixa". */
  summary?: string;
  /**
   * Where the presets sit. The onboarding step places them below the card; the
   * create and settings pages keep them inside it.
   */
  presets?: 'inside' | 'none';
  /** Readout size: 38px in onboarding and create, 32px in settings. */
  readoutSize?: number;
  /** Label for the "any age" preset. */
  allLabel: string;
  unitLabel: string;
  className?: string;
}

const PRESETS: readonly AgeRange[] = [
  [21, 34],
  [25, 40],
];

function isSame(a: AgeRange, b: AgeRange) {
  return a[0] === b[0] && a[1] === b[1];
}

/** Renders the three preset pills shared by every age control. */
export function AgePresets({
  range,
  onChange,
  allLabel,
  className,
}: Pick<AgeRangeControlProps, 'range' | 'onChange' | 'allLabel'> & { className?: string }) {
  const isAll = range[0] === AGE_MIN && range[1] === AGE_MAX;

  return (
    <View className={cn('flex-row gap-[8px]', className)}>
      {PRESETS.map((preset) => (
        <Chip
          key={preset.join('-')}
          grow
          label={`${preset[0]}–${preset[1]}`}
          size="scope"
          tone={!isAll && isSame(range, preset) ? 'brand' : 'fill'}
          onPress={() => onChange?.(preset)}
          className="px-0 py-[9px]"
        />
      ))}
      <Chip
        grow
        label={allLabel}
        size="scope"
        tone={isAll ? 'brand' : 'fill'}
        onPress={() => onChange?.([AGE_MIN, AGE_MAX])}
        className="px-0 py-[9px]"
      />
    </View>
  );
}

/**
 * The age-range card: a `21–34 anos` readout, a two-handle slider, its bounds,
 * and optionally the presets and a match count.
 */
export function AgeRangeControl({
  range,
  onChange,
  summary,
  presets = 'none',
  readoutSize = 38,
  allLabel,
  unitLabel,
  className,
}: AgeRangeControlProps) {
  return (
    <Card padding={{ vertical: 22, horizontal: 18 }} className={className}>
      <View className="gap-[16px]">
        <SliderReadout value={`${range[0]}–${range[1]}`} unit={unitLabel} size={readoutSize} />

        <RangeSlider
          range={[ageToFraction(range[0]), ageToFraction(range[1])]}
          onChange={([low, high]) => onChange?.([fractionToAge(low), fractionToAge(high)])}
        />

        <SliderBounds min={String(AGE_MIN)} max={`${AGE_MAX}+`} />

        {presets === 'inside' ? (
          <AgePresets range={range} onChange={onChange} allLabel={allLabel} />
        ) : null}

        {summary ? <Text className="text-center text-[15px] text-ink-dim">{summary}</Text> : null}
      </View>
    </Card>
  );
}
