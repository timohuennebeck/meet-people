import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Caret } from './Caret';
import { Chip } from './Chip';
import { Text } from './Text';

export interface TagInputProps {
  /** Committed tags, each rendered as a removable brand pill. */
  tags: readonly string[];
  /** Text currently being typed, shown after the tags with a blinking caret. */
  draft?: string;
  onRemove?: (tag: string) => void;
  /** Field height: 170 in onboarding, 190 on the settings page. */
  minHeight?: number;
  className?: string;
}

/**
 * `min-height:170px · radius:24px · inset 0 0 0 2px #2F7CF6 · padding:14px` —
 * the "type and press enter" interests field. The 2px ring is converted to a
 * border, so padding is reduced by 2 to keep the tags where the design puts them.
 */
export function TagInput({ tags, draft, onRemove, minHeight = 170, className }: TagInputProps) {
  return (
    <View
      className={cn('shrink-0 rounded-panel border-2 border-brand bg-surface p-[12px]', className)}
      style={{ minHeight }}
    >
      <View className="flex-row flex-wrap items-center gap-[8px]">
        {tags.map((tag) => (
          <Chip key={tag} label={tag} size="tag" tone="brand" onRemove={() => onRemove?.(tag)} />
        ))}
        {draft !== undefined ? (
          <View className="flex-row items-center px-[2px] py-[9px]">
            <Text className="text-[16px]">{draft}</Text>
            <Caret height={20} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export interface TextFieldProps {
  /** Sample content the design shows already typed into the field. */
  value?: string;
  /** Grey prompt shown when `value` is absent. */
  placeholder?: string;
  /** Draws the focused 2px brand ring instead of the resting hairline. */
  focused?: boolean;
  /** Appends a blinking caret after the value. */
  caret?: boolean;
  height?: number;
  fontSize?: number;
  radius?: number;
  className?: string;
}

/** Single-line field — e-mail, password, plan title and search inputs. */
export function TextField({
  value,
  placeholder,
  focused = false,
  caret = false,
  height = 56,
  fontSize = 16.5,
  radius = 18,
  className,
}: TextFieldProps) {
  const inset = focused ? 2 : 1;

  return (
    <View
      className={cn(
        'flex-row items-center bg-surface',
        focused ? 'border-2 border-brand' : 'border border-hair',
        className,
      )}
      style={{ height, borderRadius: radius, paddingHorizontal: 16 - inset }}
    >
      <Text className={cn(value === undefined && 'text-ink-ghost')} style={{ fontSize }}>
        {value ?? placeholder}
      </Text>
      {caret ? <Caret height={fontSize + 3.5} /> : null}
    </View>
  );
}
