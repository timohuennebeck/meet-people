import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@shared/lib/cn';

/**
 * The design only ever uses Inter at 400, 500 and 600. React Native does not
 * synthesise weights from a single family, so each weight maps to its own
 * loaded font file.
 */
export type FontWeight = 400 | 500 | 600;

const FONT_FAMILY: Record<FontWeight, string> = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
};

export interface TextProps extends RNTextProps {
  /** Inter weight. Defaults to 400, matching the design's body copy. */
  weight?: FontWeight;
  className?: string;
}

/**
 * Every piece of copy in the app renders through this component so weights stay
 * consistent and no screen can accidentally fall back to the system font.
 */
export function Text({ weight = 400, className, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      className={cn('text-ink', className)}
      style={[{ fontFamily: FONT_FAMILY[weight] }, style]}
    />
  );
}

export { FONT_FAMILY };
