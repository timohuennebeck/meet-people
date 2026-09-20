/**
 * The colour palette, transcribed verbatim from the `Nearby Plans iOS` design
 * export.
 *
 * This is the one place a colour is written down. `tailwind.config.ts` feeds it
 * straight to Tailwind, so every `bg-brand-tint` resolves from here, and
 * `tokens.ts` flattens it for the places React Native needs a raw value — SVG
 * `stroke`/`fill`, gradient stops, `shadowColor`, Phosphor icon `color`.
 *
 * Groups become `group-shade` in Tailwind and `groupShade` in `colors`;
 * `DEFAULT` is the bare group name in both.
 */
export const palette = {
  brand: {
    DEFAULT: '#2F7CF6',
    ink: '#1B5FCB',
    deep: '#2A4A7D',
    slate: '#2C4C80',
    tint: '#EAF1FE',
    tintAlt: '#E8F1FE',
    wash: '#E4EEFD',
    mist: '#E6F0FE',
    haze: '#DCEAFE',
    pale: '#EDF3FC',
    band: '#D6E5FC',
    rail: '#DCE6F6',
    line: '#C5D7F2',
    row: '#EAF2FE',
  },
  ink: {
    DEFAULT: '#15181F',
    strong: '#3B3944',
    body: '#3E4553',
    muted: '#5E6676',
    soft: '#5B6373',
    dim: '#72798A',
    faint: '#7A8595',
    ghost: '#8A91A0',
    trace: '#9AA2B1',
    mute: '#A7ADBA',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    app: '#F7F9FC',
    alt: '#F4F7FD',
    sunken: '#F3F6FA',
    fill: '#F1F4F9',
    chip: '#EEF2F8',
    rail: '#EAEEF5',
    dusk: '#E6ECF7',
    tint: '#FAFAFC',
    night: '#171B22',
    camera: '#0E1219',
  },
  hair: {
    DEFAULT: '#E6EBF3',
    soft: '#F0F3F8',
    rail: '#E3E9F2',
    mid: '#DFE5EF',
    deep: '#DCE4F0',
    dash: '#C9CFD9',
    cool: '#E0E7F2',
    steel: '#C9D5E8',
    bar: '#E1E4EA',
    tag: '#E1E7F0',
    pale: '#C3CAD6',
    stone: '#D6DCE6',
    slate: '#B4BAC6',
    dot: '#C9D0DC',
  },
  category: {
    sport: '#32C36A',
    games: '#4A5163',
    walk: '#FF8A3D',
    coffee: '#FF5C7A',
  },
  danger: { DEFAULT: '#E14B4B', deep: '#C0483C' },
  warn: {
    DEFAULT: '#F0A22E',
    solid: '#E8942A',
    tint: '#FDF0DA',
    wash: '#FFF4E8',
    ink: '#6B4A1B',
  },
  /** Map backdrop, top to bottom. */
  map: { top: '#FBE8CE', bottom: '#FDF4EA' },
  online: '#34C759',
  white: '#FFFFFF',
} as const;

/** The design's corner radii, named after what they round. */
export const radii = {
  sheet: '30px',
  card: '26px',
  panel: '24px',
  tile: '22px',
  well: '20px',
  field: '18px',
  pill: '999px',
} as const;

type Palette = typeof palette;

type FlatName<G extends string, K extends string> = K extends 'DEFAULT'
  ? G
  : `${G}${Capitalize<K>}`;

/** `{ brand: {DEFAULT, tint} }` becomes `{ brand, brandTint }`. */
export type FlatPalette = {
  [
    G in keyof Palette & string as Palette[G] extends string
      ? G
      : FlatName<G, keyof Palette[G] & string>
  ]: string;
};

/** Flattens the grouped palette into the names `tokens.colors` exposes. */
export function flattenPalette(): FlatPalette {
  const flat: Record<string, string> = {};
  for (const [group, value] of Object.entries(palette)) {
    if (typeof value === 'string') {
      flat[group] = value;
      continue;
    }
    for (const [shade, hex] of Object.entries(value)) {
      flat[shade === 'DEFAULT' ? group : `${group}${shade[0]!.toUpperCase()}${shade.slice(1)}`] =
        hex;
    }
  }
  return flat as FlatPalette;
}
