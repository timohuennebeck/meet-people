import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Avatar, EmptySeat, type Photo } from './avatar';
import { Text } from './text';

/** A seat somebody is in. Their photo is `null` if they have not uploaded one. */
export interface TakenSeat {
  avatarUri: Photo;
  /** Caption under the avatar — a first name, or "Você". */
  label: string;
  /** Draws the brand ring that marks the viewer. */
  isViewer?: boolean;
}

/** A seat nobody has claimed, which draws the dashed placeholder. */
export interface FreeSeat {
  free: true;
  /** Caption under the placeholder — "livre". */
  label: string;
}

/**
 * The two states are a union rather than one shape with an optional photo:
 * "nobody is in this seat" and "the person in it has no photograph" look the
 * same to a truthiness check, and they must never render the same way.
 */
export type Seat = TakenSeat | FreeSeat;

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
 *
 * A row at its natural width wraps: six 52px seats and their 14px gaps come to
 * 382px, which is wider than the sheet's 366px of content, so without wrapping
 * the sixth seat is clipped by the sheet's edge. Wrapping leaves a row that
 * does fit untouched, so the design's single-row spacing is unchanged. The
 * `even` layout is a fixed set of columns that share the width between them
 * and so never overflows — wrapping it would put one seat per line.
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
    <View className={cn('flex-row', !even && 'flex-wrap')} style={{ gap }}>
      {seats.map((seat, index) => (
        <View
          key={`${seat.label}-${index}`}
          className={cn('items-center', even && 'flex-1')}
          style={{ gap: captionGap ?? (captionSize === 12 ? 6 : 5) }}
        >
          {'free' in seat ? (
            <EmptySeat size={size} tinted={tintedEmpty} />
          ) : (
            <Avatar uri={seat.avatarUri} size={size} highlighted={seat.isViewer} />
          )}
          <Text
            weight={600}
            className={cn('free' in seat && 'text-ink-dim')}
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
      <Text weight={600} className="text-[14px] text-ink-slate">
        {open}
      </Text>
    </View>
  );
}
