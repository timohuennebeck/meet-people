/**
 * The sign-up sequence.
 *
 * It spans two features — the onboarding steps and the verification sub-flow at
 * step 14 — so the table lives here rather than inside either of them.
 *
 * `progress` is the fill fraction the design hand-tunes for each step rather
 * than deriving from `index / total`: the export shows 6%, 12%, 18%, 22%, 24%,
 * 29% and so on, so those exact values are preserved.
 */

export const ONBOARDING_TOTAL = 17;

/** Where a step sits in its flow — everything the progress header renders. */
export interface StepPosition {
  /** The number printed as "{step} de {total}". */
  step: number;
  total: number;
  /** Progress-bar fill, 0–1. */
  progress: number;
  /** Renders an × instead of a back chevron. */
  dismissible?: boolean;
}

function at(step: number, progress: number, dismissible = false): StepPosition {
  return { step, total: ONBOARDING_TOTAL, progress, dismissible };
}

export const STEPS = {
  appLanguage: at(1, 0.06),
  location: at(2, 0.12),
  radius: at(3, 0.18),
  ageRange: at(4, 0.22),
  interests: at(4, 0.24),
  languages: at(5, 0.29),
  country: at(6, 0.33),
  account: at(7, 0.35),
  signUp: at(8, 0.41),
  confirmation: at(9, 0.47, true),
  // The widget step used to sit here at 10; the steps after it each moved up a
  // number and kept their design fill, which still tracks `step / 17`.
  name: at(10, 0.59),
  birthday: at(11, 0.65),
  pronouns: at(12, 0.71),
  photo: at(13, 0.76),
  verification: at(14, 0.82),
  notifications: at(15, 0.88),
  rules: at(16, 0.94),
  // Steps kept out of the main flow for now, reachable from account settings.
  phone: at(9, 0.53),
  code: at(10, 0.58),
} as const satisfies Record<string, StepPosition>;

export type StepName = keyof typeof STEPS;
