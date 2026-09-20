import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { SelectionDot } from './Card';
import { Flag } from './Flag';
import { ChevronRight } from './icons';
import { Text } from './Text';

/**
 * `border-radius:24px · #fff · 0 0 0 1px #E6EBF3 · padding:0 16px` — the card
 * that wraps a group of settings rows. Rows draw their own top hairline, so the
 * group itself has no vertical padding.
 */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn('rounded-panel border border-hair bg-surface px-[16px]', className)}>
      {children}
    </View>
  );
}

export interface ListRowProps {
  label: string;
  /** Second line under the label, e.g. "14 planos neste raio". */
  detail?: string;
  /** Right-aligned current value, e.g. "2 mi" or "sara@mail.com". */
  value?: string;
  /** Rendered between the label and the value — flags, or a status pill. */
  accessory?: ReactNode;
  /** Draws the `1px #F0F3F8` separator above the row. */
  divided?: boolean;
  /** Renders the label in the destructive red used by "delete account". */
  destructive?: boolean;
  onPress?: () => void;
}

/** `padding:15px 0 · 16.5px/500 label · 16px #72798A value · chevron` — a settings row. */
export function ListRow({
  label,
  detail,
  value,
  accessory,
  divided = false,
  destructive = false,
  onPress,
}: ListRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-[12px] py-[15px] active:opacity-60',
        divided && 'border-t border-hair-soft',
      )}
    >
      <View className="min-w-0 flex-1 gap-[3px]">
        <Text
          weight={500}
          className={cn('text-[16.5px]', destructive ? 'text-danger-deep' : 'text-ink')}
        >
          {label}
        </Text>
        {detail ? <Text className="text-[13.5px] text-ink-ghost">{detail}</Text> : null}
      </View>
      {accessory}
      {value ? <Text className="text-[16px] text-ink-dim">{value}</Text> : null}
      <ChevronRight size={13} />
    </Pressable>
  );
}

export interface SelectableRowProps {
  title: string;
  /** Second line — a proficiency level, or the language's endonym. */
  subtitle?: string;
  /** ISO 3166-1 alpha-2 code for the leading flag. */
  flag?: string;
  selected?: boolean;
  /** Shows a grey "+" affordance instead of a selection dot (search results). */
  addable?: boolean;
  /** Bolds a matched prefix, as the language search does while typing. */
  highlightPrefix?: string;
  onPress?: () => void;
}

/**
 * `border-radius:20px · padding:12px 14px · 42px flag · 17px title` — the row
 * used by every flag list: app language, spoken languages and home country.
 */
export function SelectableRow({
  title,
  subtitle,
  flag,
  selected = false,
  addable = false,
  highlightPrefix,
  onPress,
}: SelectableRowProps) {
  // Selected rows carry an inset ring, which overlaps the padding; resting rows
  // carry an outset one, which does not.
  const padCompensation = selected ? 2 : 0;
  const rest = highlightPrefix ? title.slice(highlightPrefix.length) : null;

  return (
    <Pressable
      accessibilityRole={addable ? 'button' : 'radio'}
      accessibilityState={addable ? undefined : { selected }}
      onPress={onPress}
      className={cn(
        'rounded-well bg-surface',
        selected ? 'border-2 border-brand' : 'border border-hair',
      )}
      style={{ paddingVertical: 12 - padCompensation, paddingHorizontal: 14 - padCompensation }}
    >
      <View className="flex-row items-center gap-[14px]">
        {flag ? <Flag code={flag} size={42} /> : null}
        <View className="flex-1 gap-[2px]">
          {rest !== null ? (
            <Text weight={500} className="text-[17px]">
              <Text weight={600} className="text-[17px]">
                {highlightPrefix}
              </Text>
              {rest}
            </Text>
          ) : (
            // Search results sit at 500; list rows at 400, bolding to 600 when chosen.
            <Text weight={selected ? 600 : addable ? 500 : 400} className="text-[17px]">
              {title}
            </Text>
          )}
          {subtitle ? <Text className="text-[13.5px] text-ink-dim">{subtitle}</Text> : null}
        </View>
        {addable ? (
          <Text className="text-[22px] text-hair-pale">+</Text>
        ) : selected ? (
          <SelectionDot selected />
        ) : null}
      </View>
    </Pressable>
  );
}
