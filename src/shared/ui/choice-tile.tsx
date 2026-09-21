import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { SelectableCard, SelectionDot } from '@shared/ui/card';
import { Mascot } from '@shared/ui/mascot';
import { Text } from '@shared/ui/text';

export interface ChoiceTileProps {
  label: string;
  /** Second line under the label, e.g. "e outras identidades". */
  detail?: string;
  selected: boolean;
  onPress?: () => void;
  /** Replaces the mascot bubble, used by the "prefer not to say" em dash. */
  icon?: ReactNode;
}

/**
 * `radius:22px · padding:18px 16px · 66px bubble` — the square selection tile
 * used for pronouns in onboarding and for gender in the audience settings.
 */
export function ChoiceTile({ label, detail, selected, onPress, icon }: ChoiceTileProps) {
  return (
    <SelectableCard
      selected={selected}
      onPress={onPress}
      padding={{ vertical: 18, horizontal: 16 }}
      className="relative flex-1 rounded-tile"
    >
      <View className="items-center gap-[12px]">
        <View
          className={cn(
            'h-[66px] w-[66px] items-center justify-center rounded-full',
            selected ? 'bg-brand-wash' : 'bg-surface-chip',
          )}
        >
          {icon ?? <Mascot size={41} />}
        </View>
        <Text weight={selected ? 600 : 400} className="text-center text-[16px]">
          {label}
        </Text>
        {detail ? (
          <Text className="-mt-[8px] text-center text-[12.5px] text-ink-dim">{detail}</Text>
        ) : null}
      </View>
      {selected ? (
        <View className="absolute right-[12px] top-[12px]">
          <SelectionDot selected />
        </View>
      ) : null}
    </SelectableCard>
  );
}
