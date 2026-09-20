import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { ProgressHeader, Screen, StepSubtitle, StepTitle } from '@shared/ui';
import type { ScreenPadding } from '@shared/ui';

/** The create flow runs to six steps; the age step is the optional last one. */
export const CREATE_TOTAL = 6;

export interface CreateStepLayoutProps {
  step: number;
  /** Fill fraction; the design uses 20/40/60/80/100%. */
  progress: number;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  padding?: ScreenPadding;
  /** The seats and age steps count out of 6; the first four count out of 5. */
  total?: number;
  className?: string;
}

/** The frame shared by every step of the create-plan flow. */
export function CreateStepLayout({
  step,
  progress,
  title,
  subtitle,
  children,
  footer,
  padding = 'step',
  total = 5,
  className,
}: CreateStepLayoutProps) {
  const router = useRouter();

  return (
    <Screen padding={padding} className={cn(className)}>
      <ProgressHeader step={step} total={total} progress={progress} onBack={() => router.back()} />
      <StepTitle className="mt-[22px] shrink-0">{title}</StepTitle>
      {subtitle ? <StepSubtitle className="mt-[10px] shrink-0">{subtitle}</StepSubtitle> : null}
      {children}
      {footer ? <View className="shrink-0">{footer}</View> : null}
    </Screen>
  );
}
