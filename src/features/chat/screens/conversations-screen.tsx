import { useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { colors } from '@shared/theme/tokens';
import { CircleButton, Glyph, Screen, SectionLabel, Text, TextField } from '@shared/ui';

import { useConversations, useUnreadCount } from '../data/use-chat';
import { ConversationRow } from '../ui/conversation-row';

/** The Chats tab: every plan conversation the user is part of. */
export function ConversationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: conversations } = useConversations();

  const unreadMessages = useUnreadCount();
  const [query, setQuery] = useState('');

  // Title and last message both, so searching for a name finds the thread it
  // was said in as well as the plan it belongs to.
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations ?? [];
    return (conversations ?? []).filter((conversation) =>
      `${conversation.title} ${conversation.preview}`.toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  return (
    <Screen className="bg-surface">
      <View className="shrink-0 flex-row items-center justify-between">
        <Text weight={600} className="text-[30px] tracking-[-0.96px]">
          {t('chat.tabTitle')}
        </Text>
        {/* A new conversation starts with a person, not a plan, so the + opens
            people search rather than the create-plan flow. */}
        <CircleButton
          size={40}
          accessibilityLabel={t('search.title')}
          onPress={() => router.push('/search')}
        >
          <Glyph.PlusGlyph size={17} color={colors.brand} strokeWidth={2.2} />
        </CircleButton>
      </View>

      <TextField
        className="mt-[16px] rounded-pill bg-surface-fill"
        ring={false}
        height={46}
        radius={999}
        fontSize={15.5}
        paddingHorizontal={18}
        value={query}
        onChangeText={setQuery}
        placeholder={t('chat.searchPlaceholder')}
        autoCorrect={false}
        clearButtonMode="while-editing"
        leading={<MagnifyingGlass size={20} color={colors.inkGhost} />}
      />

      <View className="mt-[22px] shrink-0 flex-row items-center justify-between">
        <SectionLabel>{t('chat.yourPlans')}</SectionLabel>
        {unreadMessages > 0 ? (
          <Text weight={600} className="text-[13.5px] text-brand">
            {t('chat.unreadCount', { count: unreadMessages })}
          </Text>
        ) : null}
      </View>

      <ScrollView className="mt-[6px] min-h-0 flex-1" showsVerticalScrollIndicator={false}>
        {matches.map((conversation) => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            onPress={() => router.push(`/chat/${conversation.id}`)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}
