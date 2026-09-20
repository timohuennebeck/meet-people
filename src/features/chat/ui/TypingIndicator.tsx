import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Avatar, Text } from '@shared/ui';

/** One dot of the typing animation: a 1.1s lift-and-fade, staggered by index. */
function Dot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 330, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 770, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.28 + progress.value * 0.72,
    transform: [{ translateY: -3 * progress.value }],
  }));

  return <Animated.View className="h-[7px] w-[7px] rounded-full bg-ink-ghost" style={style} />;
}

export interface TypingIndicatorProps {
  avatarUri: string;
  /** Author name, shown above the dots in a group thread. */
  authorName?: string;
}

/** The three bouncing dots shown while the other side is typing. */
export function TypingIndicator({ avatarUri, authorName }: TypingIndicatorProps) {
  return (
    <View className="flex-row items-end gap-[8px]" accessibilityLabel="Typing">
      <Avatar uri={avatarUri} size={28} className="shrink-0" />
      <View className="gap-[3px]">
        {authorName ? (
          <Text weight={600} className="pl-[4px] text-[12.5px] text-ink-dim">
            {authorName}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-[5px] rounded-[20px] rounded-bl-[6px] bg-surface-fill px-[16px] py-[13px]">
          <Dot delay={0} />
          <Dot delay={160} />
          <Dot delay={320} />
        </View>
      </View>
    </View>
  );
}
