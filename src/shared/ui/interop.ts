import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

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
