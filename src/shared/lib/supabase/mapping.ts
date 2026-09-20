/**
 * Row shapes to domain shapes.
 *
 * The Supabase source reads rows; screens read the types in
 * `@shared/data/schemas`. Everything that turns one into the other lives here,
 * so the source file stays a list of queries and the decisions below are in one
 * place where they can be argued with.
 *
 * Three of them are decisions rather than transcription, and each is explained
 * at the function that makes it: the avatar fallback, the `whenLabel` the
 * database does not store, and the map pin the database cannot store.
 */

import type {
  DistanceUnit,
  JoinMode,
  Membership,
  Plan,
  SpokenLanguage,
  User,
} from '@shared/data/schemas';
import { i18n } from '@shared/i18n';
import { formatPlanDate, formatTime, isToday, relativeDay } from '@shared/lib/datetime';
import { SEARCHABLE_LANGUAGES } from '@shared/lib/languages';

import { supabase } from './client';

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

/** A row of `public_profiles`, and the object `nearby_plans` embeds for a person. */
export interface PublicProfileRow {
  id: string;
  name: string | null;
  age: number | null;
  avatar_storage_path: string | null;
  pronouns: 'she' | 'he' | 'they' | 'unspecified' | null;
  gender: string | null;
  bio: string | null;
  neighbourhood: string | null;
  country_code: string | null;
  joined_at: string;
  verified: boolean | null;
  interests: string[] | null;
  languages: string[] | null;
}

/** The `place` object on a `nearby_plans` row. */
export interface PlanPlaceJson {
  id: string;
  name: string;
  address: string;
  distanceM: number | null;
}

/** An entry of the `participants` array on a `nearby_plans` row. */
export interface PlanParticipantJson {
  profile: PublicProfileRow;
  isHost: boolean;
}

/** An entry of the `requests` array on a `nearby_plans` row, already numbered. */
export interface PlanRequestJson {
  id: string;
  profile: PublicProfileRow;
  message: string | null;
  createdAt: string;
  position: number;
}

