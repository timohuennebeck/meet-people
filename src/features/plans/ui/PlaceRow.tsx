import { MapPinSimple } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import type { Place } from '@shared/data/schemas';
import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { SelectionDot, Text } from '@shared/ui';

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
  // The selected ring is inset and overlaps the padding; the resting one is not.
  const padCompensation = selected ? 2 : 0;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-[12px] rounded-field bg-surface',
        selected ? 'border-2 border-brand' : 'border border-hair',
      )}
      style={({ pressed }) => [
        { paddingVertical: 14 - padCompensation, paddingHorizontal: 16 - padCompensation },
        pressed ? { opacity: 0.85 } : null,
      ]}
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

      {selected ? <SelectionDot selected /> : null}
    </Pressable>
  );
}
