import type { ReactNode } from 'react';

import { StepScaffold } from '@shared/components/StepScaffold';

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
  /** The seats and age steps count out of 6; the first four count out of 5. */
  total?: number;
}

/**
 * The create-plan flow's step frame — `StepScaffold` with this flow's own
 * numbering, so the steps read `2 de 5` rather than counting against sign-up.
 */
export function CreateStepLayout({
  step,
  progress,
  title,
  subtitle,
  children,
  footer,
  total = 5,
}: CreateStepLayoutProps) {
  return (
    <StepScaffold
      position={{ step, total, progress }}
      title={title}
      subtitle={subtitle}
      footer={footer}
    >
      {children}
    </StepScaffold>
  );
}