/** One row of `nearby_plans()`, with its jsonb columns named. */
export interface NearbyPlanRow {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number | null;
  seats: number | null;
  join_mode: JoinMode;
  series_id: string | null;
  age_min: number | null;
  age_max: number | null;
  distance_m: number | null;
  membership: string;
  place: PlanPlaceJson;
  host: PublicProfileRow | null;
  languages: string[];
  participants: PlanParticipantJson[];
  requests: PlanRequestJson[];
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/**
 * A portrait for a profile that has none.
 *
 * **Stand-in.** These are the same picsum placeholders the design export uses,
 * seeded on the profile id so a given person keeps the same face between
 * renders. It exists because `userSchema.avatarUrl` is a required `url()` and
 * every avatar in the design is a photograph — no screen has a no-photo state
 * to fall back to. It goes the day the photo step is mandatory, or the day a
 * real placeholder asset is drawn.
 */
function placeholderPortrait(profileId: string): string {
  return `https://picsum.photos/seed/${profileId}/300/300`;
}

/**
 * Resolves `profiles.avatar_storage_path` to something an `<Image>` can load.
 *
 * The column holds `'<profile id>/<file>.jpg'` in the public `avatars` bucket.
 * The seeded rows hold full picsum URLs instead — the design's own portraits —
 * so anything already absolute is passed through untouched.
 */
export function avatarUrlFor(path: string | null | undefined, profileId: string): string {
  if (!path) return placeholderPortrait(profileId);
  if (path.startsWith('http')) return path;
  const publicUrl = supabase?.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  return publicUrl ?? placeholderPortrait(profileId);
}

/** Language codes to the code-and-flag pairs the rows render. */
export function spokenLanguagesFor(codes: readonly string[]): SpokenLanguage[] {
  return codes.map((code) => {
    const known = SEARCHABLE_LANGUAGES.find((language) => language.code === code);
    // An unlisted code still has to render something two letters wide; the
    // language's own code is the closest honest guess at its flag.
    return { code, flag: known?.flag ?? code.slice(0, 2) };
  });
}

/**
 * Extra facts about a person that live outside `public_profiles` — counts and
 * rates computed per call site rather than stored on the profile.
 */
export interface UserExtras {
  attendanceRate?: number | null;
  plansCount?: number | null;
  sharedPlansCount?: number | null;
}

/**
 * A profile row as the UI's `User`.
 *
 * Every `PublicProfileRow` is a whole person: the view carries the interests
 * and the languages alongside the name, so a participant or a host embedded in
 * a `nearby_plans()` row renders exactly what `users.detail()` would.
 *
 * `age` is the one lossy step: `public_profiles` computes it from `birthdate`,
 * which is null until the birthday step six screens into sign-up, while
 * `userSchema` requires a number at or above 18. The floor is the only value
 * the `adult` constraint would ever have allowed, so an unfinished profile
 * reads as the youngest it could be rather than failing the parse and blanking
 * the plan it appears on.
 */
export function toUser(row: PublicProfileRow, extras: UserExtras = {}): User {
  return {
    id: row.id,
    name: row.name ?? '',
    age: row.age ?? 18,
    avatarUrl: avatarUrlFor(row.avatar_storage_path, row.id),
    verified: row.verified ?? false,
    neighbourhood: row.neighbourhood ?? '',
    countryCode: row.country_code ?? undefined,
    pronouns: row.pronouns ?? undefined,
    bio: row.bio ?? undefined,
    interests: [...(row.interests ?? [])],
    languages: spokenLanguagesFor(row.languages ?? []),
    joinedAt: row.joined_at,
    attendanceRate: extras.attendanceRate ?? undefined,
    plansCount: extras.plansCount ?? undefined,
    sharedPlansCount: extras.sharedPlansCount ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

const METRES_PER_MILE = 1609.34;

/** A discovery radius, in the unit the person set it in, as metres. */
export function radiusMetres(radius: number, unit: DistanceUnit): number {
  return unit === 'mi' ? radius * METRES_PER_MILE : radius * 1000;
}

/**
 * `400 m` / `1,1 mi`, as the design writes them.
 *
 * Under a kilometre the design always says metres, whichever unit the person
 * picked — "0,2 mi" tells nobody how far away a café is. Past that it switches
 * to their unit with one decimal, and the locale decides the separator.
 */
export function distanceLabel(metres: number | null | undefined, unit: DistanceUnit): string {
  if (metres == null || !Number.isFinite(metres)) return '';
  if (metres < 1000) return `${Math.round(metres / 50) * 50} m`;
  const value = unit === 'mi' ? metres / METRES_PER_MILE : metres / 1000;
  const formatted = value.toLocaleString(i18n.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formatted} ${unit}`;
}

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

/** Whether a date falls on tomorrow's calendar day. */
function isTomorrow(date: Date, now = new Date()): boolean {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

/** `Hoje` / `Amanhã` / `sáb., 26 de set.` — how the design names a plan's day. */
function dayLabel(date: Date, locale: string): string {
  if (isToday(date)) return i18n.t('datetime.today');
  if (isTomorrow(date)) return i18n.t('datetime.tomorrow');
  return formatPlanDate(date, locale);
}

/**
 * `Hoje 19:00–21:00`.
 *
 * Not a column: it is locale formatting over `starts_at` and
 * `duration_minutes`, and a stored string would be wrong the moment the
 * interface language changed or the day rolled over. A plan with no duration
 * — "Sem hora de fim" on the create flow — gets a start time and nothing else.
 */
export function whenLabel(
  startsAt: string,
  durationMinutes: number | null,
  locale = i18n.language,
): string {
  const start = new Date(startsAt);
  const day = dayLabel(start, locale);
  if (durationMinutes == null) {
    return i18n.t('datetime.dayAtTime', { day, time: formatTime(start, locale) });
  }
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return i18n.t('datetime.dayFromTo', {
    day,
    start: formatTime(start, locale),
    end: formatTime(end, locale),
  });
}

/**
 * `9:24` / `Ontem` / `Seg` — the right-hand column of the conversations list.
 */
export function conversationTimeLabel(timestamp: string | null, locale = i18n.language): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  switch (relativeDay(date)) {
    case 'today':
      return formatTime(date, locale);
    case 'yesterday':
      return i18n.t('datetime.yesterday');
    default: {
      // `seg.` in pt-BR; the list shows it capitalised and without the stop.
      const weekday = date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
      return weekday.charAt(0).toUpperCase() + weekday.slice(1);
    }
  }
}

// ---------------------------------------------------------------------------
// The map pin
// ---------------------------------------------------------------------------

/** The design's iOS frame, which is the coordinate space `Plan.pin` lives in. */
const CANVAS_WIDTH = 402;
const CANVAS_HEIGHT = 874;
/** Keeps a pin and its label bubble clear of the frame's edges. */
const CANVAS_MARGIN = 56;

/** FNV-1a, 32-bit: small, dependency-free and stable across runs and devices. */
function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Where a plan's pin sits on the Explore map.
 *
 * **This is a layout, not a position.** The map behind the pins is an
 * illustration — a drawn texture, not a tile server — so there is no projection
 * to put a real coordinate onto, and the database could not supply one anyway:
 * `profile_locations` is unreadable by design and `nearby_plans` returns a
 * distance in metres precisely so that no coordinate ever reaches a client.
 *
 * So the pin says the one true thing it can. Its distance from the centre of
 * the canvas is the plan's real distance, scaled against the viewer's discovery
 * radius, and its bearing is a stable hash of the plan id — deterministic, so a
 * plan does not jump between renders, and meaningless, which is better than a
 * bearing that looks like north-east and is not.
 *
 * What replaces it: a real map view (MapLibre or Apple Maps), pins placed from
 * `places.point`, and the server returning those coordinates for plans the
 * viewer may already see. At that point this function and `Plan.pin` both go.
 */
export function pinFor(
  planId: string,
  distanceM: number | null | undefined,
  radiusM: number,
): { x: number; y: number } {
  const angle = ((hash32(planId) % 3600) / 3600) * 2 * Math.PI;
  const maxX = CANVAS_WIDTH / 2 - CANVAS_MARGIN;
  const maxY = CANVAS_HEIGHT / 2 - CANVAS_MARGIN;
  const maxRadius = Math.min(maxX, maxY);
  const ratio =
    radiusM > 0 && distanceM != null && Number.isFinite(distanceM)
      ? Math.min(1, Math.max(0, distanceM / radiusM))
      : 0.5;

  const x = CANVAS_WIDTH / 2 + Math.cos(angle) * maxRadius * ratio;
  const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * maxRadius * ratio;
  return {
    x: Math.round(Math.min(CANVAS_WIDTH - CANVAS_MARGIN, Math.max(CANVAS_MARGIN, x))),
    y: Math.round(Math.min(CANVAS_HEIGHT - CANVAS_MARGIN, Math.max(CANVAS_MARGIN, y))),
  };
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

const MEMBERSHIPS = new Set<Membership>(['guest', 'requested', 'joined', 'host', 'waitlisted']);

function toMembership(value: string): Membership {
  return MEMBERSHIPS.has(value as Membership) ? (value as Membership) : 'guest';
}

/**
 * One `nearby_plans()` row as a `Plan`.
 *
 * The queue split is the only arithmetic here. `requests` arrives numbered in
 * `created_at` order and the waitlist is not stored anywhere — once a plan is
 * full the queue simply *is* the pending requests, so the first N, where N is
 * the number of open seats, are the ones the host can still admit and the rest
 * are waiting for someone to drop out. An uncapped plan has no queue at all:
 * it can only be `open`, so nobody ever requests a seat on one.
 */
export interface PlanContext {
  /** The signed-in profile, so their own face gets the brand ring. */
  viewerId: string | null;
  /** The viewer's discovery radius in metres — what the pin's distance scales against. */
  radiusM: number;
  /** The viewer's chosen unit, for the place's distance line. */
  unit: DistanceUnit;
}

export function toPlan(row: NearbyPlanRow, context: PlanContext): Plan {
  const participants = (row.participants ?? []).map((entry) => ({
    user: toUser(entry.profile),
    isHost: entry.isHost,
    isViewer: entry.profile.id === context.viewerId,
  }));

  const queue = (row.requests ?? []).map((entry) => ({
    id: entry.id,
    planId: row.id,
    user: toUser(entry.profile),
    message: entry.message ?? undefined,
    // `note` — "Já participou de 3 planos" in the design — has no column behind
    // it; it was host-facing copy about a track record nothing computes yet.
    note: undefined,
    status: 'pending' as const,
    createdAt: entry.createdAt,
  }));

  const openSeats = row.seats == null ? queue.length : Math.max(0, row.seats - participants.length);

  return {
    id: row.id,
    title: row.title,
    // Cut from the schema: no create step writes one. See docs/database.md §3.10.
    description: undefined,
    languages: row.languages ?? [],
    joinMode: row.join_mode,
    membership: toMembership(row.membership),
    host: row.host ? toUser(row.host) : null,
    place: {
      id: row.place.id,
      name: row.place.name,
      address: row.place.address,
      distanceLabel: distanceLabel(row.place.distanceM, context.unit),
    },
    whenLabel: whenLabel(row.starts_at, row.duration_minutes),
    startsAt: new Date(row.starts_at).toISOString(),
    durationMinutes: row.duration_minutes,
    capacity: row.seats,
    participants,
    requests: queue.slice(0, openSeats),
    waitlist: queue.slice(openSeats),
    ageRange: row.age_min != null && row.age_max != null ? [row.age_min, row.age_max] : null,
    pin: pinFor(row.id, row.distance_m, context.radiusM),
  };
}
