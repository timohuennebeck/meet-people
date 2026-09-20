import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { AVATARS } from '@shared/data/fixtures';
import { cn } from '@shared/lib/cn';
import { gradients } from '@shared/theme/tokens';
import { Avatar } from '@shared/ui';

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
        start={{ x: 0, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 items-center justify-center">
        <View
          className="absolute h-[214px] w-[214px] rounded-full"
          style={{ backgroundColor: 'rgba(47,124,246,0.06)' }}
        />
        <View
          className="absolute h-[150px] w-[150px] rounded-full border-2"
          style={{
            backgroundColor: 'rgba(47,124,246,0.12)',
            borderColor: 'rgba(47,124,246,0.35)',
          }}
        />
        {/* 18px brand dot with a 4px white ring drawn outside it. */}
        <View className="absolute h-[26px] w-[26px] rounded-full border-[4px] border-white bg-brand" />
      </View>

      <NearbyFace uri={AVATARS.phil} className="left-[30px] top-[26px]" />
      <NearbyFace uri={AVATARS.lea} className="bottom-[38px] right-[34px]" />
    </View>
  );
}

/** A 34px face with the design's `0 0 0 3px #fff` gutter. */
function NearbyFace({ uri, className }: { uri: string; className: string }) {
  return (
    <View className={cn('absolute rounded-full border-[3px] border-white', className)}>
      <Avatar uri={uri} size={34} />
    </View>
  );
}
