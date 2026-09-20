import { Image } from 'expo-image';

import { cn } from '@shared/lib/cn';

import { Ring } from './Avatar';

/**
 * The design pulls circular country flags from the `flag-icons` CDN at a pinned
 * version. Keeping the same source means the artwork matches the export exactly.
 */
const FLAG_CDN = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/1x1';

export function flagUri(code: string): string {
  return `${FLAG_CDN}/${code.toLowerCase()}.svg`;
}

export interface FlagProps {
  /** ISO 3166-1 alpha-2 code, e.g. `pt`, `gb`, `de`. */
  code: string;
  size?: number;
  className?: string;
}

/** Circular country flag. */
export function Flag({ code, size = 42, className }: FlagProps) {
  return (
    <Image
      source={{ uri: flagUri(code) }}
      accessibilityLabel={code.toUpperCase()}
      className={cn('shrink-0 rounded-full', className)}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
    />
  );
}

/**
 * Overlapping pair of flags — the "languages I speak" value in settings.
 * The `0 0 0 2px #fff` gutter is drawn outside each flag, so `Ring` keeps the
 * artwork at its stated size.
 */
export function FlagStack({ codes, size = 22 }: { codes: string[]; size?: number }) {
  return (
    <>
      {codes.map((code, index) => (
        <Ring key={code} size={size} width={2} style={index === 0 ? undefined : { marginLeft: -7 }}>
          <Flag code={code} size={size} />
        </Ring>
      ))}
    </>
  );
}
