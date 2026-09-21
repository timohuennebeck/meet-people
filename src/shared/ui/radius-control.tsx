import { View } from 'react-native';

import type { DistanceUnit } from '@shared/data/schemas';
import { Card } from '@shared/ui/card';
import { Chip } from '@shared/ui/chip';
import { SegmentedControl, Slider, SliderReadout } from '@shared/ui/slider';
import { Text } from '@shared/ui/text';

/** Presets under the slider, in miles. */
const PRESETS = [1, 2, 3, 6] as const;

/**
 * The track's usable span, taken from where the design draws the handle for the
 * smallest and largest presets (`0.13` and `0.92`). Radius runs linearly across
 * it, so the four presets land within a couple of pixels of the design's marks
 * while the handle can still be dragged to anything in between.
 */
const TRACK = { from: 0.13, to: 0.92 } as const;
const RANGE = { min: 1, max: 6 } as const;

function radiusToFraction(radius: number): number {
  const along = (radius - RANGE.min) / (RANGE.max - RANGE.min);
  return TRACK.from + along * (TRACK.to - TRACK.from);
}

/** Half-mile steps: fine enough to feel continuous, coarse enough to read well. */
function fractionToRadius(fraction: number): number {
  const along = (fraction - TRACK.from) / (TRACK.to - TRACK.from);
  const radius = RANGE.min + along * (RANGE.max - RANGE.min);
  return Math.min(RANGE.max, Math.max(RANGE.min, Math.round(radius * 2) / 2));
}

export interface RadiusControlProps {
  radius: number;
  unit: DistanceUnit;
  /** The city the radius is measured from, e.g. "de Lisboa". */
  origin: string;
  /** Count line under the presets, e.g. "14 planos neste raio". */
  summary: string;
  onChangeRadius?: (radius: number) => void;
  onChangeUnit?: (unit: DistanceUnit) => void;
  className?: string;
}

/**
 * The radius card: big readout with a mi/km switch, a slider, four presets and
 * the resulting plan count. Shared by the onboarding step and the settings page.
 */
export function RadiusControl({
  radius,
  unit,
  origin,
  summary,
  onChangeRadius,
  onChangeUnit,
  className,
}: RadiusControlProps) {
  return (
    <Card padding={{ vertical: 22, horizontal: 18 }} className={className}>
      <View className="gap-[18px]">
        <View className="flex-row items-center justify-between gap-[8px]">
          <SliderReadout value={`${radius} ${unit}`} unit={origin} />
          <SegmentedControl
            value={unit}
            onChange={onChangeUnit}
            options={[
              { value: 'mi', label: 'mi' },
              { value: 'km', label: 'km' },
            ]}
          />
        </View>

        <Slider
          value={radiusToFraction(radius)}
          valueText={`${radius} ${unit}`}
          onChange={(fraction) => onChangeRadius?.(fractionToRadius(fraction))}
        />

        <View className="flex-row gap-[8px]">
          {PRESETS.map((preset) => (
            <Chip
              key={preset}
              grow
              label={`${preset} ${unit}`}
              size="preset"
              tone={preset === radius ? 'brand' : 'fill'}
              onPress={() => onChangeRadius?.(preset)}
            />
          ))}
        </View>

        <Text className="text-center text-[15px] text-ink-dim">{summary}</Text>
      </View>
    </Card>
  );
}
