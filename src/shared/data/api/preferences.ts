import { supabase } from '@shared/lib/supabase/client';
import { DB_AUDIENCE_GENDER, type DbAudienceGender } from '@shared/lib/supabase/enums';
import {
  radiusMetres,
  spokenLanguagesFor,
  type LanguageCode,
  type PlanContext,
} from '@shared/lib/supabase/mapping';

import { DEFAULT_PREFERENCES } from '../preference-defaults';
import {
  AUDIENCE_GENDER,
  type AudienceGender,
  DISTANCE_UNIT,
  type DistanceUnit,
  type Preferences,
} from '../schemas';
import { client, sessionId, unwrap, unwrapSingle, viewerId } from './shared';

/**
 * What the viewer has chosen: radius, unit, age range, audience, interests and
 * languages — plus the queue that holds the ones chosen before there was an
 * account to hold them.
 *
 * `planContext()` lives here rather than with the plans because it is a
 * preferences read: a plan cannot say how far away it is until it knows how
 * far the viewer is willing to go.
 */

/** The subset of `profiles` columns the settings screen writes. */
type PreferencesUpdate = Partial<{
  radius: number;
  distance_unit: DistanceUnit;
  age_min: number;
  age_max: number;
  audience_gender: DbAudienceGender;
  app_language: string;
  notifications_enabled: boolean;
  interests: string[];
  languages: LanguageCode[];
}>;

const AUDIENCE_TO_DB: Record<AudienceGender, DbAudienceGender> = {
  [AUDIENCE_GENDER.EVERYONE]: DB_AUDIENCE_GENDER.EVERYONE,
  [AUDIENCE_GENDER.WOMEN]: DB_AUDIENCE_GENDER.WOMEN,
  [AUDIENCE_GENDER.MEN]: DB_AUDIENCE_GENDER.MEN,
  [AUDIENCE_GENDER.NON_BINARY]: DB_AUDIENCE_GENDER.NON_BINARY,
};

const AUDIENCE_FROM_DB: Record<DbAudienceGender, AudienceGender> = {
  [DB_AUDIENCE_GENDER.EVERYONE]: AUDIENCE_GENDER.EVERYONE,
  [DB_AUDIENCE_GENDER.WOMEN]: AUDIENCE_GENDER.WOMEN,
  [DB_AUDIENCE_GENDER.MEN]: AUDIENCE_GENDER.MEN,
  [DB_AUDIENCE_GENDER.NON_BINARY]: AUDIENCE_GENDER.NON_BINARY,
};

/**
 * The viewer's id, radius and unit — what a plan needs before it can say how
 * far away it is or where its pin goes.
 */
export async function planContext(): Promise<PlanContext> {
  const db = client();
  const uid = await viewerId();
  const row = unwrap(
    await db.from('profiles').select('radius, distance_unit').eq('id', uid).maybeSingle(),
  );
  const unit: DistanceUnit = row?.distance_unit ?? DISTANCE_UNIT.MILES;
  // The default matches `profiles.radius`'s own default, so a profile whose row
  // has not been created yet still places its pins somewhere sensible.
  const radius = row?.radius ?? 2;
  return { viewerId: uid, radiusM: radiusMetres(radius, unit), unit };
}

/**
 * Preferences chosen before the account exists.
 *
 * The design asks for a radius, an age range, interests and languages at steps
 * 2 to 4, and only creates the account at step 6. Those answers have no row to
 * land in and no `auth.uid()` for a policy to match, so writing them straight
 * through would fail — and, because the settings controls are optimistic, would
 * visibly snap back to the default the user had just moved away from.
 *
 * They are held here instead and replayed by `flushDeferredPreferences()` the
 * moment a session appears. The same shape as the profile writes in
 * `@features/onboarding/lib/profile-writes`, and for the same reason: a step
 * saves its own answer as the user continues, so an abandoned sign-up keeps
 * everything up to where it stopped.
 *
 * The alternative is reordering the flow so the account comes first, which is a
 * product decision about the design rather than a fix for this one.
 */
let deferredPreferences: Partial<Preferences> = {};

/**
 * Replays the preferences chosen before sign-up. Called from
 * `flushProfileWrites()`, so the two queues drain together and a screen only
 * has to know about one of them.
 */
