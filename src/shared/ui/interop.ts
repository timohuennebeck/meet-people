import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

/**
 * Teaches NativeWind to style the two third-party components we dress with
 * Tailwind classes.
 *
 * NativeWind only maps `className` onto `style` for the components it knows —
 * React Native's own, plus anything registered here. Everything else receives
 * `className` as a prop it does not understand and silently drops it, so a
 * `<LinearGradient className="absolute inset-0" />` backdrop renders at zero
 * height with no error anywhere: the screen just loses its wash.
 *
 * Importing this module once, from the shared UI barrel, registers the mapping
 * process-wide, so every call site keeps working as written.
 */
cssInterop(LinearGradient, { className: 'style' });
cssInterop(Image, { className: 'style' });
// Reanimated wraps the host component, so `Animated.View` is a distinct
// identity that NativeWind does not recognise either — without this the rules
// card loses its white surface, radius and padding, and the typing dots and
// caret lose their size and colour.
cssInterop(Animated.View, { className: 'style' });
