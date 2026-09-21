import { Image } from 'expo-image';
import { User } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors, shadows } from '@shared/theme/tokens';

import { CheckSeal } from './icons';
import { Text } from './text';

/** The home-country flag on a profile avatar is 30px everywhere it appears. */
const FLAG_SIZE = 30;

export interface RingProps {
  children: ReactNode;
  /** Diameter of the content inside the ring, in px. */
  size: number;
  /** Ring width, in px. */
  width: number;
  color?: string;
  className?: string;
  style?: React.ComponentProps<typeof View>['style'];
}

/**
 * Wraps content in a ring drawn *outside* it.
 *
 * The design draws these with `box-shadow: 0 0 0 Npx C`, or with a plain
 * `border` on an element that has not opted into `box-sizing: border-box` —
 * the export has no global reset, so those are content-box. Either way the
 * content keeps its stated size and the ring adds to the outside.
 *
 * A React Native border always eats inward, so the wrapper is sized
 * `size + 2 × width` to put the content back at `size`.
 */
export function Ring({ children, size, width, color = colors.white, className, style }: RingProps) {
  const outer = size + width * 2;

  return (
    <View
      className={cn('shrink-0 items-center justify-center overflow-hidden rounded-full', className)}
      style={[{ width: outer, height: outer, borderWidth: width, borderColor: color }, style]}
    >
      {children}
    </View>
  );
}

/** A profile photo, or `null` for somebody who has not uploaded one. */
export type Photo = string | null;

/**
 * A face at a given diameter — the photo, or the state for somebody who has
 * none.
 *
 * `avatar_storage_path` stays null until the photo step writes one, and that
 * step is skippable, so a real person can reach every screen in the app
 * without a photograph. This renders a silhouette when that happens. It used
 * to borrow a stranger's photograph from picsum instead, seeded on the profile
 * id, which put an unrelated person's face under a real name on a real plan.
 *
 * Every avatar in this file goes through here, so there is one no-photo state
 * rather than one per shape.
 */
export function Face({ uri, size }: { uri: Photo; size: number }) {
  const { t } = useTranslation();
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (!uri) {
    return (
      <View
        className="items-center justify-center bg-surface-chip"
        style={box}
        accessibilityLabel={t('common.noPhoto')}
      >
        <User size={Math.round(size * 0.52)} weight="fill" color={colors.hairPale} />
      </View>
    );
  }

  return <Image source={{ uri }} style={box} />;
}

export interface AvatarProps {
  uri: Photo;
  size: number;
  /** Draws the 3px brand ring with a white gutter that marks "you". */
  highlighted?: boolean;
  className?: string;
}

