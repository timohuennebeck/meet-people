import type { Preferences } from './schemas';

/**
 * What a profile's preference columns hold before anybody has changed them.
 *
 * These mirror the `default` on each column in `profiles` — `radius 2`,
 * `distance_unit 'mi'`, `age_min 21`, `age_max 34`, `audience_gender
 * 'everyone'`, `interests '{}'`, `languages '{}'`, `app_language 'pt-BR'`,
 * `notifications_enabled true` — so the answers the onboarding steps show
 * before there is a session are the ones the row will actually be created with.
 *
 * They are the app's, not a sample: an empty `interests` here is the same empty
 * array the column defaults to, and filling it with anybody's example would
 * hand a new account somebody else's answers.
 */
export const DEFAULT_PREFERENCES: Preferences = {
  radius: 2,
  distanceUnit: 'mi',
  ageRange: [21, 34],
  audienceGender: 'everyone',
  interests: [],
  spokenLanguages: [],
  appLanguage: 'pt-BR',
  notificationsEnabled: true,
};
