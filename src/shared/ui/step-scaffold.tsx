import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import type { StepPosition } from '@shared/lib/steps';
import { StepSubtitle, StepTitle } from '@shared/ui/card';
import { ProgressHeader } from '@shared/ui/header';
import { Screen, type ScreenPadding } from '@shared/ui/screen';
import { Text } from '@shared/ui/text';

export interface StepScaffoldProps {
  /** Where this step sits in its flow — see `@shared/lib/steps`. */
  position: StepPosition;
  /**
   * The question, with `\n` where the design breaks the line. Omitted on the
   * photo step, whose heading sits centred with the content instead.
   */
  title?: string;
  /**
   * Replaces the title outright, for the one step whose heading is a row rather
   * than a paragraph — the confirmation step's name sits in a rounded band, and
   * a band cannot be drawn by a nested `Text`. Takes the same top margin.
   */
  titleBlock?: ReactNode;
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
 * The frame every step of a guided flow shares: progress header, a `22px` gap,
 * the title, a `10px` gap, the subtitle, then the step's own content.
 *
 * Both the sign-up sequence and the create-plan flow are drawn on it, which is
 * why it lives here rather than inside either feature.
 */
export function StepScaffold({
  position,
  title,
  titleBlock,
  titleClassName,
  eyebrow,
  subtitle,
  children,
  footer,
  padding = 'step',
  className,
  spacing = { title: 22, subtitle: 10 },
}: StepScaffoldProps) {
  const router = useRouter();

  return (
    <Screen padding={padding} className={className}>
      <ProgressHeader
        step={position.step}
        total={position.total}
        progress={position.progress}
        dismissible={position.dismissible}
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
      {titleBlock ? (
        // The eyebrow already supplies the gap, so the title tightens to 8px.
        <View className="shrink-0" style={{ marginTop: eyebrow ? 8 : spacing.title }}>
          {titleBlock}
        </View>
      ) : title ? (
        <StepTitle
          className={cn('shrink-0', titleClassName)}
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
