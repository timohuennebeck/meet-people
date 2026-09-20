import type { ReactNode } from 'react';

import { StepScaffold } from '@shared/components/StepScaffold';

/**
 * The create flow runs to seven steps: what, where, when, join mode, language,
 * seats and the optional age range.
 */
export const CREATE_TOTAL = 7;

export interface CreateStepLayoutProps {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * The create-plan flow's step frame — `StepScaffold` with this flow's own
 * numbering, so the steps read `2 de 7` rather than counting against sign-up.
 *
 * The design hand-tuned a fill per step (20/40/60/80/100%) for a flow that was
 * five steps long, and each screen carried its own number. Those values stopped
 * describing the flow once the seats and age steps were added on the end — the
 * last three all claimed 100% — and the language step makes seven. The fill is
 * derived from the step instead, the same way `@shared/lib/steps` derives the
 * sign-up sequence's, so adding a step can never leave a stale fraction behind.
 */
export function CreateStepLayout({
  step,
  title,
  subtitle,
  children,
  footer,
}: CreateStepLayoutProps) {
  return (
    <StepScaffold
      position={{ step, total: CREATE_TOTAL, progress: step / CREATE_TOTAL }}
      title={title}
      subtitle={subtitle}
      footer={footer}
    >
      {children}
    </StepScaffold>
  );
}
