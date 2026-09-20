import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Text } from './Text';

/**
 * Opacity ramp for the rows either side of the selection. The design fades
 * neighbours to .45 and the outermost rows to .2.
 */
const OPACITY = [0.2, 0.45, 1, 0.45, 0.2];

export interface WheelColumnProps {
  /** Exactly five values, centred on the selected one. */
  items: readonly string[];
  /** Type size for the unselected rows. */
  fontSize: number;
  /** Type size for the centred row, which the design enlarges. */
  selectedFontSize: number;
  gap: number;
}

/** One scrolling column of a picker, rendered at its resting position. */
function WheelColumn({ items, fontSize, selectedFontSize, gap }: WheelColumnProps) {
  return (
    <View className="items-center" style={{ gap }}>
      {items.map((item, index) => {
        const selected = index === 2;
        return (
          <Text
            key={`${item}-${index}`}
            weight={selected ? 500 : 400}
            style={{
              fontSize: selected ? selectedFontSize : fontSize,
              opacity: OPACITY[index],
              fontVariant: ['tabular-nums'],
            }}
          >
            {item}
          </Text>
        );
      })}
    </View>
  );
}

export interface WheelPickerProps {
  columns: readonly (readonly string[])[];
  /** Overall height: 236 for the birthday picker, 262 for the time picker. */
  height: number;
  /** Height of the highlighted selection band. */
  bandHeight: number;
  /** Corner radius of the selection band. */
  bandRadius: number;
  /** Horizontal gap between columns. */
  columnGap: number;
  /** Vertical gap between rows within a column. */
  rowGap: number;
  fontSize: number;
  selectedFontSize: number;
  /** Height of the top and bottom fade masks. */
  fade: number;
  className?: string;
}

/**
 * The iOS-style wheel picker used for birthday and start time. It renders at
 * rest — the design shows a static state, and scrolling is wired up with the
 * rest of the plan data.
 */
export function WheelPicker({
  columns,
  height,
  bandHeight,
  bandRadius,
  columnGap,
  rowGap,
  fontSize,
  selectedFontSize,
  fade,
  className,
}: WheelPickerProps) {
  return (
    <View
      className={cn(
        'relative shrink-0 overflow-hidden rounded-panel border border-hair bg-surface',
        className,
      )}
      style={{ height }}
    >
      <View
        className="absolute left-[16px] right-[16px] top-1/2 bg-surface-chip"
        style={{ height: bandHeight, marginTop: -bandHeight / 2, borderRadius: bandRadius }}
      />
      <View
        className="absolute inset-0 flex-row items-center justify-center"
        style={{ gap: columnGap }}
      >
        {columns.map((items, index) => (
          <WheelColumn
            key={index}
            items={items}
            gap={rowGap}
            fontSize={fontSize}
            selectedFontSize={selectedFontSize}
          />
        ))}
      </View>
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255,255,255,0)']}
        locations={[0.2, 1]}
        className="absolute left-0 right-0 top-0"
        style={{ height: fade }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0)', '#FFFFFF']}
        locations={[0, 0.8]}
        className="absolute bottom-0 left-0 right-0"
        style={{ height: fade }}
        pointerEvents="none"
      />
    </View>
  );
}
