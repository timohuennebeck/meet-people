import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { shadows } from '@shared/theme/tokens';

/**
 * `rgba(21,24,31,.18)` — the dimmer behind a sheet. The leave-plan confirmation
 * uses the heavier `.32` variant.
 */
export function SheetScrim({ strong = false }: { strong?: boolean }) {
  return (
    <View
      className="absolute inset-0"
      style={{ backgroundColor: strong ? 'rgba(21,24,31,0.32)' : 'rgba(21,24,31,0.18)' }}
    />
  );
}

/** `40×5 · #E1E4EA` — the drag handle centred at the top of a sheet. */
function SheetGrabber() {
  return <View className="mx-auto h-[5px] w-[40px] rounded-[3px] bg-hair-bar" />;
}

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
 * `border-radius:30px 30px 0 0 · #fff · 0 -10px 40px rgba(21,24,31,.18)` — the
 * white panel that slides up from the bottom of the screen.
 */
export function SheetSurface({ children, gap, padding, className }: SheetSurfaceProps) {
  return (
    <View
      className={cn('absolute bottom-0 left-0 right-0 rounded-t-sheet bg-surface', className)}
      style={[
        {
          paddingTop: padding.top,
          paddingHorizontal: padding.horizontal,
          paddingBottom: padding.bottom,
          gap,
        },
        shadows.sheet,
      ]}
    >
      <SheetGrabber />
      {children}
    </View>
  );
}
