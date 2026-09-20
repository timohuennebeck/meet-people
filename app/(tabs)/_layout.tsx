import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { useConversations } from '@features/chat/data/useChat';
import { colors } from '@shared/theme/tokens';

/**
 * The app's three destinations, rendered with the platform's own tab bar:
 * UIKit on iOS, Material on Android.
 *
 * Native tabs take platform icons rather than a JS icon set, so each trigger
 * names an SF Symbol and a Material icon. Phosphor is still used for every icon
 * inside a screen.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { data: conversations } = useConversations();

  const unread = (conversations ?? []).reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );

  return (
    <NativeTabs tintColor={colors.brand}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} drawable="ic_map" />
        <NativeTabs.Trigger.Label>{t('tabs.explore')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
          drawable="ic_chat"
        />
        <NativeTabs.Trigger.Label>{t('tabs.chats')}</NativeTabs.Trigger.Label>
        {unread > 0 ? <NativeTabs.Trigger.Badge>{String(unread)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.circle', selected: 'person.circle.fill' }}
          drawable="ic_person"
        />
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
