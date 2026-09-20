import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * The blinking text cursor the design draws as a `2px` brand-coloured bar
 * beside sample input text. The prototype animates it on a 1.06s step cycle;
 * that timing is preserved here.
 */
export function Caret({ height = 20 }: { height?: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 530, easing: Easing.steps(1, true) }),
        withTiming(0, { duration: 530, easing: Easing.steps(1, true) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className="ml-[3px] w-[2px] rounded-[1px] bg-brand"
      style={[{ height }, style]}
    />
  );
}
