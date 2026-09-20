import { Plus } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { haptics } from '@shared/lib/haptics';
import { colors } from '@shared/theme/tokens';
import { FONT_FAMILY, Glyph, Text } from '@shared/ui';

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

      <View
        className="shrink-0 flex-row items-center gap-[10px] px-[16px] pt-[10px]"
        style={{ paddingBottom: bottomInset }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.attach')}
          className="h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-surface-fill"
        >
          <Plus size={19} color={colors.inkBody} />
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          placeholder={placeholder}
          placeholderTextColor={colors.inkGhost}
          returnKeyType="send"
          className="h-[46px] min-w-0 flex-1 rounded-pill bg-surface-fill px-[18px] text-[15.5px] text-ink"
          style={{ fontFamily: FONT_FAMILY[400] }}
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
