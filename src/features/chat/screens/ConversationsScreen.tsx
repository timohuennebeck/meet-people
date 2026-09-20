import { useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { colors } from '@shared/theme/tokens';
import { CircleButton, Glyph, Screen, SectionLabel, Text } from '@shared/ui';

import { useConversations, useUnreadCount } from '../data/useChat';
import { ConversationRow } from '../ui/ConversationRow';

/** The Chats tab: every plan conversation the user is part of. */
export function ConversationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: conversations } = useConversations();

  const unreadMessages = useUnreadCount();

  return (
    <Screen className="bg-surface">
      <View className="shrink-0 flex-row items-center justify-between">
        <Text weight={600} className="text-[30px] tracking-[-0.96px]">
          {t('chat.tabTitle')}
        </Text>
        <CircleButton
          size={40}
          accessibilityLabel={t('common.newPlan')}
          onPress={() => router.push('/create')}
        >
          <Glyph.PlusGlyph size={17} color={colors.brand} strokeWidth={2.2} />
        </CircleButton>
      </View>

      <View className="mt-[16px] h-[46px] shrink-0 flex-row items-center gap-[10px] rounded-pill bg-surface-fill px-[18px]">
        <MagnifyingGlass size={20} color={colors.inkGhost} />
        <Text className="text-[15.5px] text-ink-ghost">{t('chat.searchPlaceholder')}</Text>
      </View>

      <View className="mt-[22px] shrink-0 flex-row items-center justify-between">
        <SectionLabel>{t('chat.yourPlans')}</SectionLabel>
        {unreadMessages > 0 ? (
          <Text weight={600} className="text-[13.5px] text-brand">
            {t('chat.unreadCount', { count: unreadMessages })}
          </Text>
        ) : null}
      </View>

      <ScrollView className="mt-[6px] min-h-0 flex-1" showsVerticalScrollIndicator={false}>
        {(conversations ?? []).map((conversation) => (
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
