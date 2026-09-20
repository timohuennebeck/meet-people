import { z } from 'zod';

/**
 * Domain schemas. These describe the shape the UI consumes; the fixture source
 * and, later, Supabase both parse through them, so a backend change that breaks
 * a screen surfaces here instead of as a blank render.
 */

export const joinModeSchema = z.enum(['open', 'approval']);
export type JoinMode = z.infer<typeof joinModeSchema>;

/** Where the viewer stands relative to a plan. Drives which sheet state renders. */
export const membershipSchema = z.enum(['guest', 'requested', 'joined', 'host', 'waitlisted']);
export type Membership = z.infer<typeof membershipSchema>;

export const pronounsSchema = z.enum(['she', 'he', 'they', 'unspecified']);
export type Pronouns = z.infer<typeof pronounsSchema>;

export const spokenLanguageSchema = z.object({
  /** BCP-47 language code, e.g. `de`, `en`. */
  code: z.string().min(2),
  /** ISO 3166-1 alpha-2 code for the flag shown beside it. */
  flag: z.string().length(2),
});
export type SpokenLanguage = z.infer<typeof spokenLanguageSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().min(18).max(120),
  avatarUrl: z.string().url(),
  verified: z.boolean(),
  /** Neighbourhood, never a street address — the design is explicit about this. */
  neighbourhood: z.string(),
  /** ISO 3166-1 alpha-2 home country, shown as a flag on the avatar. */
  countryCode: z.string().length(2).optional(),
  pronouns: pronounsSchema.optional(),
  bio: z.string().optional(),
  interests: z.array(z.string()),
  languages: z.array(spokenLanguageSchema),
  joinedAt: z.string(),
  /** 0–100; rendered as the "comparece" stat on a profile. */
  attendanceRate: z.number().min(0).max(100).optional(),
  plansCount: z.number().int().min(0).optional(),
  sharedPlansCount: z.number().int().min(0).optional(),
});
export type User = z.infer<typeof userSchema>;

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Street line shown under the place name. */
  address: z.string(),
  /** Pre-formatted for display, e.g. "400 m" or "1,1 mi". */
  distanceLabel: z.string(),
  /**
   * The maps provider's own id for this place, so a search result and the row
   * it was upserted from are recognisably the same place. Absent for a place
   * someone added by hand, and for a place embedded on a plan, which only
   * carries what the card shows.
   */
  providerPlaceId: z.string().optional(),
});
export type Place = z.infer<typeof placeSchema>;

export const planParticipantSchema = z.object({
  user: userSchema,
  isHost: z.boolean(),
  /** True for the signed-in user, which draws the brand ring on their avatar. */
  isViewer: z.boolean(),
});

export const joinRequestSchema = z.object({
  id: z.string(),
  planId: z.string(),
  user: userSchema,
  /** The applicant's note to the host, quoted on the request row. */
  message: z.string().optional(),
  /** Shown instead of a message when the applicant has a track record. */
  note: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'declined']),
  createdAt: z.string(),
});

export const planSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  /**
   * Which languages the plan will be held in, as codes from the catalogue in
   * `@shared/lib/languages`. Load-bearing rather than decorative: it decides
   * whether someone new in town can follow the evening at all, so the card
   * shows it rather than keeping it behind the tap.
   */
  languages: z.array(z.string()),
  joinMode: joinModeSchema,
  membership: membershipSchema,
  /**
   * Null is a **standing meetup**: a weekly walk or run that nobody organises.
   * Saying "whoever turns up, turns up" is truer and safer than putting a name
   * against a plan nobody is running, so the host card becomes a standing-meetup
   * badge rather than a face. A hostless plan can only be `open` — there is
   * nobody to approve anything. See docs/database.md §3.11.
   */
  host: userSchema.nullable(),
  place: placeSchema,
  /** Pre-formatted, e.g. "Hoje 19:00–21:00". The design never shows raw dates. */
  whenLabel: z.string(),
  /** ISO timestamp, kept alongside the label for sorting and reminders. */
  startsAt: z.string(),
  durationMinutes: z.number().int().positive().nullable(),
  /**
   * Total seats, host included — "vagas" in the product's words.
   *
   * Null is an **uncapped event**, which is a different shape of plan rather
   * than a bigger number: no seat grid, no waitlist, `open` join mode only, and
   * nothing to count "3 vagas livres" against. See docs/database.md §3.12.
   */
  capacity: z.number().int().positive().nullable(),
  participants: z.array(planParticipantSchema),
  requests: z.array(joinRequestSchema),
  waitlist: z.array(joinRequestSchema),
  /** Age range the host restricted the plan to, if any. */
  ageRange: z.tuple([z.number().int(), z.number().int()]).nullable(),
  /** Position on the map canvas, in the design's 402×874 coordinate space. */
  pin: z.object({ x: z.number(), y: z.number() }),
  /** Short title for the pin's label bubble, where the full one will not fit. */
  pinLabel: z.string().optional(),
});
export type Plan = z.infer<typeof planSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.string(),
  /** Receipt line under the bubble, e.g. "Visto 9:24" or "Enviada". */
  receipt: z.string().optional(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  kind: z.enum(['direct', 'group']),
  title: z.string(),
  /** One or two avatars; two renders the offset pair used for groups. */
  avatarUrls: z.array(z.string().url()).min(1).max(2),
  /** "+N" pill on the avatar pair for larger groups. */
  extraMembers: z.number().int().positive().optional(),
  preview: z.string(),
  /** Pre-formatted, e.g. "9:24", "Ontem", "Seg". */
  timeLabel: z.string(),
  unreadCount: z.number().int().min(0),
  memberCount: z.number().int().positive(),
  onlineCount: z.number().int().min(0),
  /** True when the other side is online, shown as a green dot in a direct chat. */
  online: z.boolean().optional(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const distanceUnitSchema = z.enum(['mi', 'km']);
export type DistanceUnit = z.infer<typeof distanceUnitSchema>;

export const audienceGenderSchema = z.enum(['everyone', 'women', 'men', 'nonBinary']);
export type AudienceGender = z.infer<typeof audienceGenderSchema>;

export const preferencesSchema = z.object({
  /** Discovery radius in the user's chosen unit. */
  radius: z.number().positive(),
  distanceUnit: distanceUnitSchema,
  ageRange: z.tuple([z.number().int().min(18), z.number().int().max(99)]),
  audienceGender: audienceGenderSchema,
  interests: z.array(z.string()),
  spokenLanguages: z.array(spokenLanguageSchema),
  appLanguage: z.string(),
  notificationsEnabled: z.boolean(),
});
export type Preferences = z.infer<typeof preferencesSchema>;

/**
 * A people-search hit: the person, plus the pre-formatted line under their
 * name ("Kreuzberg · 2 planos em comum").
 */
export const searchResultSchema = z.object({
  user: userSchema,
  detail: z.string(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResultsSchema = z.array(searchResultSchema);
export type SearchResults = z.infer<typeof searchResultsSchema>;

/**
 * Somebody who looked at the viewer's profile, and when they last looked.
 *
 * One entry per person rather than per visit: `profile_views` keeps a single
 * row per pair and bumps `viewed_at` on every visit, so "Tom looked three
 * times" is a question the table deliberately cannot answer and this type
 * deliberately cannot carry.
 */
export const profileViewSchema = z.object({
  user: userSchema,
  /** ISO timestamp of the most recent look. */
  viewedAt: z.string(),
});
export type ProfileView = z.infer<typeof profileViewSchema>;
