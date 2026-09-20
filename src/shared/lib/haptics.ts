import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * The four kinds of feedback the app asks for, named after what happened rather
 * than after the taptic pattern — so a screen says `haptics.commit()` and not
 * `notificationAsync(Success)`.
 *
 * Every call is fire-and-forget. The engine is unavailable on web, on a
 * simulator and on phones where the user has turned system haptics off, and a
 * rejected promise there must never take a button press down with it.
 */
function fire(run: () => Promise<void>): void {
  // Android's generic vibration for every tap reads as noise rather than
  // feedback, and the web has no engine at all.
  if (Platform.OS !== 'ios') return;
  void run().catch(() => {});
}

export const haptics = {
  /** A button, a link, anything that acts. The design's default. */
  tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Moving between options — a chip, a radio row, a slider notch. */
  select: () => fire(() => Haptics.selectionAsync()),
  /** Something finished: a plan created, a request sent, a step confirmed. */
  commit: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something destructive or refused: leaving a plan, deleting an account. */
  warn: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
