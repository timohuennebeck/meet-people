import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { Mascot, NavHeader, Screen, StepSubtitle, StepTitle } from '@shared/ui';

export interface MascotScreenProps {
  /**
   * Title for the nav bar. Left out on the screens that confirm something has
   * already happened, which have nothing to go back to.
   */
  navTitle?: string;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  mascotSize?: number;
  /** Sits between the subtitle and the footer — an account card, or a note. */
  children?: ReactNode;
  /** The primary action and whatever follows it, pinned to the bottom. */
  footer: ReactNode;
  className?: string;
}

/**
 * The confirmation frame: Pips, a question, a plain sentence about what will
 * happen, and the two ways out of it.
 *
 * Signing out, deleting an account, confirming who turned up and sending a
 * report all end on this shape — a mascot above a short question is how the
 * design softens a moment where the person is about to lose something or
 * accuse someone. The mascot takes whatever height is left, so a screen with a
 * note under its subtitle simply gets a smaller one rather than a scroll.
 */
export function MascotScreen({
  navTitle,
  onBack,
  title,
  subtitle,
  mascotSize = 200,
  children,
  footer,
  className,
}: MascotScreenProps) {
  return (
    <Screen className={cn(className)}>
      {navTitle === undefined ? null : <NavHeader title={navTitle} onBack={onBack} />}

      <View className="min-h-0 flex-1 items-center justify-center">
        <Mascot size={mascotSize} />
      </View>

      <View className="shrink-0 gap-[10px]">
        <StepTitle className="text-center">{title}</StepTitle>
        {subtitle ? <StepSubtitle className="text-center">{subtitle}</StepSubtitle> : null}
      </View>

      {children ? <View className="mt-[20px] shrink-0">{children}</View> : null}

      <View className="mt-[24px] shrink-0 gap-[14px]">{footer}</View>
    </Screen>
  );
}
