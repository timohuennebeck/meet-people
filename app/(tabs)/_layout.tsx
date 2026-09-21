import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { useUnreadCount } from '@shared/data/queries/use-chat';
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
  const unread = useUnreadCount();

  return (
    <NativeTabs tintColor={colors.brand}>
      <NativeTabs.Trigger name="index">
        {/* `app.background.dotted` ships a single weight — no `.fill` variant to
            swap in when the tab is selected, so one symbol covers both states. */}
        <NativeTabs.Trigger.Icon sf="app.background.dotted" drawable="ic_map" />
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
        {/* The filled symbol is the one asked for, in both states — selection
            still reads from the tab bar's tint. */}
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" drawable="ic_person" />
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