/** Circular profile image. `highlighted` reproduces the design's "you" treatment. */
export function Avatar({ uri, size, highlighted = false, className }: AvatarProps) {
  if (highlighted) {
    // `border:3px #2F7CF6` with `box-sizing:border-box` and `padding:2px` — the
    // one ringed avatar in the design that *is* border-box, so it eats inward.
    // Its 3px border and 2px gutter both eat into the stated size, so the face
    // inside is 10px smaller than the box.
    return (
      <View
        className={cn(
          'items-center justify-center overflow-hidden rounded-full border-[3px] border-brand bg-surface p-[2px]',
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Face uri={uri} size={size - 10} />
      </View>
    );
  }
  return (
    <View
      className={cn('overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
    >
      <Face uri={uri} size={size} />
    </View>
  );
}

export interface AvatarStackProps {
  uris: Photo[];
  /** Diameter of each image, excluding its ring. */
  size?: number;
  /** Gap closed between neighbours. The design uses -7 and -9. */
  overlap?: number;
  /** Ring width around each image. */
  ring?: number;
  ringColor?: string;
  className?: string;
}

/** Overlapping row of avatars — used in the welcome social proof and plan cards. */
export function AvatarStack({
  uris,
  size = 28,
  overlap = 9,
  ring = 2,
  ringColor = colors.surfaceApp,
  className,
}: AvatarStackProps) {
  return (
    <View className={cn('flex-row', className)}>
      {uris.map((uri, index) => (
        // Two people without photos would collide on a `uri` key, so the
        // position in the row is the key: the row is a fixed cast, never
        // reordered.
        <Ring
          key={index}
          size={size}
          width={ring}
          color={ringColor}
          style={{ marginLeft: index === 0 ? 0 : -overlap }}
        >
          <Face uri={uri} size={size} />
        </Ring>
      ))}
    </View>
  );
}

export interface VerifiedSealProps {
  /** Outer box size. The design uses 17, 20, 22 and 34. */
  size?: number;
  /** Shrinks the seal inside its box, matching the `inset:15%` variant. */
  inset?: boolean;
  /**
   * Tick size and weight. The design does not scale these with the seal — a
   * 34px seal carries a 17px/2.6 tick while a 17px seal carries 9px/3.4 — so
   * they are set per call site, with a proportional default.
   */
  tickSize?: number;
  tickStrokeWidth?: number;
}

/**
 * The verification seal: two brand squares rotated 45° against each other to
 * form a burst, with a white tick on top.
 */
export function VerifiedSeal({
  size = 20,
  inset = false,
  tickSize,
  tickStrokeWidth = 3.4,
}: VerifiedSealProps) {
  const { t } = useTranslation();
  const pad = inset ? size * 0.15 : 0;
  const burst = size - pad * 2;
  const radius = burst * (inset ? 0.32 : 0.34);

  return (
    <View
      className="shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      accessibilityLabel={t('common.verified')}
    >
      <View
        className="absolute bg-brand"
        style={{ top: pad, left: pad, width: burst, height: burst, borderRadius: radius }}
      />
      <View
        className="absolute bg-brand"
        style={{
          top: pad,
          left: pad,
          width: burst,
          height: burst,
          borderRadius: radius,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* Positioned, so it paints above the two absolute burst squares: on the
          web a positioned box always paints over a static one, whatever the
          document order, which would otherwise bury the tick. */}
      <View className="relative">
        <CheckSeal size={tickSize ?? size * 0.55} strokeWidth={tickStrokeWidth} />
      </View>
    </View>
  );
}

/** `2px dashed #C9CFD9` circle with a plus — an unclaimed seat in a plan. */
export function EmptySeat({ size, tinted = false }: { size: number; tinted?: boolean }) {
  // The design steps the "+" with the seat: 20px at 52, 22px at 58, 26px at 72.
  const plusSize = size > 60 ? 26 : size > 55 ? 22 : 20;

  return (
    <View
      className={cn(
        'items-center justify-center rounded-full border-2 border-dashed border-hair-dash',
        tinted && 'bg-surface-tint',
      )}
      style={{ width: size, height: size }}
    >
      <Text className="text-ink-dim" style={{ fontSize: plusSize }}>
        +
      </Text>
    </View>
  );
}

export interface PairAvatarProps {
  primary: Photo;
  secondary: Photo;
  /** Adds the "+N" pill for group conversations with more members. */
  extra?: number;
  /** Box width. 44 in a chat header, 56 in the conversations list. */
  size?: number;
  /** Box height, which the chat header sets to 40 against a 44 width. */
  height?: number;
}

/** Two offset avatars representing a group thread. */
export function PairAvatar({
  primary,
  secondary,
  extra,
  size = 56,
  height = size,
}: PairAvatarProps) {
  const big = size === 56 ? 38 : 28;
  const small = size === 56 ? 34 : 26;

  return (
    <View className="shrink-0" style={{ width: size, height }}>
      <Ring size={big} width={2} className="absolute left-0 top-0">
        <Face uri={primary} size={big} />
      </Ring>
      <Ring size={small} width={2} className="absolute bottom-0 right-0">
        <Face uri={secondary} size={small} />
      </Ring>
      {extra !== undefined ? (
        <View className="absolute bottom-0 left-0 h-[22px] min-w-[24px] items-center justify-center rounded-pill border-2 border-white bg-surface-chip px-[5px]">
          <Text weight={600} className="text-[11.5px] text-ink-soft">
            +{extra}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Avatar with the user's country flag tucked into its lower-right corner. */
export function FlaggedAvatar({
  uri,
  flagUri,
  size = 92,
}: {
  uri: Photo;
  /** Absent for somebody who has not said where they are from. */
  flagUri?: string;
  size?: number;
}) {
  return (
    <View className="shrink-0" style={{ width: size, height: size }}>
      <Ring
        size={size}
        width={3}
        className="absolute -left-[3px] -top-[3px]"
        style={shadows.profileAvatar}
      >
        <Face uri={uri} size={size} />
      </Ring>
      {flagUri ? (
        <Ring size={FLAG_SIZE} width={3} className="absolute" style={{ right: -5, bottom: -5 }}>
          <Image
            source={{ uri: flagUri }}
            style={{ width: FLAG_SIZE, height: FLAG_SIZE, borderRadius: FLAG_SIZE / 2 }}
          />
        </Ring>
      ) : null}
    </View>
  );
}
