import { View } from 'react-native';

import type { DistanceUnit } from '@shared/data/schemas';
import { Card, Chip, SegmentedControl, Slider, SliderReadout, Text } from '@shared/ui';

/** Presets under the slider, in miles. */
const PRESETS = [1, 2, 3, 6] as const;

/** Where each preset sits on the track, so the handle lands on it exactly. */
const PRESET_FRACTION: Record<(typeof PRESETS)[number], number> = {
  1: 0.13,
  2: 0.26,
  3: 0.42,
  6: 0.92,
};

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
          value={PRESET_FRACTION[radius as (typeof PRESETS)[number]] ?? 0.26}
          valueText={`${radius} ${unit}`}
          onChange={(fraction) => {
            // Snap to the nearest preset, which is all the design exposes.
            const nearest = PRESETS.reduce((best, preset) =>
              Math.abs(PRESET_FRACTION[preset] - fraction) <
              Math.abs(PRESET_FRACTION[best] - fraction)
                ? preset
                : best,
            );
            onChangeRadius?.(nearest);
          }}
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
