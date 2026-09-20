import { MapPinSimple } from 'phosphor-react-native';
import { View } from 'react-native';

import type { Place } from '@shared/data/schemas';
import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { SelectableCard, SelectionDot, Text } from '@shared/ui';

export interface PlaceRowProps {
  place: Place;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * `radius:18px · padding:14px 16px · 40px pin bubble` — one venue in the
 * create flow's recent and nearby lists.
 */
export function PlaceRow({ place, selected = false, onPress }: PlaceRowProps) {
  return (
    // `SelectableCard` owns the ring swap and the padding the inset brand ring
    // eats; only the radius differs from its default, which `cn()` resolves.
    <SelectableCard
      selected={selected}
      onPress={onPress}
      padding={{ vertical: 14, horizontal: 16 }}
      className="flex-row items-center gap-[12px] rounded-field"
    >
      <View
        className={cn(
          'h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-brand-wash' : 'bg-surface-chip',
        )}
      >
        <MapPinSimple size={20} color={selected ? colors.brand : colors.inkDim} />
      </View>

      <View className="min-w-0 flex-1 gap-[2px]">
        <Text weight={600} numberOfLines={1} className="text-[16px]">
          {place.name}
        </Text>
        <Text numberOfLines={1} className="text-[14px] text-ink-dim">
          {`${place.address} · ${place.distanceLabel}`}
        </Text>
      </View>

      {/* The design shows a dot only on the chosen row, but letting it appear
          and vanish takes 36px in and out of the text column, so the name and
          address re-truncate as you move between rows. The slot is reserved in
          both states; only the dot itself comes and goes. */}
      <View className="w-[24px] shrink-0">{selected ? <SelectionDot selected /> : null}</View>
    </SelectableCard>
  );
}
