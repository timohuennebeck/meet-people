/**
 * Design tokens transcribed verbatim from the `Nearby Plans iOS` design export.
 *
 * Tailwind classes cover most styling; these constants exist for the places
 * React Native needs raw values — SVG `stroke`/`fill`, gradient colour stops,
 * `shadowColor`, and Phosphor icon `color`/`size` props.
 */

export const colors = {
  brand: '#2F7CF6',
  brandInk: '#1B5FCB',
  brandDeep: '#2A4A7D',
  brandSlate: '#2C4C80',
  brandTint: '#EAF1FE',
  brandTintAlt: '#E8F1FE',
  brandWash: '#E4EEFD',
  brandMist: '#E6F0FE',
  brandHaze: '#DCEAFE',
  brandPale: '#EDF3FC',
  brandBand: '#D6E5FC',
  brandRail: '#DCE6F6',
  brandLine: '#C5D7F2',
  brandRow: '#EAF2FE',

  ink: '#15181F',
  inkStrong: '#3B3944',
  inkBody: '#3E4553',
  inkMuted: '#5E6676',
  inkSoft: '#5B6373',
  inkDim: '#72798A',
  inkFaint: '#7A8595',
  inkGhost: '#8A91A0',
  inkTrace: '#9AA2B1',
  inkMute: '#A7ADBA',

  surface: '#FFFFFF',
  surfaceApp: '#F7F9FC',
  surfaceAlt: '#F4F7FD',
  surfaceSunken: '#F3F6FA',
  surfaceFill: '#F1F4F9',
  surfaceChip: '#EEF2F8',
  surfaceRail: '#EAEEF5',
  surfaceDusk: '#E6ECF7',
  surfaceTint: '#FAFAFC',
  surfaceNight: '#171B22',
  surfaceCamera: '#0E1219',

  hair: '#E6EBF3',
  hairSoft: '#F0F3F8',
  hairRail: '#E3E9F2',
  hairMid: '#DFE5EF',
  hairDeep: '#DCE4F0',
  hairDash: '#C9CFD9',
  hairCool: '#E0E7F2',
  hairSteel: '#C9D5E8',
  hairBar: '#E1E4EA',
  hairTag: '#E1E7F0',
  hairPale: '#C3CAD6',
  hairStone: '#D6DCE6',
  hairSlate: '#B4BAC6',
  hairDot: '#C9D0DC',

  categorySport: '#32C36A',
  categoryGames: '#4A5163',
  categoryWalk: '#FF8A3D',
  categoryCoffee: '#FF5C7A',

  danger: '#E14B4B',
  dangerDeep: '#C0483C',
  warn: '#F0A22E',
  warnSolid: '#E8942A',
  warnTint: '#FDF0DA',
  warnWash: '#FFF4E8',
  warnInk: '#6B4A1B',
  online: '#34C759',

  mapTop: '#FBE8CE',
  mapBottom: '#FDF4EA',
  white: '#FFFFFF',
} as const;

/** Linear gradients, as `[from, to]` colour stop pairs for `expo-linear-gradient`. */
export const gradients = {
  /** Map backdrop behind pins and sheets. */
  map: ['#FBE8CE', '#FDF4EA'],
  /** Map backdrop that fades to white at the bottom (join-request sheet). */
  mapFade: ['#FCEBCF', '#FDF3E2', '#FFFFFF'],
  /** Placeholder behind the mascot on plan photos. */
  photo: ['#EDF4FF', '#DEEAFB'],
  /** Top-of-screen wash on welcome and success screens. */
  welcome: ['#E6F0FE', '#F1F5FA', '#F7F9FC'],
  /** Two-stop variant used by the published and verified screens. */
  success: ['#E6F0FE', '#F7F9FC'],
  /** Profile header wash, fading out to transparent. */
  profile: ['#E4EEFD', '#F2F7FF', 'rgba(255,255,255,0)'],
} as const;

/** Gradient stop positions matching the design's `%` offsets. */
export const gradientStops = {
  welcome: [0, 0.4, 0.62],
  mapFade: [0, 0.4, 1],
  profile: [0, 0.46, 1],
  success: [0, 0.58],
  published: [0, 0.55],
} as const;

/**
 * Shadows. React Native needs these split into `shadowColor`/`shadowOffset`/
 * `shadowOpacity`/`shadowRadius` (iOS) plus `elevation` (Android), so each
 * CSS `box-shadow` from the design is pre-decomposed here.
 */
export const shadows = {
  /** `0 4px 16px rgba(21,24,31,.1)` — floating map chips and the logo pill. */
  chip: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  /** `0 2px 8px rgba(21,24,31,.08)` — inactive filter chips. */
  chipSoft: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  /** `0 6px 16px rgba(21,24,31,.14)` — the map compose button. */
  compose: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  /** `0 6px 18px rgba(21,24,31,.18)` — map pins. */
  pin: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
  /** `0 4px 14px rgba(21,24,31,.12)` — the label bubble beside a pin. */
  pinLabel: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  /** `0 14px 40px rgba(21,24,31,.16)` — plan cards in the map carousel. */
  planCard: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 40,
    elevation: 12,
  },
  /** `0 -10px 40px rgba(21,24,31,.18)` — bottom sheets. */
  sheet: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
  },
  /** `0 6px 16px rgba(21,24,31,.12)` — primary buttons inside sheets. */
  primaryButton: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  /** `0 6px 16px rgba(225,75,75,.22)` — the destructive "leave plan" button. */
  dangerButton: {
    shadowColor: '#E14B4B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  /** `0 6px 16px rgba(47,124,246,.22)` — the sender's latest chat bubble. */
  sentBubble: {
    shadowColor: '#2F7CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  /** `0 10px 26px rgba(21,24,31,.1)` — welcome-screen floating plan cards. */
  floatCard: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 26,
    elevation: 8,
  },
  /** `0 10px 26px rgba(21,24,31,.16)` — the large profile avatar. */
  profileAvatar: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 8,
  },
  /** `0 8px 22px rgba(21,24,31,.08)` — the sample push notification card. */
  notification: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 6,
  },
  /** `0 12px 30px rgba(21,24,31,.08)` — the rules card. */
  ruleCard: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },
  /** `0 2px 8px rgba(21,24,31,.22)` — slider thumbs. */
  sliderThumb: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
