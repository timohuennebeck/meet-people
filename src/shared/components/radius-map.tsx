import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { gradientAngles, gradients } from '@shared/theme/tokens';
import { Face } from '@shared/ui';

/**
 * The radius preview: two concentric brand-tinted circles around the user's
 * dot, with a couple of nearby faces scattered on the gradient. Shown on the
 * onboarding radius step at 268px and on the settings page at 250px.
 */
export function RadiusMap({ height, className }: { height: number; className?: string }) {
  return (
    <View
      className={cn('relative shrink-0 overflow-hidden rounded-[28px]', className)}
      style={{ height }}
    >
      <LinearGradient
        colors={gradients.photo}
        {...gradientAngles.photo}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 items-center justify-center">
        <View className="absolute h-[214px] w-[214px] rounded-full bg-brand/[0.06]" />
        <View className="absolute h-[150px] w-[150px] rounded-full border-2 border-brand/35 bg-brand/[0.12]" />
        {/* 18px brand dot with a 4px white ring drawn outside it. */}
        <View className="absolute h-[26px] w-[26px] rounded-full border-[4px] border-white bg-brand" />
      </View>

      <NearbyFace className="left-[30px] top-[26px]" />
      <NearbyFace className="bottom-[38px] right-[34px]" />
    </View>
  );
}

/**
 * A 34px face with the design's `0 0 0 3px #fff` gutter.
 *
 * Deliberately faceless. This is a diagram of a distance, not a list of
 * neighbours — nothing here queries who is actually nearby, and the design's
 * two portraits were picsum strangers standing in for people who do not exist.
 * A silhouette says "somebody" without naming anyone.
 */
function NearbyFace({ className }: { className: string }) {
  return (
    <View className={cn('absolute rounded-full border-[3px] border-white', className)}>
      <Face uri={null} size={34} />
    </View>
  );
}
