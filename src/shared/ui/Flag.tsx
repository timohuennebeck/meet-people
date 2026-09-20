import { Image } from 'expo-image';

import { cn } from '@shared/lib/cn';

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
  /** Adds the `0 0 0 2px #fff` gutter used when flags overlap in a stack. */
  ringed?: boolean;
  className?: string;
}

/** Circular country flag. */
export function Flag({ code, size = 42, ringed = false, className }: FlagProps) {
  return (
    <Image
      source={{ uri: flagUri(code) }}
      accessibilityLabel={code.toUpperCase()}
      className={cn('shrink-0 rounded-full', className)}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        ...(ringed ? { borderWidth: 2, borderColor: '#fff' } : null),
      }}
      contentFit="cover"
    />
  );
}

/** Overlapping pair of flags — the "languages I speak" value in settings. */
export function FlagStack({ codes, size = 22 }: { codes: string[]; size?: number }) {
  return (
    <>
      {codes.map((code, index) => (
        <Flag
          key={code}
          code={code}
          size={size}
          ringed
          className={index === 0 ? undefined : '-ml-[7px]'}
        />
      ))}
    </>
  );
}
