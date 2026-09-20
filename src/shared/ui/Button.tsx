import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { cn } from '@shared/lib/cn';
import { haptics } from '@shared/lib/haptics';
import { shadows } from '@shared/theme/tokens';

import { Text } from './Text';

/**
 * Button recipes, each transcribed from a specific button in the design.
 * `height`, `text` and `weight` are kept separate from `container` so a variant
 * can be re-sized without losing its fill and border.
 */
const VARIANTS = {
  /** `h:60 · #2F7CF6 · 17.5px/600` — the standard full-width step action. */
  primary: {
    container: 'bg-brand',
    text: 'text-white text-[17.5px]',
    height: 60,
    weight: 600 as const,
    shadow: undefined,
  },
  /** `h:60 · #2F7CF6 · 17px/600` — the sign-in options on the account step. */
  primaryTall: {
    container: 'bg-brand',
    text: 'text-white text-[17px]',
    height: 60,
    weight: 600 as const,
    shadow: undefined,
  },
  /** `h:56 · #2F7CF6 · 17px/600` — "save" and the profile's invite action. */
  primaryCompact: {
    container: 'bg-brand',
    text: 'text-white text-[17px]',
    height: 56,
    weight: 600 as const,
    shadow: undefined,
  },
  /** `h:56 · #2F7CF6 · 16px/600 + shadow` — the primary action inside a sheet. */
  primarySheet: {
    container: 'bg-brand',
    text: 'text-white text-[16px]',
    height: 56,
    weight: 600 as const,
    shadow: shadows.primaryButton,
  },
  /** `h:58 · white + 1.5px #DCE4F0 · 17px/500` — "choose from gallery". */
  secondary: {
    container: 'bg-surface border-[1.5px] border-hair-deep',
    text: 'text-ink text-[17px]',
    height: 58,
    weight: 500 as const,
    shadow: undefined,
  },
  /** `h:60 · white + 1.5px #DCE4F0 · 17px/600` — the Google / e-mail sign-in rows. */
  secondaryTall: {
    container: 'bg-surface border-[1.5px] border-hair-deep',
    text: 'text-ink text-[17px]',
    height: 60,
    weight: 600 as const,
    shadow: undefined,
  },
  /** `h:56 · 2px #EEF0F4 · 16px/600 #7A8595` — "withdraw request". */
  outline: {
    container: 'border-2 border-[#EEF0F4]',
    text: 'text-ink-faint text-[16px]',
    height: 56,
    weight: 600 as const,
    shadow: undefined,
  },
  /** `h:52 · 2px #EEF0F4 · 15.5px/600 #2F7CF6` — "invite friends". */
  outlineBrand: {
    container: 'border-2 border-[#EEF0F4]',
    text: 'text-brand text-[15.5px]',
    height: 52,
    weight: 600 as const,
    shadow: undefined,
  },
  /** `h:56 · #E14B4B · 16px/600 + red shadow` — "leave plan". */
  danger: {
    container: 'bg-danger',
    text: 'text-white text-[16px]',
    height: 56,
    weight: 600 as const,
    shadow: shadows.dangerButton,
  },
  /** `h:60 · #E3E9F2 · 17.5px/600 #A7ADBA` — the inactive confirm button. */
  disabled: {
    container: 'bg-hair-rail',
    text: 'text-ink-mute text-[17.5px]',
    height: 60,
    weight: 600 as const,
    shadow: undefined,
  },
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  /** Rendered before the label, e.g. the Google mark or an envelope glyph. */
  icon?: ReactNode;
  className?: string;
}

/** Full-width pill button. Every screen's main call to action uses this. */
export function Button({
  label,
  variant = 'primary',
  icon,
  className,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const recipe = VARIANTS[disabled ? 'disabled' : variant];
  // Destructive actions get the warning pattern; everything else a light tap.
  const feedback = variant === 'danger' ? haptics.warn : haptics.tap;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={
        onPress &&
        ((event) => {
          feedback();
          onPress(event);
        })
      }
      {...rest}
      className={cn(
        'w-full flex-row items-center justify-center gap-[10px] rounded-pill',
        recipe.container,
        !disabled && 'active:opacity-90',
        className,
      )}
      style={[{ height: recipe.height }, recipe.shadow]}
    >
      {icon}
      <Text weight={recipe.weight} className={recipe.text}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Tones for the bare text link that sits under most primary buttons
 * ("Maybe later", "Skip", "Cancel").
 */
const TEXT_TONES = {
  /** `16px/500 #3E4553` — the default "maybe later". */
  body: { text: 'text-ink-body text-[16px]', weight: 500 as const },
  /** `15px/600 #3E4553` — "I'm still going". */
  bodyStrong: { text: 'text-ink-body text-[15px]', weight: 600 as const },
  /** `15.5px/600 #3E4553` — "sign out". */
  bodyBold: { text: 'text-ink-body text-[15.5px]', weight: 600 as const },
  /** `14px/600 #7A8595` — "not going any more". */
  muted: { text: 'text-ink-faint text-[14px]', weight: 600 as const },
  /** `15px/500 #72798A` — "start over". */
  mutedSoft: { text: 'text-ink-dim text-[15px]', weight: 500 as const },
  /** `16px/500 #72798A` — "prefer not to say". */
  mutedTall: { text: 'text-ink-dim text-[16px]', weight: 500 as const },
  /** `15px/500 #2F7CF6` — "search for another language". */
  brand: { text: 'text-brand text-[15px]', weight: 500 as const },
  /** `14.5px/600 #3E4553` — the paywall's "restore purchases". */
  bodySmall: { text: 'text-ink-body text-[14.5px]', weight: 600 as const },
} as const;

export type TextButtonTone = keyof typeof TEXT_TONES;

export interface TextButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  tone?: TextButtonTone;
  className?: string;
}

/** Centred text-only action, used as the secondary choice under a `Button`. */
export function TextButton({ label, tone = 'body', className, onPress, ...rest }: TextButtonProps) {
  const recipe = TEXT_TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={
        onPress &&
        ((event) => {
          haptics.tap();
          onPress(event);
        })
      }
      {...rest}
      className={cn('w-full items-center', className, onPress && 'active:opacity-60')}
    >
      <Text weight={recipe.weight} className={cn('text-center', recipe.text)}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Pushes the buttons that follow it to the bottom of a `Screen`. The design
 * uses `flex:1;min-height:Npx` spacers for exactly this.
 */
export function Spacer({ min = 0 }: { min?: number }) {
  return <View className="flex-1" style={{ minHeight: min }} />;
}
