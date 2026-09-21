import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';

import { Chip } from './chip';
import { FONT_FAMILY, Text, type FontWeight } from './text';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;

/**
 * Every field in the design draws a `1px #E6EBF3` ring at rest and an inset
 * `2px #2F7CF6` one while focused. A React Native border eats into the padding,
 * so compensating by the border width in both states keeps the text on the same
 * x and the field the same size as it gains its ring.
 */
function useFocusRing({
  onFocus,
  onBlur,
  enabled = true,
}: {
  onFocus?: FocusHandler;
  onBlur?: FocusHandler;
  /** False for the fields the design leaves ringless. */
  enabled?: boolean;
} = {}) {
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
  const ring = useFocusRing({ onFocus, onBlur, enabled: showRing });

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
  /**
   * The design's own padding, as stated — `padding:16px` on the request note,
   * `16px 18px` on the leave one. The inset ring's width is taken off it here,
   * so callers pass the design figure rather than pre-compensating it.
   */
  padding?: { vertical: number; horizontal: number };
  /** Greys the text, as the optional leave note is drawn. */
  muted?: boolean;
  /**
   * How many lines the field is drawn for before any text wraps. Only the web
   * build needs telling: there a multi-line input is a `<textarea>`, which
   * takes its height from its `rows` attribute — two lines unless it is told
   * otherwise — rather than from the text inside it. iOS measures the text, so
   * it starts at one line and grows as the note wraps either way.
   */
  lines?: number;
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
  padding = { vertical: 16, horizontal: 16 },
  muted = false,
  lines,
  minHeight = 118,
  fontSize = 17,
  lineHeight = 24.65,
  weight = 400,
  className,
  onFocus,
  onBlur,
  ...rest
}: NoteFieldProps) {
  const ring = useFocusRing({ onFocus, onBlur });

  // The wrapper's `minHeight` cannot stretch a `flex:1` child: a column with no
  // resolved height gives its children nothing to grow into, so the input can
  // measure to zero and the field looks empty. Sizing the input itself instead
  // lets the wrapper grow around it. The wrapper spends `padding.vertical` per
  // side whichever ring it draws — the compensation takes the border back out of
  // the padding — so the content box is exactly `minHeight - 2 * padding`.
  const contentHeight = Math.max(0, minHeight - padding.vertical * 2);

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
        numberOfLines={Platform.OS === 'web' ? lines : undefined}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.inkGhost}
        selectionColor={colors.brand}
        textAlignVertical="top"
        style={[
          INPUT_RESET,
          {
            minHeight: contentHeight,
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
  /** Most tags the field accepts; at the limit the input closes and Return does nothing. */
  max?: number;
  /** Longest tag it accepts, in characters. */
  maxLength?: number;
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
  max,
  maxLength,
  className,
}: TagInputProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const ring = useFocusRing();
  const full = max !== undefined && tags.length >= max;

  // Case-insensitive, like the database's unique index: "Café" and "café" are
  // one interest, and admitting both would spend the cap on a duplicate.
  const commit = () => {
    const tag = draft.trim();
    setDraft('');
    if (!tag || full) return;
    if (tags.some((entry) => entry.toLowerCase() === tag.toLowerCase())) return;
    onAdd(tag);
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
          editable={!full}
          maxLength={maxLength}
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
      {/* Pinned to the corner so it never takes part in the tag wrap. */}
      {max !== undefined ? (
        <Text className="absolute bottom-[12px] right-[14px] text-[13px] text-ink-ghost">
          {t('common.tagCount', { used: String(tags.length), max: String(max) })}
        </Text>
      ) : null}
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
