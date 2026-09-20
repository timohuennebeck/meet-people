import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PEOPLE, VIEWER } from '@shared/data/fixtures';
import { Avatar, CircleButton, Glyph, PairAvatar, Text } from '@shared/ui';

import { useConversations, useThread } from '../data/useChat';
import { useScriptedThread } from '../hooks/useScriptedThread';
import { nextDirectReply, nextGroupReply } from '../lib/scriptedReplies';
import { Composer } from '../ui/Composer';
import { MessageBubble } from '../ui/MessageBubble';
import { TypingIndicator } from '../ui/TypingIndicator';

/**
 * Whether the software keyboard is on screen.
 *
 * The composer sits on the home indicator's inset while the keyboard is down
 * and directly on the keyboard while it is up, so the thread has to know which
 * of the two it is padding for. iOS fires `will*`, which lands in the same
 * frame as the keyboard's own animation; Android only has `did*`.
 */
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

/** A conversation thread — 1:1 or group, which only changes the header and copy. */
export function ThreadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const keyboardVisible = useKeyboardVisible();

  const { id: conversationId } = useLocalSearchParams<{ id: string }>();

  const { data: conversations } = useConversations();
  const { data: messages } = useThread(conversationId);

  const conversation = conversations?.find((entry) => entry.id === conversationId);
  const isGroup = conversation?.kind === 'group';

  const thread = useScriptedThread(conversationId, isGroup ? nextGroupReply : nextDirectReply);

  // Keep the newest message in view as the thread grows, and again when the
  // keyboard takes half the screen — otherwise opening it leaves the reader
  // looking at the middle of the conversation.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, thread.typingAuthorId, keyboardVisible]);

  const quickReplies = isGroup
    ? [t('chat.quickWater'), t('chat.quickConfirmed'), t('chat.quickBike')]
    : [t('chat.quickAgreed'), t('chat.quickOnMyWay'), t('chat.quickLate')];

  const typingAuthor = thread.typingAuthorId ? PEOPLE[thread.typingAuthorId] : undefined;
  // The design glows the last bubble in the thread, and only when it is the
  // user's own — so in the group thread, where someone else spoke last, nothing
  // glows.
  const lastIndex = (messages ?? []).length - 1;

  return (
    // The thread does not use `Screen` — it runs its own header and a composer
    // pinned to the bottom edge, with no screen padding — so it brings its own
    // keyboard avoidance. `padding` shrinks the whole column by the keyboard's
    // height, which lifts the composer clear and leaves the message list to
    // scroll in what is left; Android resizes the window itself, so it needs
    // none. The route is a plain full-screen stack screen with no header and no
    // tab bar, so the view's top is the window's top and the offset is 0.
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View className="flex-1 overflow-hidden bg-surface">
        {/* Header: back, avatar(s), title and presence, overflow. */}
        <View
          className="shrink-0 flex-row items-center gap-[12px] px-[16px] pb-[12px]"
          style={{ paddingTop: Math.max(54, insets.top) }}
        >
          <CircleButton
            size={36}
            className="bg-surface-fill"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
          >
            <Glyph.ChevronLeft size={13} />
          </CircleButton>

          {isGroup && conversation.avatarUrls.length > 1 ? (
            <PairAvatar
              size={44}
              height={40}
              primary={conversation.avatarUrls[0]!}
              secondary={conversation.avatarUrls[1]!}
            />
          ) : (
            <View className="h-[42px] w-[42px] shrink-0">
              <Avatar uri={conversation?.avatarUrls[0] ?? ''} size={42} />
              {conversation?.online ? (
                // 12px green dot with a 2.5px white ring outside it.
                <View className="absolute -bottom-[3.5px] -right-[3.5px] h-[17px] w-[17px] rounded-full border-[2.5px] border-white bg-online" />
              ) : null}
            </View>
          )}

          <View className="min-w-0 flex-1 gap-[1px]">
            <Text weight={600} numberOfLines={1} className="text-[17px] tracking-[-0.17px]">
              {conversation?.title ?? ''}
            </Text>
            <Text className="text-[13px] text-ink-ghost">
              {isGroup
                ? t('chat.groupMembers', {
                    count: String(conversation.memberCount),
                    online: String(conversation.onlineCount),
                  })
                : t('chat.onlineNow')}
            </Text>
          </View>

          <CircleButton size={36} className="bg-surface-fill" accessibilityLabel={t('common.more')}>
            <Glyph.DotsVertical size={16} />
          </CircleButton>
        </View>

        <ScrollView
          ref={scrollRef}
          className="min-h-0 flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: isGroup ? 14 : 16,
            paddingBottom: 8,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
        >
          {(messages ?? []).map((message, index) => {
            const mine = message.authorId === VIEWER.id;
            const author = PEOPLE[message.authorId];
            return (
              <MessageBubble
                key={message.id}
                body={message.body}
                mine={mine}
                avatarUri={author?.avatarUrl}
                // Names label other people's bubbles in groups only.
                authorName={isGroup && !mine ? author?.name : undefined}
                receipt={message.receipt}
                highlighted={mine && index === lastIndex}
              />
            );
          })}

          {typingAuthor ? (
            <TypingIndicator
              avatarUri={typingAuthor.avatarUrl}
              authorName={isGroup ? typingAuthor.name : undefined}
            />
          ) : null}
        </ScrollView>

        <Composer
          value={thread.draft}
          onChangeText={thread.setDraft}
          onSend={() => thread.send()}
          onQuickReply={(reply) => thread.send(reply)}
          placeholder={isGroup ? t('chat.groupMessagePlaceholder') : t('chat.messagePlaceholder')}
          quickReplies={quickReplies}
          // 30px above the home indicator at rest, as the design draws it. With
          // the keyboard up there is no home indicator to clear and the
          // keyboard's own top edge is right there, so the composer sits close
          // to it instead of floating on a band of white.
          bottomInset={keyboardVisible ? 10 : Math.max(30, insets.bottom)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
