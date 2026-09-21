import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Plus } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { haptics } from '@shared/lib/haptics';
import { colors } from '@shared/theme/tokens';
import { FONT_FAMILY, Glyph, Text } from '@shared/ui';

/**
 * One photo out of the library, uncropped — a chat attachment is not a portrait,
 * so unlike the onboarding photo step this one does not force a square.
 */
const PICK = {
  mediaTypes: ['images'],
  quality: 0.9,
} satisfies ImagePicker.ImagePickerOptions;

/**
 * React Native pads a `TextInput` on its own — Android reserves room around the
 * glyphs and both platforms add vertical padding — so a single line drifts off
 * the centre of a field that was given a fixed height. Zeroing that and handing
 * the input its own height, its font size and (for Android) an explicit vertical
 * alignment centres the text and the placeholder. This is the same reset
 * `TextField` in `@shared/ui` applies; the composer's field is not a `TextField`
 * (see the note on the row below), so it repeats it here.
 */
const INPUT = {
  margin: 0,
  paddingVertical: 0,
  includeFontPadding: false,
  textAlignVertical: 'center',
  // `height:46px · padding:0 18px · 15.5px`, as the design states the field.
  height: 46,
  paddingHorizontal: 18,
  fontFamily: FONT_FAMILY[400],
  fontSize: 15.5,
} as const;

export interface ComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  /** One-tap replies above the input; tapping one sends it immediately. */
  quickReplies: readonly string[];
  onQuickReply: (reply: string) => void;
  /**
   * Padding under the composer. The caller resolves it, because what it has to
   * clear changes: the home indicator at rest, the keyboard's top edge once the
   * field has focus.
   */
  bottomInset: number;
}

/** The quick replies, attachment button, text field and send button. */
export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
  quickReplies,
  onQuickReply,
  bottomInset,
}: ComposerProps) {
  const { t } = useTranslation();
  const canSend = value.trim().length > 0;

  // The picked photo waits here. Nothing consumes it yet: `messages` holds text
  // only (docs/database.md §3.6), so there is no image message to send it as —
  // it stays pending until the × clears it.
  const [attachment, setAttachment] = useState<string | null>(null);
  const [pickFailed, setPickFailed] = useState(false);

  const attachPhoto = async () => {
    // As on the onboarding photo step: iOS hands over one picked photo without
    // any library permission at all, so none is asked for here.
    try {
      const result = await ImagePicker.launchImageLibraryAsync(PICK);
      if (result.canceled) return;
      const picked = result.assets[0];
      if (!picked) return;
      setAttachment(picked.uri);
      setPickFailed(false);
    } catch (error) {
      console.warn('Could not open the photo library', error);
      setPickFailed(true);
    }
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="shrink-0 grow-0"
        // `alignItems` matters: a horizontal ScrollView stretches its children
        // to the full height of the row by default, which pulls the pills into
        // tall capsules instead of letting them hug their label.
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          gap: 8,
        }}
      >
        {quickReplies.map((reply) => (
          <Pressable
            key={reply}
            accessibilityRole="button"
            onPress={() => {
              haptics.select();
              onQuickReply(reply);
            }}
            // `inset 0 0 0 1px #E1E7F0`, so the padding drops by the border width.
            className="shrink-0 rounded-pill border border-hair-tag bg-surface px-[13px] py-[8px] active:opacity-60"
          >
            <Text className="text-[14px] text-ink-body">{reply}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {attachment ? (
        <View className="shrink-0 px-[16px] pt-[10px]">
          <View className="h-[64px] w-[64px]">
            <Image
              source={{ uri: attachment }}
              className="h-full w-full rounded-field"
              contentFit="cover"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('chat.removeAttachment')}
              onPress={() => setAttachment(null)}
              className="absolute -right-[7px] -top-[7px] h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-surface bg-ink"
            >
              <Glyph.CloseSmall size={9} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {pickFailed ? (
        <Text className="shrink-0 px-[16px] pt-[10px] text-[13px] text-danger">
          {t('chat.attachFailed')}
        </Text>
      ) : null}

      {/*
        The design puts the attach and send buttons beside the field rather than
        inside it, so this row is three siblings and not a `TextField` with its
        `leading`/`accessory` slots. The field itself stays a bare `TextInput`
        for the same reason `TextField` cannot serve it: it hides the input's
        `style` and `className`, and sets no text colour, so the design's
        `#15181F` could not be passed through. `INPUT` above carries its reset.
      */}
      <View
        className="shrink-0 flex-row items-center gap-[10px] px-[16px] pt-[10px]"
        style={{ paddingBottom: bottomInset }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.attach')}
          onPress={() => {
            haptics.tap();
            void attachPhoto();
          }}
          className="h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-surface-fill active:opacity-60"
        >
          <Plus size={19} color={colors.inkBody} />
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          placeholder={placeholder}
          placeholderTextColor={colors.inkGhost}
          selectionColor={colors.brand}
          returnKeyType="send"
          className="min-w-0 flex-1 rounded-pill bg-surface-fill text-ink"
          style={INPUT}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          disabled={!canSend}
          onPress={() => {
            haptics.commit();
            onSend();
          }}
          className={cn(
            'h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full',
            canSend ? 'bg-brand' : 'bg-[#C8D3E4]',
          )}
        >
          <Glyph.SendGlyph size={18} />
        </Pressable>
      </View>
    </>
  );
}
