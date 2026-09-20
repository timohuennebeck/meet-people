import { type ReactNode, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';

import { Chip } from './Chip';
import { FONT_FAMILY, Text, type FontWeight } from './Text';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;

/**
 * Every field in the design draws a `1px #E6EBF3` ring at rest and an inset
 * `2px #2F7CF6` one while focused. A React Native border eats into the padding,
 * so compensating by the border width in both states keeps the text on the same
 * x and the field the same size as it gains its ring.
 */
function useFocusRing(onFocus?: FocusHandler, onBlur?: FocusHandler, enabled = true) {
  const [focused, setFocused] = useState(false);

  return {
    border: enabled ? (focused ? 2 : 1) : 0,
    className: enabled ? (focused ? 'border-2 border-brand' : 'border border-hair') : undefined,
    handlers: {
      onFocus: (event: Parameters<FocusHandler>[0]) => {
        setFocused(true);
        onFocus?.(event);
      },
      onBlur: (event: Parameters<FocusHandler>[0]) => {
        setFocused(false);
        onBlur?.(event);
      },
    },
  };
}

/**
 * React Native pads a `TextInput` on its own — Android reserves room around the
 * glyphs and both platforms add vertical padding — which fights the design's
 * exact field heights. Zeroing both lets the wrapper own the box.
 */
const INPUT_RESET = { padding: 0, margin: 0, includeFontPadding: false } as const;

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'className'> {
  value: string;
  onChangeText: (next: string) => void;
  /** Drawn before the input, e.g. the search glyph. */
  leading?: ReactNode;
  /** Drawn after the input, e.g. the password reveal eye. */
  accessory?: ReactNode;
  height?: number;
  fontSize?: number;
  radius?: number;
  weight?: FontWeight;
  /** The name step's field sits on a tinted card and the design gives it no ring. */
  ring?: boolean;
  /** Side padding before the ring is compensated for; the design's own value. */
  paddingHorizontal?: number;
  className?: string;
}

/** Single-line field — e-mail, password, plan title and search inputs. */
export function TextField({
  value,
  onChangeText,
  leading,
  accessory,
  height = 56,
  fontSize = 16.5,
  radius = 18,
  weight = 400,
  ring: showRing = true,
  paddingHorizontal = 16,
  className,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const ring = useFocusRing(onFocus, onBlur, showRing);

  return (
    <View
      className={cn(
        'shrink-0 flex-row items-center gap-[10px] bg-surface',
        ring.className,
        className,
      )}
      style={{ height, borderRadius: radius, paddingHorizontal: paddingHorizontal - ring.border }}
    >
      {leading}
      <TextInput
        {...rest}
        {...ring.handlers}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.inkGhost}
        selectionColor={colors.brand}
        style={[INPUT_RESET, { flex: 1, fontFamily: FONT_FAMILY[weight], fontSize, height }]}
      />
      {accessory}
    </View>
  );
}

export interface NoteFieldProps extends Omit<TextInputProps, 'style' | 'className' | 'multiline'> {
  value: string;
  onChangeText: (next: string) => void;
  /** The design pads the request note 14px all round and the leave note 16/14. */
  padding?: { vertical: number; horizontal: number };
  /** Greys the text, as the optional leave note is drawn. */
  muted?: boolean;
  minHeight?: number;
  fontSize?: number;
  lineHeight?: number;
  weight?: FontWeight;
  className?: string;
}

/**
 * `min-height:118px · 2px brand ring` — the multi-line note on the join-request
 * and leave-plan sheets. Both sheets open with the keyboard already up, so the
 * design draws it focused.
 */
export function NoteField({
  value,
  onChangeText,
  padding = { vertical: 14, horizontal: 14 },
  muted = false,
  minHeight = 118,
  fontSize = 17,
  lineHeight = 24.65,
  weight = 400,
  className,
  onFocus,
  onBlur,
  ...rest
}: NoteFieldProps) {
  const ring = useFocusRing(onFocus, onBlur);

  return (
    <View
      className={cn('rounded-tile bg-surface', ring.className, className)}
      style={{
        minHeight,
        paddingVertical: padding.vertical - ring.border,
        paddingHorizontal: padding.horizontal - ring.border,
      }}
    >
      <TextInput
        {...rest}
        {...ring.handlers}
        multiline
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.inkGhost}
        selectionColor={colors.brand}
        textAlignVertical="top"
        style={[
          INPUT_RESET,
          {
            flex: 1,
            fontFamily: FONT_FAMILY[weight],
            fontSize,
            lineHeight,
            color: muted ? colors.inkTrace : colors.ink,
          },
        ]}
      />
    </View>
  );
}

export interface TagInputProps {
  /** Committed tags, each rendered as a removable brand pill. */
  tags: readonly string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  /** Field height: 170 in onboarding, 190 on the settings page. */
  minHeight?: number;
  className?: string;
}

/**
 * `min-height:170px · radius:24px · inset 0 0 0 2px #2F7CF6 · padding:14px` —
 * the "type and press enter" interests field.
 *
 * Return commits the draft; backspace on an empty draft takes the last tag
 * back, which is what every tag field people have used before them does.
 */
export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  minHeight = 170,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const ring = useFocusRing();

  const commit = () => {
    const tag = draft.trim();
    setDraft('');
    if (tag && !tags.includes(tag)) onAdd(tag);
  };

  return (
    <View
      className={cn('shrink-0 rounded-panel bg-surface', ring.className, className)}
      style={{ minHeight, padding: 14 - ring.border }}
    >
      <View className="flex-row flex-wrap items-center gap-[8px]">
        {tags.map((tag) => (
          <Chip key={tag} label={tag} size="tag" tone="brand" onRemove={() => onRemove(tag)} />
        ))}
        <TextInput
          {...ring.handlers}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && draft === '' && tags.length > 0) {
              onRemove(tags[tags.length - 1]!);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : undefined}
          placeholderTextColor={colors.inkGhost}
          selectionColor={colors.brand}
          blurOnSubmit={false}
          returnKeyType="done"
          autoCorrect={false}
          style={[
            INPUT_RESET,
            {
              minWidth: 80,
              flexGrow: 1,
              paddingVertical: 9,
              fontFamily: FONT_FAMILY[400],
              fontSize: 16,
            },
          ]}
        />
      </View>
    </View>
  );
}

export interface FieldLabelProps {
  children: string;
  className?: string;
}

/** `12.5px/600 · .14em tracking` — the small-caps label above an input. */
export function FieldLabel({ children, className }: FieldLabelProps) {
  return (
    <Text
      weight={600}
      className={cn('shrink-0 text-[12.5px] tracking-[1.75px] text-ink-dim', className)}
    >
      {children}
    </Text>
  );
}
