import { View, type ViewProps } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Text, type FontWeight } from './Text';

export interface HighlightProps extends Omit<ViewProps, 'children'> {
  children: string;
  /** Classes for the band itself — its background, radius and padding. */
  className?: string;
  /** Classes for the phrase inside, i.e. the title's own type scale. */
  textClassName?: string;
  weight?: FontWeight;
}

/**
 * The design marks a phrase in a title by wrapping it in a coloured band with
 * a radius — "Hoje à noite", the name on the confirmation step, "quantos
 * planos" on the paywall.
 *
 * A nested `Text` cannot draw one. React Native lays nested text out as an
 * inline run and honours only the properties the platform text engines have a
 * notion of — colour, size, weight, background — so `borderRadius` and
 * `padding` are dropped and the band comes out square and tight against the
 * glyphs. Drawing it as a `View` around the phrase restores both.
 *
 * The trade is that the phrase can no longer break across lines, so a
 * highlight belongs on a row of its own. Every one in the design already sits
 * on a single line, so this costs nothing.
 */
export function Highlight({
  children,
  className,
  textClassName,
  weight = 600,
  ...rest
}: HighlightProps) {
  return (
    <View {...rest} className={cn('self-start', className)}>
      <Text weight={weight} className={textClassName}>
        {children}
      </Text>
    </View>
  );
}
