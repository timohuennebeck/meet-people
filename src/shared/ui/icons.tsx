import Svg, { Circle, Path, Rect, type SvgProps } from 'react-native-svg';

import { colors } from '@shared/theme/tokens';

/**
 * Glyphs the design draws inline rather than pulling from an icon set. Each one
 * reproduces its source `<svg>` exactly — same `viewBox`, path data, stroke
 * width and caps — so they render identically to the export.
 *
 * Icons the design took from Phosphor (`ph-clock`, `ph-map-pin-simple`, …) are
 * imported straight from `phosphor-react-native` at their call sites instead.
 */

interface GlyphProps extends SvgProps {
  size?: number;
  color?: string;
  /** Overrides the source stroke width where a screen uses a heavier variant. */
  strokeWidth?: number;
}

/** `M7.75 1.5L4.25 6l3.5 4.5` — back chevron in every header. */
export function ChevronLeft({
  size = 13,
  color = colors.inkStrong,
  strokeWidth = 2,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...rest}>
      <Path
        d="M7.75 1.5L4.25 6l3.5 4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** `M4.25 1.5L7.75 6l-3.5 4.5` — disclosure chevron on settings rows. */
export function ChevronRight({
  size = 13,
  color = colors.hairSlate,
  strokeWidth = 2,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={(size / 13) * 8} height={size} viewBox="0 0 12 12" fill="none" {...rest}>
      <Path
        d="M4.25 1.5L7.75 6l-3.5 4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** `M2 2l8 8M10 2l-8 8` — the small × inside a selected interest tag. */
export function CloseSmall({
  size = 11,
  color = colors.white,
  strokeWidth = 2,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...rest}>
      <Path d="M2 2l8 8M10 2l-8 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** `M3 3l8 8M11 3l-8 8` — the × that replaces the back chevron on skippable steps. */
export function CloseHeader({
  size = 11,
  color = colors.inkStrong,
  strokeWidth = 1.9,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none" {...rest}>
      <Path d="M3 3l8 8M11 3l-8 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** `M2 2l10 10M12 2L2 12` — the × on the camera overlay. */
export function CloseCamera({
  size = 14,
  color = colors.white,
  strokeWidth = 1.9,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none" {...rest}>
      <Path
        d="M2 2l10 10M12 2L2 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** `M5 5l14 14M19 5L5 19` — the × that clears a search field. */
export function CloseClear({
  size = 10,
  color = colors.white,
  strokeWidth = 3,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M5 5l14 14M19 5L5 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** `M4 10.5l4 4 8-9` — the tick inside a filled selection dot. */
export function Check({ size = 13, color = colors.white, strokeWidth = 2.6, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M4 10.5l4 4 8-9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** `M5 12.5l4.5 4.5L19 7.5` — the tick inside the verification seal. */
export function CheckSeal({
  size = 12,
  color = colors.white,
  strokeWidth = 3.2,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** `M12 5v14M5 12h14` — the compose and stepper plus. */
export function PlusGlyph({
  size = 22,
  color = colors.white,
  strokeWidth = 2.6,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** `M5 12h14` — the stepper minus. */
export function MinusGlyph({
  size = 22,
  color = colors.inkStrong,
  strokeWidth = 2.4,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path d="M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Circle plus handle — the search glyph on the language search field. */
export function SearchGlyph({
  size = 15,
  color = colors.inkDim,
  strokeWidth = 1.8,
  ...rest
}: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" {...rest}>
      <Circle cx={7} cy={7} r={4.6} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M10.4 10.4L14 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Envelope — the "continue with e-mail" button icon. */
export function EnvelopeGlyph({ size = 19, color = colors.white, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Rect
        x={2.8}
        y={5}
        width={18.4}
        height={14}
        rx={3}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.4 6.6L12 13l8.6-6.4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The four-colour Google mark. */
export function GoogleGlyph({ size = 19, ...rest }: Omit<GlyphProps, 'color'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <Path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
      />
      <Path
        fill="#34A853"
        d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
      />
      <Path
        fill="#FBBC05"
        d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z"
      />
    </Svg>
  );
}

/** Eye — the reveal-password control. */
export function EyeGlyph({ size = 21, color = colors.inkDim, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={12} r={2.8} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

/** Circular arrow — "retake" on the selfie review screen. */
export function RetakeGlyph({ size = 15, color = colors.white, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M20 11a8 8 0 10-2.3 5.7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 4v7h-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Chain link — the share-link row. */
export function LinkGlyph({ size = 16, color = colors.inkDim, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M10 14a4.5 4.5 0 006.4 0l2.6-2.6a4.5 4.5 0 10-6.4-6.4L11.4 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M14 10a4.5 4.5 0 00-6.4 0L5 12.6a4.5 4.5 0 106.4 6.4l1.2-1.2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** QR code — the share row's middle action. */
export function QrGlyph({ size = 22, color = colors.inkStrong, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Rect x={3.5} y={3.5} width={7} height={7} rx={1.6} stroke={color} strokeWidth={1.9} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={1.6} stroke={color} strokeWidth={1.9} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={1.6} stroke={color} strokeWidth={1.9} />
      <Rect x={13.5} y={13.5} width={3} height={3} rx={1} stroke={color} strokeWidth={1.9} />
      <Rect x={17.5} y={17.5} width={3} height={3} rx={1} stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}

/** Three filled dots in a row — the share row's "more" action. */
export function DotsHorizontal({ size = 22, color = colors.inkStrong, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <Circle cx={6} cy={12} r={1.9} fill={color} />
      <Circle cx={12} cy={12} r={1.9} fill={color} />
      <Circle cx={18} cy={12} r={1.9} fill={color} />
    </Svg>
  );
}

/** Three outlined dots stacked — the overflow menu in chat and profile headers. */
export function DotsVertical({ size = 16, color = colors.inkBody, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Circle cx={12} cy={5.5} r={1.4} stroke={color} strokeWidth={1.9} />
      <Circle cx={12} cy={12} r={1.4} stroke={color} strokeWidth={1.9} />
      <Circle cx={12} cy={18.5} r={1.4} stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}

/** `M12 19V5.5M6 11l6-6 6 6` — the chat send arrow. */
export function SendGlyph({ size = 18, color = colors.white, ...rest }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M12 19V5.5M6 11l6-6 6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
