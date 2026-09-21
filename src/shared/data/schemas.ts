/**
 * The shapes the UI consumes.
 *
 * Both sources build these, so a backend change that would break a screen
 * shows up as a type error where the row is mapped rather than as a blank
 * render. That check is `tsc`'s: `database-types.ts` is generated from the
 * live schema, so the column types these are built from are the real ones.
 */

/**
 * The app's own vocabulary, each set declared once as a constant.
 *
 * A bare `'requested'` in a file says nothing about where else it is used, and
 * two of these sets are worse than that: `'requested'` is both a `Membership`
 * here and a `member_status` in Postgres, meaning different things, and
 * `AUDIENCE_GENDER.NON_BINARY` is `'nonBinary'` here against `'non_binary'` in
 * the column. Naming the member makes it obvious which vocabulary a value
 * belongs to. The database's own words live in `@shared/lib/supabase/enums`
 * and are translated at the edge, never used in a screen.
 *
 * Each is a frozen object plus a type of the same name, so `MEMBERSHIP.HOST`
 * is the value and `Membership` is the type. A `const enum` would be neither —
 * TypeScript's `enum` emits runtime code that its own erasable-syntax mode
 * rejects, and its members are not assignable from the plain strings that
 * arrive out of the database.
 */

/** Why somebody is being reported — mirrors the `report_reason` enum. */
export const REPORT_REASON = {
  NO_SHOW: 'no_show',
  HARASSMENT: 'harassment',
  FAKE_PROFILE: 'fake_profile',
  INAPPROPRIATE: 'inappropriate',
  OTHER: 'other',
} as const;
export type ReportReason = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];

/**
 * The reasons in the order the design lists them, which is not the enum's
 * declaration order — the column stores a value, not a position. Rows are
 * labelled through i18n and identified by these, never by their copy.
 */
export const REPORT_REASONS = [
  REPORT_REASON.NO_SHOW,
  REPORT_REASON.HARASSMENT,
  REPORT_REASON.FAKE_PROFILE,
  REPORT_REASON.INAPPROPRIATE,
  REPORT_REASON.OTHER,
] as const;

/** Whether a seat is taken straight away or has to be asked for. */
export const JOIN_MODE = {
  OPEN: 'open',
  APPROVAL: 'approval',
} as const;
export type JoinMode = (typeof JOIN_MODE)[keyof typeof JOIN_MODE];

/**
 * Where the viewer stands relative to a plan. Drives which sheet state renders.
 *
 * Not the same set as the database's `member_status`, and deliberately so: a
 * row that is `left` or `declined` reads as `GUEST` here, because the sheet
 * asks "can this person join?" and both answers are yes.
 */
export const MEMBERSHIP = {
  GUEST: 'guest',
  REQUESTED: 'requested',
  JOINED: 'joined',
  HOST: 'host',
  WAITLISTED: 'waitlisted',
} as const;
export type Membership = (typeof MEMBERSHIP)[keyof typeof MEMBERSHIP];

export const PRONOUNS = {
  SHE: 'she',
  HE: 'he',
  THEY: 'they',
  UNSPECIFIED: 'unspecified',
} as const;
export type Pronouns = (typeof PRONOUNS)[keyof typeof PRONOUNS];

export interface SpokenLanguage {
  /** BCP-47 language code, e.g. `de`, `en`. */
  code: string;
  /** ISO 3166-1 alpha-2 code for the flag shown beside it. */
  flag: string;
}

export interface User {
  id: string;
  name: string;
  age: number;
  /** `null` for somebody who has not uploaded a photo — the step is skippable. */
  avatarUrl: string | null;
  verified: boolean;
  /** Neighbourhood, never a street address — the design is explicit about this. */
  neighbourhood: string;
  /** ISO 3166-1 alpha-2 home country, shown as a flag on the avatar. */
  countryCode?: string;
  pronouns?: Pronouns;
  bio?: string;
  interests: string[];
  languages: SpokenLanguage[];
  joinedAt: string;
  /** 0–100; rendered as the "comparece" stat on a profile. */
  attendanceRate?: number;
  plansCount?: number;
  sharedPlansCount?: number;
}

/** A plan as the create flow has it, just before it becomes a row. */
export interface NewPlan {
  title: string;
  placeId: string;
  /** ISO instant. */
  startsAt: string;
  /** Null is "Sem hora de fim". */
  durationMinutes: number | null;
  joinMode: JoinMode;
  languages: string[];
  /** Null is an uncapped event. */
  seats: number | null;
  ageRange: readonly [number, number] | null;
}

export interface Place {
  id: string;
  name: string;
  /** Street line shown under the place name. */
  address: string;
  /** Pre-formatted for display, e.g. "400 m" or "1,1 mi". */
  distanceLabel: string;
  /**
   * The maps provider's own id for this place, so a search result and the row
   * it was upserted from are recognisably the same place. Absent for a place
   * someone added by hand, and for a place embedded on a plan, which only
   * carries what the card shows.
   */
  providerPlaceId?: string;
}

export interface PlanParticipant {
  user: User;
  isHost: boolean;
  /** True for the signed-in user, which draws the brand ring on their avatar. */
  isViewer: boolean;
}

