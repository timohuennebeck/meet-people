import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

export interface SheetSurfaceProps {
  children: ReactNode;
  /**
   * Vertical gap between the sheet's children. The design uses 16 for content
   * sheets and 18 for the host and confirmation sheets.
   */
  gap: number;
  /** Sheet padding. Every sheet states its own, as the design draws them. */
  padding: { top: number; horizontal: number; bottom: number };
  className?: string;
}

/**
 * The content column of a native form sheet.
 *
 * The panel itself is no longer drawn here: `react-native-screens` presents
 * these routes as iOS form sheets, so the system supplies the corner radius,
 * the grabber, the shadow and the dimming behind it. What is left is the
 * surface colour and the padding each sheet states — shared because three
 * screens hold to the same padding contract, and because the Android tweak
 * these sheets will eventually need wants one place to land.
 *
 * It lays out in normal flow and must never grow to fill: the stack measures
 * this subtree to size the sheet (`sheetAllowedDetents: 'fitToContents'`), and
 * content that stretches into a container with no resolved height measures to
 * zero.
 */
export function SheetSurface({ children, gap, padding, className }: SheetSurfaceProps) {
  return (
    <View
      className={cn('bg-surface', className)}
      style={{
        paddingTop: padding.top,
        paddingHorizontal: padding.horizontal,
        paddingBottom: padding.bottom,
        gap,
      }}
    >
      {children}
    </View>
  );
}
