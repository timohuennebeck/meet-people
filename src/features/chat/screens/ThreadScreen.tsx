import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PEOPLE, VIEWER } from '@shared/data/fixtures';
import { Avatar, CircleButton, Glyph, PairAvatar, Text } from '@shared/ui';

import { useConversations, useThread } from '../data/useChat';
import { useScriptedThread } from '../hooks/useScriptedThread';
import { nextDirectReply, nextGroupReply } from '../lib/scriptedReplies';
import { Composer } from '../ui/Composer';
import { MessageBubble } from '../ui/MessageBubble';
import { TypingIndicator } from '../ui/TypingIndicator';

/** A conversation thread — 1:1 or group, which only changes the header and copy. */
export function ThreadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? 'c-sara';

  const { data: conversations } = useConversations();
  const { data: messages } = useThread(conversationId);

  const conversation = conversations?.find((entry) => entry.id === conversationId);
  const isGroup = conversation?.kind === 'group';

  const thread = useScriptedThread(conversationId, isGroup ? nextGroupReply : nextDirectReply);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, thread.typingAuthorId]);

  const quickReplies = isGroup
    ? [t('chat.quickWater'), t('chat.quickConfirmed'), t('chat.quickBike')]
    : [t('chat.quickAgreed'), t('chat.quickOnMyWay'), t('chat.quickLate')];

  const typingAuthor = thread.typingAuthorId ? PEOPLE[thread.typingAuthorId] : undefined;
  const lastOwnIndex = (messages ?? []).findLastIndex((message) => message.authorId === VIEWER.id);

  return (
    <View className="flex-1 overflow-hidden bg-surface">
      {/* Header: back, avatar(s), title and presence, overflow. */}
      <View
        className="shrink-0 flex-row items-center gap-[12px] px-[16px] pb-[12px]"
        style={{ paddingTop: Math.max(54, insets.top) }}
      >
        <CircleButton size={36} className="bg-surface-fill" onPress={() => router.back()}>
          <Glyph.ChevronLeft size={13} />
        </CircleButton>

        {isGroup && conversation.avatarUrls.length > 1 ? (
          <PairAvatar
            size={44}
            primary={conversation.avatarUrls[0]!}
            secondary={conversation.avatarUrls[1]!}
          />
        ) : (
          <View className="h-[42px] w-[42px] shrink-0">
            <Avatar uri={conversation?.avatarUrls[0] ?? ''} size={42} />
            {conversation?.online ? (
              <View className="absolute -bottom-[1px] -right-[1px] h-[12px] w-[12px] rounded-full border-[2.5px] border-white bg-online" />
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

        <CircleButton size={36} className="bg-surface-fill">
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
              highlighted={mine && index === lastOwnIndex}
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
        bottomInset={insets.bottom}
      />
    </View>
  );
}
