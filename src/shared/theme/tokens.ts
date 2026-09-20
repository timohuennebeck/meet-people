/**
 * Design tokens transcribed verbatim from the `Nearby Plans iOS` design export.
 *
 * Tailwind classes cover most styling; these constants exist for the places
 * React Native needs raw values — SVG `stroke`/`fill`, gradient colour stops,
 * `shadowColor`, and Phosphor icon `color`/`size` props.
 */

import { flattenPalette, palette } from './palette';

/**
 * The palette, flat: `palette.brand.tint` is `colors.brandTint` here. Tailwind
 * reads the same source, so the two can never disagree.
 */
export const colors = flattenPalette();

/** Linear gradients, as `[from, to]` colour stop pairs for `expo-linear-gradient`. */
export const gradients = {
  /** Map backdrop behind pins and sheets. */
  map: [palette.map.top, palette.map.bottom],
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
  /**
   * Fades the app background up over content scrolling under a pinned action,
   * as on the legal documents. The transparent stop is the same colour with a
   * zero alpha channel, so the fade never passes through grey.
   */
  appFade: [`${palette.surface.app}00`, palette.surface.app],
} as const;

/**
 * Gradient directions, as the start/end points `expo-linear-gradient` takes.
 * The design states its photo wash as `158deg` measured from the CSS vertical,
 * which lands the end point at 92% across the bottom edge.
 */
export const gradientAngles = {
  photo: { start: { x: 0, y: 0 }, end: { x: 0.92, y: 1 } },
} as const;

/** Gradient stop positions matching the design's `%` offsets. */
export const gradientStops = {
  welcome: [0, 0.4, 0.62],
  mapFade: [0, 0.4, 1],
  profile: [0, 0.46, 1],
  success: [0, 0.58],
  published: [0, 0.55],
  appFade: [0, 0.44],
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
  /** `0 14px 34px rgba(21,24,31,.10)` — the rules card. */
  ruleCard: {
    shadowColor: '#15181F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 34,
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
