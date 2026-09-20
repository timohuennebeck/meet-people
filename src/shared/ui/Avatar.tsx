import { Image } from 'expo-image';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors, shadows } from '@shared/theme/tokens';

import { CheckSeal } from './icons';
import { Text } from './Text';

export interface AvatarProps {
  uri: string;
  size: number;
  /** Draws the 3px brand ring with a white gutter that marks "you". */
  highlighted?: boolean;
  className?: string;
}

/** Circular profile image. `highlighted` reproduces the design's "you" treatment. */
export function Avatar({ uri, size, highlighted = false, className }: AvatarProps) {
  if (highlighted) {
    return (
      <View
        className={cn(
          'overflow-hidden rounded-full border-[3px] border-brand bg-surface p-[2px]',
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: size }} />
      </View>
    );
  }
  return (
    <View
      className={cn('overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
    >
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

export interface AvatarStackProps {
  uris: string[];
  size?: number;
  /** Negative left margin between images. The design uses -7 and -9. */
  overlap?: number;
  /** Width of the white ring around each image. */
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
        <View
          key={uri}
          className="overflow-hidden rounded-full"
          style={{
            width: size,
            height: size,
            borderWidth: ring,
            borderColor: ringColor,
            marginLeft: index === 0 ? 0 : -overlap,
          }}
        >
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        </View>
      ))}
    </View>
  );
}

export interface VerifiedSealProps {
  /** Outer box size. The design uses 17, 20, 22 and 34. */
  size?: number;
  /** Shrinks the seal inside its box, matching the `inset:15%` variant. */
  inset?: boolean;
}

/**
 * The verification seal: two brand squares rotated 45° against each other to
 * form a burst, with a white tick on top.
 */
export function VerifiedSeal({ size = 20, inset = false }: VerifiedSealProps) {
  const pad = inset ? size * 0.15 : 0;
  const burst = size - pad * 2;
  const radius = burst * (inset ? 0.32 : 0.34);

  return (
    <View
      className="shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      accessibilityLabel="Verified"
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
      <CheckSeal size={size * 0.55} strokeWidth={3.4} />
    </View>
  );
}

/** `2px dashed #C9CFD9` circle with a plus — an unclaimed seat in a plan. */
export function EmptySeat({ size, tinted = false }: { size: number; tinted?: boolean }) {
  return (
    <View
      className={cn(
        'items-center justify-center rounded-full border-2 border-dashed border-hair-dash',
        tinted && 'bg-surface-tint',
      )}
      style={{ width: size, height: size }}
    >
      <Text className="text-ink-dim" style={{ fontSize: size > 60 ? 22 : size > 55 ? 22 : 20 }}>
        +
      </Text>
    </View>
  );
}

export interface PairAvatarProps {
  primary: string;
  secondary: string;
  /** Adds the "+N" pill for group conversations with more members. */
  extra?: number;
  /** Overall box size; 44 in a chat header, 56 in the conversations list. */
  size?: number;
}

/** Two offset avatars representing a group thread. */
export function PairAvatar({ primary, secondary, extra, size = 56 }: PairAvatarProps) {
  const big = size === 56 ? 38 : 28;
  const small = size === 56 ? 34 : 26;

  return (
    <View className="shrink-0" style={{ width: size, height: size }}>
      <View
        className="absolute left-0 top-0 overflow-hidden rounded-full border-2 border-white"
        style={{ width: big, height: big }}
      >
        <Image source={{ uri: primary }} style={{ width: '100%', height: '100%' }} />
      </View>
      <View
        className="absolute bottom-0 right-0 overflow-hidden rounded-full border-2 border-white"
        style={{ width: small, height: small }}
      >
        <Image source={{ uri: secondary }} style={{ width: '100%', height: '100%' }} />
      </View>
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
  flagSize = 30,
}: {
  uri: string;
  flagUri: string;
  size?: number;
  flagSize?: number;
}) {
  return (
    <View className="shrink-0" style={{ width: size, height: size }}>
      <View
        className="absolute inset-0 overflow-hidden rounded-full border-[3px] border-white"
        style={shadows.profileAvatar}
      >
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
      </View>
      <Image
        source={{ uri: flagUri }}
        style={{
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: flagSize,
          height: flagSize,
          borderRadius: flagSize / 2,
          borderWidth: 3,
          borderColor: colors.white,
        }}
      />
    </View>
  );
}
