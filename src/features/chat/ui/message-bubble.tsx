import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { shadows } from '@shared/theme/tokens';
import { Avatar, type Photo } from '@shared/ui/avatar';
import { Text } from '@shared/ui/text';

export interface MessageBubbleProps {
  body: string;
  /** True for the signed-in user's own messages. */
  mine: boolean;
  /**
   * Author avatar; omitted on own messages, which have no avatar. `null` is an
   * author who has not uploaded a photo, which still draws a face.
   */
  avatarUri?: Photo;
  /** Author name, shown above other people's bubbles in group threads only. */
  authorName?: string;
  /** Receipt line under the bubble, e.g. "Visto 9:24". */
  receipt?: string;
  /** Adds the brand glow the design puts on the newest sent bubble. */
  highlighted?: boolean;
}

/**
 * One chat bubble. Own messages sit right-aligned in brand blue with a squared
 * bottom-right corner; everyone else's sit left in grey with a squared
 * bottom-left corner.
 */
export function MessageBubble({
  body,
  mine,
  avatarUri,
  authorName,
  receipt,
  highlighted = false,
}: MessageBubbleProps) {
  return (
    <View className={cn('flex-row items-end gap-[8px]', mine ? 'justify-end' : 'justify-start')}>
      {!mine && avatarUri !== undefined ? (
        <Avatar uri={avatarUri} size={28} className="shrink-0" />
      ) : null}

      <View className={cn('max-w-[76%] gap-[3px]', mine ? 'items-end' : 'items-start')}>
        {authorName ? (
          <Text weight={600} className="pl-[4px] text-[12.5px] text-ink-dim">
            {authorName}
          </Text>
        ) : null}

        <View
          className={cn(
            'px-[15px] py-[11px]',
            mine
              ? 'rounded-[20px] rounded-br-[6px] bg-brand'
              : 'rounded-[20px] rounded-bl-[6px] bg-surface-fill',
          )}
          style={highlighted ? shadows.sentBubble : undefined}
        >
          <Text className={cn('text-[15.5px] leading-[22px]', mine && 'text-white')}>{body}</Text>
        </View>

        {receipt ? <Text className="px-[4px] text-[11.5px] text-ink-ghost">{receipt}</Text> : null}
      </View>
    </View>
  );
}
