import { i18n } from '@shared/i18n';
import { ageFromBirthdate } from '@shared/lib/datetime';
import { MEMBER_STATUS } from '@shared/lib/supabase/enums';
import {
  avatarUrlFor,
  spokenLanguagesFor,
  toUser,
  type PublicProfileRow,
} from '@shared/lib/supabase/mapping';

import { throwAsDataError } from '../errors';
import type { ProfileView, SearchResults, User } from '../schemas';
import { client, unwrap, unwrapSingle, viewerId } from './shared';

/** People: the viewer's own profile, somebody else's, the search and the views. */

/**
 * Escapes the three characters `like` treats as syntax, so a search term is
 * matched as itself. Typing `%` otherwise matched every name, and `_` matched
 * any single character.
 */
function likeLiteral(term: string): string {
  return term.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/** View rows type every column as nullable; the view's own `where` says otherwise. */
function asProfileRow(row: unknown): PublicProfileRow {
  return row as PublicProfileRow;
}

/** The plan ids the viewer currently holds a seat on — the "em comum" denominator. */
async function viewerPlanIds(): Promise<string[]> {
  const db = client();
  const uid = await viewerId();
  const rows = unwrap(
    await db
      .from('plan_members')
      .select('plan_id')
      .eq('profile_id', uid)
      .eq('status', MEMBER_STATUS.SEATED),
  );
  return (rows ?? []).map((row) => row.plan_id);
}

/** How many of the given people share a plan with the viewer, keyed by profile id. */
async function sharedPlanCounts(profileIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (profileIds.length === 0) return counts;
  const planIds = await viewerPlanIds();
  if (planIds.length === 0) return counts;

  const rows = unwrap(
    await client()
      .from('plan_members')
      .select('profile_id')
      .in('plan_id', planIds)
      .in('profile_id', profileIds)
      .eq('status', MEMBER_STATUS.SEATED),
  );
  for (const row of rows ?? []) {
    counts.set(row.profile_id, (counts.get(row.profile_id) ?? 0) + 1);
  }
  return counts;
}

/** "Kreuzberg · 2 planos em comum" — the line under a name in people search. */
function searchDetailLine(neighbourhood: string, shared: number): string {
  const sharedLine =
    shared === 0 ? i18n.t('search.noSharedPlans') : i18n.t('search.sharedPlans', { count: shared });
  if (!neighbourhood) return sharedLine;
  return i18n.t('search.resultDetail', { neighbourhood, shared: sharedLine });
}

async function searchPeople(term: string): Promise<SearchResults> {
  const needle = term.trim();
  if (needle.length === 0) return [];

  const db = client();
  const uid = await viewerId();
  const rows =
    unwrap(
      await db
        .from('public_profiles')
        .select('*')
        .ilike('name', `%${likeLiteral(needle)}%`)
        .neq('id', uid)
        .order('name')
        .limit(20),
    ) ?? [];

  const profiles = rows.map(asProfileRow);
  const counts = await sharedPlanCounts(profiles.map((profile) => profile.id));

  return profiles.map((profile) => {
    const shared = counts.get(profile.id) ?? 0;
    return {
      user: toUser(profile, { sharedPlansCount: shared || undefined }),
      detail: searchDetailLine(profile.neighbourhood ?? '', shared),
    };
  });
}

export const users = {
  /**
   * The signed-in user, from their own `profiles` row.
   *
   * The base table rather than `public_profiles`, because this is the one
   * person entitled to everything it holds — the age below is computed from
   * the `birthdate` no other screen ever sees, and the interests and the
   * languages are columns beside it, so the whole person is one read.
   * `verified` is the exception: it is derived from the verification
   * submissions, which only the view can reach, so it comes from there.
   */
  me: async (): Promise<User> => {
    const db = client();
    const uid = await viewerId();

    const [profile, publicRow] = await Promise.all([
      db
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
        .then((result) => unwrapSingle(result, `Profile ${uid}`)),
      db
        .from('public_profiles')
        .select('verified')
        .eq('id', uid)
        .maybeSingle()
        .then((result) => unwrap(result)),
    ]);

    return {
      id: profile.id,
      name: profile.name,
      age: profile.birthdate ? ageFromBirthdate(new Date(profile.birthdate)) : 18,
      avatarUrl: avatarUrlFor(profile.avatar_storage_path),
      verified: publicRow?.verified ?? false,
      neighbourhood: profile.neighbourhood ?? '',
      countryCode: profile.country_code ?? undefined,
      pronouns: profile.pronouns ?? undefined,
      bio: profile.bio ?? undefined,
      interests: profile.interests,
      languages: spokenLanguagesFor(profile.languages),
      joinedAt: profile.created_at,
    };
  },

  /** Somebody else's profile, as `public_profiles` is willing to show it. */
  detail: async (userId: string): Promise<User> => {
    const db = client();

    const [row, attendanceRate, plansCount, sharedCounts] = await Promise.all([
      db
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .then((result) => unwrap(result)),
      db.rpc('attendance_rate_of', { uid: userId }).then((result) => unwrap(result)),
      db
        .from('plan_members')
        .select('plan_id', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .eq('status', MEMBER_STATUS.SEATED)
        .then((result) => {
          if (result.error) throwAsDataError(result.error);
          return result.count ?? 0;
        }),
      sharedPlanCounts([userId]),
    ]);

    if (!row) throw new Error(`User ${userId} not found`);

    return toUser(asProfileRow(row), {
      attendanceRate,
      plansCount,
      sharedPlansCount: sharedCounts.get(userId) ?? 0,
    });
  },

  /** People whose name matches the term. */
  search: searchPeople,

  /**
   * Recently viewed profiles.
   *
   * Nothing records a profile view — there is no table behind this and no
   * screen that writes one — so it is an empty list rather than a guess.
   * A `profile_views` table, or a client-side list in AsyncStorage, is what
   * fills it; inventing rows from search history would put people under
   * "BUSCAS RECENTES" the viewer never looked at.
   */
  recent: (): Promise<SearchResults> => Promise.resolve([]),

  /**
   * How many people looked this week. Free, and the only half of this the
   * paywall shows a free account — which is why it is its own round trip
   * rather than the length of the list below.
   */
  viewCount: async (): Promise<number> => unwrap(await client().rpc('profile_view_count')) ?? 0,

  /**
   * Who looked, newest first.
   *
   * `viewer` is a whole `public_profiles` row as JSON, so it goes through
   * the same `toUser` as a participant embedded on a plan and a viewer
   * renders exactly what their profile would. A free account is refused by
   * the function, and `unwrap` turns that into the `PLUS_REQUIRED`
   * `DataError` the screen answers with the paywall.
   */
  viewers: async (): Promise<ProfileView[]> => {
    const rows = unwrap(await client().rpc('profile_viewers'));
    return (rows ?? []).map((row) => ({
      user: toUser(asProfileRow(row.viewer)),
      viewedAt: new Date(row.viewed_at).toISOString(),
    }));
  },

  /**
   * Records that the viewer opened somebody's profile.
   *
   * Nothing is checked here first. The function drops a look at your own
   * profile, at somebody who blocked you and at a half-finished one, and
   * returns void either way — the server is what decides a view is not worth
   * recording, and it never says so. What is *not* swallowed is the call
   * failing: a request that never arrived is a different thing from one the
   * server chose to ignore, and the caller decides what to do about it.
   */
  recordView: async (userId: string): Promise<void> => {
    unwrap(await client().rpc('record_profile_view', { profile: userId }));
  },
};
