import { useRouter } from 'expo-router';
import { useState } from 'react';

import { cn } from '@shared/lib/cn';
import { haptics } from '@shared/lib/haptics';
import { legalHref, type LegalDoc } from '@shared/lib/legal';
import { Text } from '@shared/ui/text';

export interface LegalLinkProps {
  /** Which document the words open. */
  doc: LegalDoc;
  label: string;
  /** The run's own type and colour — underlined grey here, brand blue on welcome. */
  className?: string;
  /**
   * The colour it dims to while held. It has to be given per call site because
   * the two links start from different colours, and there is no one faded shade
   * that suits both.
   */
  pressedClassName?: string;
}

/**
 * The tappable "Termos de uso" / "Política de privacidade" run inside a legal
 * sentence.
 *
 * It is a nested `Text` with an `onPress` rather than a `Pressable`, because
 * React Native lays a `Pressable` out as a block: wrapping the words in one
 * would break the sentence across lines around it.
 *
 * That nesting is also why the held state is a colour and not an opacity. iOS
 * paints a grey box behind a pressable `Text` unless told not to, and a nested
 * run is an attributed string rather than a view, so `opacity` on it does
 * nothing. Colour is one of the few properties that does cross that boundary.
 */
export function LegalLink({ doc, label, className, pressedClassName }: LegalLinkProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  return (
    <Text
      weight={500}
      accessibilityRole="link"
      suppressHighlighting
      className={cn(className, pressed && (pressedClassName ?? 'text-brand-line'))}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        haptics.tap();
        router.push(legalHref(doc));
      }}
    >
      {label}
    </Text>
  );
}