export async function flushDeferredPreferences(): Promise<void> {
  if (!supabase || Object.keys(deferredPreferences).length === 0) return;
  if (!(await sessionId())) return;

  const patch = deferredPreferences;
  deferredPreferences = {};
  try {
    await preferences.update(patch);
  } catch (error) {
    // Put it back rather than lose it: a later step, or the next launch, tries
    // again. Anything newer than the failed patch wins, since it is what the
    // user last chose.
    deferredPreferences = { ...patch, ...deferredPreferences };
    console.warn('[data] Could not save the preferences chosen before sign-up:', error);
  }
}

export const preferences = {
  /**
   * The viewer's preferences, which are columns on their `profiles` row —
   * discovery settings, the app's own settings, and the two lists the
   * settings screen edits on the same page. One read covers all of them.
   */
  get: async (): Promise<Preferences> => {
    const db = client();
    const uid = await sessionId();

    // Before the account exists there is no row to read. `DEFAULT_PREFERENCES`
    // mirrors the `profiles` column defaults, so the early steps open on the
    // values the row will be created with, with anything chosen so far on top.
    if (!uid) {
      return { ...DEFAULT_PREFERENCES, ...deferredPreferences };
    }

    const row = await db
      .from('profiles')
      .select(
        'radius, distance_unit, age_min, age_max, audience_gender, interests, languages, app_language, notifications_enabled',
      )
      .eq('id', uid)
      .single()
      .then((result) => unwrapSingle(result, 'Preferences'));

    return {
      radius: row.radius,
      distanceUnit: row.distance_unit,
      ageRange: [row.age_min, row.age_max],
      audienceGender: AUDIENCE_FROM_DB[row.audience_gender],
      interests: row.interests,
      spokenLanguages: spokenLanguagesFor(row.languages),
      appLanguage: row.app_language,
      notificationsEnabled: row.notifications_enabled,
    };
  },

  /**
   * Applies a patch.
   *
   * Every field is a column on the same row, so the whole patch is one
   * update — interests and languages included, since assigning an array is
   * how a list is replaced now. The update may be refused with
   * TOO_MANY_INTERESTS: the cap and the case-insensitive uniqueness of the
   * interest list are check constraints on `profiles`, and `toDataError`
   * folds either onto that code.
   */
  update: async (patch: Partial<Preferences>): Promise<Preferences> => {
    const db = client();
    const uid = await sessionId();

    if (!uid) {
      deferredPreferences = { ...deferredPreferences, ...patch };
      return { ...DEFAULT_PREFERENCES, ...deferredPreferences };
    }

    const columns: PreferencesUpdate = {};
    if (patch.radius !== undefined) columns.radius = patch.radius;
    if (patch.distanceUnit !== undefined) columns.distance_unit = patch.distanceUnit;
    if (patch.ageRange !== undefined) {
      columns.age_min = patch.ageRange[0];
      columns.age_max = patch.ageRange[1];
    }
    if (patch.audienceGender !== undefined) {
      columns.audience_gender = AUDIENCE_TO_DB[patch.audienceGender];
    }
    if (patch.appLanguage !== undefined) columns.app_language = patch.appLanguage;
    if (patch.notificationsEnabled !== undefined) {
      columns.notifications_enabled = patch.notificationsEnabled;
    }
    if (patch.interests !== undefined) columns.interests = [...patch.interests];
    if (patch.spokenLanguages !== undefined) {
      // The column is the `language_code` enum and `SpokenLanguage.code` is
      // a validated `string` — it also carries codes read back out of the
      // database and out of `nearby_plans()`' untyped JSON, so it cannot be
      // the enum itself. What makes the narrowing sound is that every code a
      // person can pick comes from the catalogue in `@shared/lib/languages`,
      // and `LanguageCatalogueCode` there is checked against this same enum
      // at compile time: a catalogue entry the enum lacks fails `typecheck`
      // rather than reaching Postgres.
      columns.languages = patch.spokenLanguages.map((language) => language.code as LanguageCode);
    }

    if (Object.keys(columns).length > 0) {
      unwrap(await db.from('profiles').update(columns).eq('id', uid));
    }

    return preferences.get();
  },
};