export interface JoinRequest {
  id: string;
  planId: string;
  user: User;
  /** The applicant's note to the host, quoted on the request row. */
  message?: string;
  /** Shown instead of a message when the applicant has a track record. */
  note?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  title: string;
  description?: string;
  /**
   * Which languages the plan will be held in, as codes from the catalogue in
   * `@shared/lib/languages`. Load-bearing rather than decorative: it decides
   * whether someone new in town can follow the evening at all, so the card
   * shows it rather than keeping it behind the tap.
   */
  languages: string[];
  joinMode: JoinMode;
  membership: Membership;
  /**
   * Null is a **standing meetup**: a weekly walk or run that nobody organises.
   * Saying "whoever turns up, turns up" is truer and safer than putting a name
   * against a plan nobody is running, so the host card becomes a standing-meetup
   * badge rather than a face. A hostless plan can only be `open` — there is
   * nobody to approve anything. See docs/database.md §3.11.
   */
  host: User | null;
  place: Place;
  /** Pre-formatted, e.g. "Hoje 19:00–21:00". The design never shows raw dates. */
  whenLabel: string;
  /** ISO timestamp, kept alongside the label for sorting and reminders. */
  startsAt: string;
  durationMinutes: number | null;
  /**
   * Total seats, host included — "vagas" in the product's words.
   *
   * Null is an **uncapped event**, which is a different shape of plan rather
   * than a bigger number: no seat grid, no waitlist, `open` join mode only, and
   * nothing to count "3 vagas livres" against. See docs/database.md §3.12.
   */
  capacity: number | null;
  participants: PlanParticipant[];
  requests: JoinRequest[];
  waitlist: JoinRequest[];
  /** Age range the host restricted the plan to, if any. */
  ageRange: [number, number] | null;
  /** Position on the map canvas, in the design's 402×874 coordinate space. */
  pin: { x: number; y: number };
  /** Short title for the pin's label bubble, where the full one will not fit. */
  pinLabel?: string;
}

/**
 * A legal document as the screen renders it: the title, then the sections in
 * reading order.
 *
 * `legal_documents.content_md` is markdown — `#` for the title, `##` per
 * section — and this is what it parses into. `id` and `version` matter as much
 * as the prose: an acceptance points at them, so a record of consent says which
 * text was consented to.
 */
export interface LegalDocument {
  id: string;
  version: string;
  effectiveAt: string;
  title: string;
  sections: { heading: string; body: string }[];
}

export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  createdAt: string;
  /** Receipt line under the bubble, e.g. "Visto 9:24" or "Enviada". */
  receipt?: string;
}

export interface ConversationMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  kind: 'direct' | 'group';
  title: string;
  /** One or two avatars; two renders the offset pair used for groups. */
  avatarUrls: (string | null)[];
  /** "+N" pill on the avatar pair for larger groups. */
  extraMembers?: number;
  /**
   * Everyone in the conversation but the viewer.
   *
   * The thread needs it to put a name and a face on somebody else's bubble in a
   * group. It comes with the conversation rather than with each message because
   * a message arriving over Realtime carries only its own columns — there is no
   * embed on a replication payload — and a bubble that appears nameless until
   * the next refetch is worse than one that never had to wait.
   */
  members: ConversationMember[];
  preview: string;
  /** Pre-formatted, e.g. "9:24", "Ontem", "Seg". */
  timeLabel: string;
  unreadCount: number;
  memberCount: number;
  onlineCount: number;
  /** True when the other side is online, shown as a green dot in a direct chat. */
  online?: boolean;
}

export const DISTANCE_UNIT = {
  MILES: 'mi',
  KILOMETRES: 'km',
} as const;
export type DistanceUnit = (typeof DISTANCE_UNIT)[keyof typeof DISTANCE_UNIT];

/** `NON_BINARY` is `'nonBinary'`; the column's own spelling is `'non_binary'`. */
export const AUDIENCE_GENDER = {
  EVERYONE: 'everyone',
  WOMEN: 'women',
  MEN: 'men',
  NON_BINARY: 'nonBinary',
} as const;
export type AudienceGender = (typeof AUDIENCE_GENDER)[keyof typeof AUDIENCE_GENDER];

export interface Preferences {
  /** Discovery radius in the user's chosen unit. */
  radius: number;
  distanceUnit: DistanceUnit;
  ageRange: [number, number];
  audienceGender: AudienceGender;
  interests: string[];
  spokenLanguages: SpokenLanguage[];
  appLanguage: string;
  notificationsEnabled: boolean;
}

/**
 * A people-search hit: the person, plus the pre-formatted line under their
 * name ("Kreuzberg · 2 planos em comum").
 */
export interface SearchResult {
  user: User;
  detail: string;
}

export type SearchResults = SearchResult[];

/**
 * Somebody who looked at the viewer's profile, and when they last looked.
 *
 * One entry per person rather than per visit: `profile_views` keeps a single
 * row per pair and bumps `viewed_at` on every visit, so "Tom looked three
 * times" is a question the table deliberately cannot answer and this type
 * deliberately cannot carry.
 */
export interface ProfileView {
  user: User;
  /** ISO timestamp of the most recent look. */
  viewedAt: string;
}
