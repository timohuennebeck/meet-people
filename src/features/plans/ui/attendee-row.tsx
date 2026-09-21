import { View } from 'react-native';

import type { User } from '@shared/data/schemas';
import { Avatar, SelectableCard, SelectionDot, Text } from '@shared/ui';

export interface AttendeeRowProps {
  user: User;
  /** The grey line under the name, already interpolated. */
  detail: string;
  /** Ticked means "they were there" — every row starts ticked. */
  present: boolean;
  onPress: () => void;
}

/**
 * `radius:18px · padding:14px 16px · 44px avatar` — one person on the
 * "who turned up" check-list.
 *
 * Ticked, the row carries the brand ring and the filled check circle; unticked
 * it is a plain hairline card with no circle at all. `SelectableCard` swaps the
 * ring without the box changing size, and the dot's slot is reserved in both
 * states so the name and its detail line do not re-truncate as rows are ticked
 * off — the same reasoning as `PlaceRow`.
 */
export function AttendeeRow({ user, detail, present, onPress }: AttendeeRowProps) {
  return (
    <SelectableCard
      selected={present}
      onPress={onPress}
      padding={{ vertical: 14, horizontal: 16 }}
      className="flex-row items-center gap-[12px] rounded-field"
      // A check-list, not a radio group: one row's answer says nothing about
      // the next, so the role and state that `SelectableCard` defaults to are
      // replaced here.
      accessibilityRole="checkbox"
      accessibilityState={{ checked: present }}
    >
      <Avatar uri={user.avatarUrl} size={44} />

      <View className="min-w-0 flex-1 gap-[2px]">
        <Text weight={600} numberOfLines={1} className="text-[16px]">
          {user.name}
        </Text>
        <Text numberOfLines={1} className="text-[14px] text-ink-dim">
          {detail}
        </Text>
      </View>

      <View className="w-[24px] shrink-0">{present ? <SelectionDot selected /> : null}</View>
    </SelectableCard>
  );
}
