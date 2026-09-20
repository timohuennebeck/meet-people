/**
 * The onboarding sequence.
 *
 * `progress` is the fill fraction the design hand-tunes for each step rather
 * than deriving from `index / total` — the export shows 6%, 12%, 18%, 22%, 24%,
 * 29% and so on, so those exact values are preserved here.
 */
export const ONBOARDING_TOTAL = 18;

export interface OnboardingStep {
  /** The number printed as "{step} de 18". */
  step: number;
  /** Progress-bar fill, 0–1. */
  progress: number;
  /** Renders an × instead of a back chevron. */
  dismissible?: boolean;
}

export const STEPS = {
  appLanguage: { step: 1, progress: 0.06 },
  location: { step: 2, progress: 0.12 },
  radius: { step: 3, progress: 0.18 },
  ageRange: { step: 4, progress: 0.22 },
  interests: { step: 4, progress: 0.24 },
  languages: { step: 5, progress: 0.29 },
  country: { step: 6, progress: 0.33 },
  account: { step: 7, progress: 0.35 },
  signUp: { step: 8, progress: 0.41 },
  confirmation: { step: 9, progress: 0.47, dismissible: true },
  widget: { step: 10, progress: 0.53, dismissible: true },
  name: { step: 11, progress: 0.59 },
  birthday: { step: 12, progress: 0.65 },
  pronouns: { step: 13, progress: 0.71 },
  photo: { step: 14, progress: 0.76 },
  verification: { step: 15, progress: 0.82 },
  notifications: { step: 16, progress: 0.88 },
  rules: { step: 17, progress: 0.94 },
  // Steps kept out of the main flow for now, reachable from account settings.
  phone: { step: 9, progress: 0.53 },
  code: { step: 10, progress: 0.58 },
} as const satisfies Record<string, OnboardingStep>;

export type StepName = keyof typeof STEPS;

export { APP_LANGUAGES, COUNTRIES as COUNTRY_OPTIONS } from '@shared/lib/languages';
