import { Image } from 'expo-image';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

const MASCOT = require('../../../assets/images/mascot-globe.png');

/** Pips, the globe mascot. Appears on most onboarding steps and empty states. */
export function Mascot({ size, className }: { size: number; className?: string }) {
  return (
    <Image
      source={MASCOT}
      accessibilityLabel="Pips"
      className={cn(className)}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

/**
 * The mascot sitting on a radial glow — the "no requests yet" empty state.
 * `radial-gradient(circle at 50% 45%, #E8F1FF 0%, transparent 70%)` is
 * approximated with a soft circular tint, which reads the same at this size.
 */
export function GlowingMascot({ size = 84, box = 96 }: { size?: number; box?: number }) {
  return (
    <View className="items-center justify-center" style={{ width: box, height: box }}>
      <View
        className="absolute rounded-full bg-brand-tintAlt opacity-70"
        style={{ width: box, height: box }}
      />
      <Mascot size={size} />
    </View>
  );
}
