import { useRouter } from 'expo-router';

import { legalHref, type LegalDoc } from '@shared/lib/legal';
import { Text } from '@shared/ui';

export interface LegalLinkProps {
  /** Which document the words open. */
  doc: LegalDoc;
  label: string;
  /** The run's own type and colour — underlined grey here, brand blue on welcome. */
  className?: string;
}

/**
 * The tappable "Termos de uso" / "Política de privacidade" run inside a legal
 * sentence.
 *
 * It is a nested `Text` with an `onPress` rather than a `Pressable`, because
 * React Native lays a `Pressable` out as a block: wrapping the words in one
 * would break the sentence across lines around it.
 */
export function LegalLink({ doc, label, className }: LegalLinkProps) {
  const router = useRouter();

  return (
    <Text
      weight={500}
      accessibilityRole="link"
      className={className}
      onPress={() => router.push(legalHref(doc))}
    >
      {label}
    </Text>
  );
}
