import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Avatar, EmptySeat } from './Avatar';
import { Text } from './Text';

export interface Seat {
  /** Absent for an unclaimed seat. */
  avatarUri?: string;
  /** Caption under the avatar — a first name, or "livre" for an open seat. */
  label: string;
  /** Draws the brand ring that marks the viewer. */
  isViewer?: boolean;
}

export interface SeatListProps {
  seats: readonly Seat[];
  /** Avatar diameter. The design uses 52, 58, 68 and 72 across the sheets. */
  size: number;
  /**
   * Distributes seats evenly across the full width, matching the design's
   * `grid-template-columns:repeat(N,1fr)`. Without it, seats sit at their
   * natural width in a left-aligned row.
   */
  even?: boolean;
  /** Gap between seats. */
  gap?: number;
  /** Caption size: 11px in the guest sheet, 12px in the host sheet. */
  captionSize?: 11 | 12;
  /** Gap between avatar and caption. The design uses 5 or 6 independently of size. */
  captionGap?: number;
  /** Fills empty seats with `#FAFAFC`, as the host sheet does. */
  tintedEmpty?: boolean;
}

/**
 * The row or grid of participant avatars shown in a plan sheet, with dashed
 * placeholders for the seats still open.
 */
export function SeatList({
  seats,
  size,
  even = false,
  gap = 14,
  captionSize = 11,
  captionGap,
  tintedEmpty = false,
}: SeatListProps) {
  return (
    <View className="flex-row" style={{ gap }}>
      {seats.map((seat, index) => (
        <View
          key={`${seat.label}-${index}`}
          className={cn('items-center', even && 'flex-1')}
          style={{ gap: captionGap ?? (captionSize === 12 ? 6 : 5) }}
        >
          {seat.avatarUri ? (
            <Avatar uri={seat.avatarUri} size={size} highlighted={seat.isViewer} />
          ) : (
            <EmptySeat size={size} tinted={tintedEmpty} />
          )}
          <Text
            weight={600}
            className={cn(!seat.avatarUri && 'text-ink-dim')}
            style={{ fontSize: captionSize }}
          >
            {seat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * `"3 de 4 participando"` on the left, `"1 vaga livre"` on the right — the
 * header above a seat row.
 */
export function SeatSummary({ filled, open }: { filled: string; open: string }) {
  return (
    <View className="flex-row justify-between">
      <Text weight={600} className="text-[14px]">
        {filled}
      </Text>
      <Text weight={600} className="text-[14px] text-category-games">
        {open}
      </Text>
    </View>
  );
}
