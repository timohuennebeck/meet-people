/**
 * The sign-up sequence.
 *
 * It spans two features — the onboarding steps and the verification sub-flow —
 * so the table lives here rather than inside either of them.
 *
 * The design hand-tuned a fill fraction per step (6%, 12%, 18%, 22%, …) for an
 * eighteen-step flow. Two of those steps are gone — the widget, and the
 * language question now answered by a pill on the welcome screen — so those
 * numbers no longer line up with anything and the fill is derived instead.
 */

export const ONBOARDING_TOTAL = 16;

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

function at(step: number, dismissible = false): StepPosition {
  return { step, total: ONBOARDING_TOTAL, progress: step / ONBOARDING_TOTAL, dismissible };
}

export const STEPS = {
  location: at(1),
  radius: at(2),
  // The two branches of the same step: a range, or the tags that stand in for it.
  ageRange: at(3),
  interests: at(3),
  languages: at(4),
  country: at(5),
  account: at(6),
  signUp: at(7),
  // The other branch of the account step, for someone who already has one.
  signIn: at(7),
  confirmation: at(8, true),
  name: at(9),
  birthday: at(10),
  pronouns: at(11),
  photo: at(12),
  verification: at(13),
  notifications: at(14),
  rules: at(15),
} as const satisfies Record<string, StepPosition>;
