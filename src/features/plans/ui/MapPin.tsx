import { Pressable, View } from 'react-native';

import type { PlanCategory } from '@shared/data/schemas';
import { colors, shadows } from '@shared/theme/tokens';
import { Avatar, Text } from '@shared/ui';

/** Ring colour per category, matching the badge colours on plan photos. */
const RING: Record<PlanCategory, string> = {
  sport: colors.categorySport,
  games: colors.categoryGames,
  walk: colors.categoryWalk,
  coffee: colors.categoryCoffee,
};

export interface MapPinProps {
  avatarUri: string;
  category: PlanCategory;
  /** Position in the design's 402×874 canvas. */
  x: number;
  y: number;
  /** Label bubble beside the pin — only the focused plan shows one. */
  label?: { title: string; meta: string };
  onPress?: () => void;
}

/**
 * `62px · 4px category ring · 2px white gutter` — a plan on the map, optionally
 * with the white bubble that names it.
 */
export function MapPin({ avatarUri, category, x, y, label, onPress }: MapPinProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label?.title}
      onPress={onPress}
      className="absolute flex-row items-center gap-[8px]"
      style={{ left: x, top: y }}
    >
      <View
        className="h-[62px] w-[62px] overflow-hidden rounded-full border-[4px] bg-surface p-[2px]"
        style={[{ borderColor: RING[category] }, shadows.pin]}
      >
        <Avatar uri={avatarUri} size={50} />
      </View>

      {label ? (
        <View
          className="gap-[1px] rounded-[14px] bg-surface px-[12px] py-[8px]"
          style={shadows.pinLabel}
        >
          <Text weight={600} className="text-[13px] leading-[15.6px]">
            {label.title}
          </Text>
          <Text weight={600} className="text-[11px] text-ink-faint">
            {label.meta}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * The user's own position. The design's `0 0 0 10px rgba(47,124,246,.18)` is a
 * solid ring rather than a blur, so it is drawn as a 36px disc centred behind
 * the 16px dot instead of as a shadow.
 */
export function UserDot({ x, y }: { x: number; y: number }) {
  return (
    <View
      className="absolute h-[36px] w-[36px] items-center justify-center rounded-full"
      style={{ left: x - 10, top: y - 10, backgroundColor: 'rgba(47,124,246,0.18)' }}
      pointerEvents="none"
    >
      <View className="h-[16px] w-[16px] rounded-full border-[3px] border-white bg-brand" />
    </View>
  );
}
