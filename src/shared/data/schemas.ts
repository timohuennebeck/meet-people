/**
 * The shapes the UI consumes.
 *
 * Both sources build these, so a backend change that would break a screen
 * shows up as a type error where the row is mapped rather than as a blank
 * render. That check is `tsc`'s: `database-types.ts` is generated from the
 * live schema, so the column types these are built from are the real ones.
 */

/**
 * Why somebody is being reported — the `report_reason` Postgres enum.
 *
 * The order here is the design's, which is not the enum's declaration order;
 * the column stores a value, not a position. Rows are labelled through i18n and
 * identified by these, never by their copy.
 */
export const REPORT_REASONS = [
  'no_show',
  'harassment',
  'fake_profile',
  'inappropriate',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type JoinMode = 'open' | 'approval';

/** Where the viewer stands relative to a plan. Drives which sheet state renders. */
export type Membership = 'guest' | 'requested' | 'joined' | 'host' | 'waitlisted';

export type Pronouns = 'she' | 'he' | 'they' | 'unspecified';

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
  avatarUrl: string;
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
  status: 'pending' | 'accepted' | 'declined';
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
  avatarUrl: string;
}

export interface Conversation {
  id: string;
  kind: 'direct' | 'group';
  title: string;
  /** One or two avatars; two renders the offset pair used for groups. */
  avatarUrls: string[];
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

export type DistanceUnit = 'mi' | 'km';

export type AudienceGender = 'everyone' | 'women' | 'men' | 'nonBinary';

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
