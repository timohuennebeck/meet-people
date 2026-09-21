import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { Card } from '@shared/ui/card';
import { Chip } from '@shared/ui/chip';
import { RangeSlider, SliderBounds, SliderReadout } from '@shared/ui/slider';
import { Text } from '@shared/ui/text';

/** The slider spans 18–60+; fractions below are measured against that span. */
export const AGE_MIN = 18;
export const AGE_MAX = 60;

export type AgeRange = readonly [number, number];

/**
 * The track's scale.
 *
 * The design draws the default 21–34 range with its handles at 14% and 58%,
 * which is not where a straight 18–60 mapping would put them — the mock places
 * them by eye. Anchoring the scale on those two points reproduces the export
 * exactly at the default while staying monotonic everywhere else, so the
 * control still behaves like a slider.
 */
const ANCHORS: readonly [age: number, fraction: number][] = [
  [AGE_MIN, 0],
  [21, 0.14],
  [34, 0.58],
  [AGE_MAX, 1],
];

/** Converts an age to its position on the track. */
export function ageToFraction(age: number): number {
  const clamped = Math.min(AGE_MAX, Math.max(AGE_MIN, age));
  for (let i = 1; i < ANCHORS.length; i += 1) {
    const [lowAge, lowFraction] = ANCHORS[i - 1]!;
    const [highAge, highFraction] = ANCHORS[i]!;
    if (clamped <= highAge) {
      const progress = (clamped - lowAge) / (highAge - lowAge);
      return lowFraction + progress * (highFraction - lowFraction);
    }
  }
  return 1;
}

/** Converts a position on the track back to a whole-year age. */
export function fractionToAge(fraction: number): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  for (let i = 1; i < ANCHORS.length; i += 1) {
    const [lowAge, lowFraction] = ANCHORS[i - 1]!;
    const [highAge, highFraction] = ANCHORS[i]!;
    if (clamped <= highFraction) {
      const progress = (clamped - lowFraction) / (highFraction - lowFraction);
      return Math.round(lowAge + progress * (highAge - lowAge));
    }
  }
  return AGE_MAX;
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
  /** Card padding: 22px in onboarding and create, 20px on the settings page. */
  cardPadding?: number;
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

/**
 * Renders the three preset pills shared by every age control.
 *
 * The design pads them 10px when they sit below the card (onboarding) and 9px
 * when they sit inside it (create and settings).
 */
export function AgePresets({
  range,
  onChange,
  allLabel,
  standalone = false,
  className,
}: Pick<AgeRangeControlProps, 'range' | 'onChange' | 'allLabel'> & {
  standalone?: boolean;
  className?: string;
}) {
  const isAll = range[0] === AGE_MIN && range[1] === AGE_MAX;
  const size = standalone ? 'presetTall' : 'preset';

  return (
    <View className={cn('flex-row gap-[8px]', className)}>
      {PRESETS.map((preset) => (
        <Chip
          key={preset.join('-')}
          grow
          label={`${preset[0]}–${preset[1]}`}
          size={size}
          tone={!isAll && isSame(range, preset) ? 'brand' : 'fill'}
          onPress={() => onChange?.(preset)}
        />
      ))}
      <Chip
        grow
        label={allLabel}
        size={size}
        tone={isAll ? 'brand' : 'fill'}
        onPress={() => onChange?.([AGE_MIN, AGE_MAX])}
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
  cardPadding = 22,
  allLabel,
  unitLabel,
  className,
}: AgeRangeControlProps) {
  return (
    <Card padding={{ vertical: cardPadding, horizontal: 18 }} className={className}>
      <View className="gap-[16px]">
        <SliderReadout value={`${range[0]}–${range[1]}`} unit={unitLabel} size={readoutSize} />

        <RangeSlider
          range={[ageToFraction(range[0]), ageToFraction(range[1])]}
          valueText={`${range[0]}–${range[1]} ${unitLabel}`}
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
