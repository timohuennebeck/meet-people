import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { ProgressHeader, Screen, StepSubtitle, StepTitle, Text } from '@shared/ui';
import type { ScreenPadding } from '@shared/ui';

import { ONBOARDING_TOTAL, type OnboardingStep } from '../lib/steps';

export interface StepLayoutProps {
  step: OnboardingStep;
  /**
   * The question, with `\n` where the design breaks the line. Omitted on the
   * photo step, whose heading sits centred with the content instead.
   */
  title?: ReactNode;
  /** Extra classes on the title, e.g. `text-center` on the confirmation step. */
  titleClassName?: string;
  /** Small-caps label above the title, used by the verification intro. */
  eyebrow?: string;
  /** The single explanatory line under the question. */
  subtitle?: string;
  children: ReactNode;
  /** Actions pinned to the bottom of the screen. */
  footer?: ReactNode;
  padding?: ScreenPadding;
  /** Overrides the screen background, e.g. white on the photo step. */
  className?: string;
  /**
   * Gap above the title and above the subtitle. Every step uses 22/10 except
   * the rules step, whose taller card pulls both in to 20/8.
   */
  spacing?: { title: number; subtitle: number };
}

/**
 * The frame every onboarding step shares: progress header, a `22px` gap, the
 * title, a `10px` gap, the subtitle, then the step's own content.
 */
export function StepLayout({
  step,
  title,
  titleClassName,
  eyebrow,
  subtitle,
  children,
  footer,
  padding = 'step',
  className,
  spacing = { title: 22, subtitle: 10 },
}: StepLayoutProps) {
  const router = useRouter();

  return (
    <Screen padding={padding} className={className}>
      <ProgressHeader
        step={step.step}
        total={ONBOARDING_TOTAL}
        progress={step.progress}
        dismissible={'dismissible' in step ? step.dismissible : false}
        onBack={() => router.back()}
      />
      {eyebrow ? (
        <Text
          weight={600}
          className="mt-[22px] shrink-0 text-[12.5px] tracking-[1.75px] text-ink-dim"
        >
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <StepTitle
          className={cn('shrink-0', titleClassName)}
          // The eyebrow already supplies the gap, so the title tightens to 8px.
          style={{ marginTop: eyebrow ? 8 : spacing.title }}
        >
          {title}
        </StepTitle>
      ) : null}
      {subtitle ? (
        <StepSubtitle className="shrink-0" style={{ marginTop: spacing.subtitle }}>
          {subtitle}
        </StepSubtitle>
      ) : null}
      {children}
      {footer ? <View className="shrink-0">{footer}</View> : null}
    </Screen>
  );
}
