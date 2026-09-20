import { Pressable, View } from 'react-native';

import type { Conversation } from '@shared/data/schemas';
import { cn } from '@shared/lib/cn';
import { Avatar, CountBadge, PairAvatar, Text } from '@shared/ui';

export interface ConversationRowProps {
  conversation: Conversation;
  onPress?: () => void;
}

/** `56px avatar · 16.5px title · preview · time and unread count` — one thread. */
export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const isGroup = conversation.avatarUrls.length > 1;
  const unread = conversation.unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-[13px] py-[10px] active:opacity-60"
    >
      {isGroup ? (
        <PairAvatar
          size={56}
          primary={conversation.avatarUrls[0]!}
          secondary={conversation.avatarUrls[1]!}
          extra={conversation.extraMembers}
        />
      ) : (
        <View
          className={cn(
            'h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full',
            // Unread direct threads carry a brand ring around the avatar.
            unread && 'border-2 border-brand',
          )}
        >
          <Avatar uri={conversation.avatarUrls[0]!} size={52} />
        </View>
      )}

      <View className="min-w-0 flex-1 gap-[3px]">
        <Text weight={600} numberOfLines={1} className="text-[16.5px] tracking-[-0.165px]">
          {conversation.title}
        </Text>
        <Text
          weight={unread ? 600 : 400}
          numberOfLines={1}
          className={cn('text-[14.5px]', unread ? 'text-ink' : 'text-ink-dim')}
        >
          {conversation.preview}
        </Text>
      </View>

      <View className="shrink-0 items-end gap-[6px]">
        <Text className="text-[13px] text-ink-ghost">{conversation.timeLabel}</Text>
        {unread ? <CountBadge count={conversation.unreadCount} /> : null}
      </View>
    </Pressable>
  );
}
