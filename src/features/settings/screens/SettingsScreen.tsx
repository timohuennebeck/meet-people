import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { languageName } from '@shared/lib/languages';
import { useSession } from '@shared/providers/SessionProvider';
import {
  Flag,
  FlagStack,
  ListGroup,
  ListRow,
  NavHeader,
  Screen,
  SectionLabel,
  Text,
} from '@shared/ui';

import { usePreferences } from '../data/usePreferences';

/** `#EAF1FE` pill showing the account's verification state. */
function VerifiedPill({ label }: { label: string }) {
  return (
    <View className="rounded-pill bg-brand-tint px-[11px] py-[5px]">
      <Text weight={600} className="text-[13.5px] text-brand">
        {label}
      </Text>
    </View>
  );
}

/** A labelled group of settings rows. */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-[10px]">
      <SectionLabel className="tracking-[1.125px]">{label}</SectionLabel>
      <ListGroup>{children}</ListGroup>
    </View>
  );
}

/** Settings overview — every value at a glance, each row opening its own page. */
export function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useSession();
  const { data: preferences } = usePreferences();

  const languageCodes = (preferences?.spokenLanguages ?? []).map((language) => language.flag);
  const languageNames = (preferences?.spokenLanguages ?? [])
    .map((language) => languageName(language.code))
    .join(', ');

  return (
    <Screen>
      <NavHeader title={t('settings.title')} onBack={() => router.back()} />

      <ScrollView
        className="mt-[20px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 22, paddingBottom: 4 }}
        showsVerticalScrollIndicator={false}
      >
        <Group label={t('settings.groupDiscover')}>
          <ListRow
            label={t('settings.radius')}
            detail={t('settings.radiusDetail')}
            value={`${preferences?.radius ?? 2} ${preferences?.distanceUnit ?? 'mi'}`}
            onPress={() => router.push('/settings/radius')}
          />
          <ListRow
            divided
            label={t('settings.spokenLanguages')}
            accessory={
              <View className="shrink-0 flex-row items-center">
                <FlagStack codes={languageCodes} />
              </View>
            }
            value={languageNames}
            onPress={() => router.push('/settings/spoken-languages')}
          />
          <ListRow
            divided
            label={t('settings.interests')}
            value={t('settings.interestsValue', {
              count: preferences?.interests.length ?? 0,
            })}
            onPress={() => router.push('/settings/interests')}
          />
        </Group>

        <Group label={t('settings.groupApp')}>
          <ListRow
            label={t('settings.appLanguage')}
            accessory={<Flag code="pt" size={22} />}
            value="Português"
            onPress={() => router.push('/settings/app-language')}
          />
          <ListRow
            divided
            label={t('settings.notifications')}
            detail={t('settings.notificationsDetail')}
            value={t('settings.notificationsValue')}
          />
        </Group>

        <Group label={t('settings.groupAccount')}>
          <ListRow label={t('settings.accountSecurity')} value="sara@mail.com" />
          <ListRow
            divided
            label={t('settings.verificationBadge')}
            accessory={<VerifiedPill label={t('settings.verified')} />}
          />
          <ListRow divided label={t('settings.privacyHelp')} />
          <ListRow divided destructive label={t('settings.deleteAccount')} />
        </Group>

        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          className="items-center pb-[2px] pt-[4px]"
        >
          <Text weight={600} className="text-[15.5px] text-ink-body">
            {t('settings.signOut')}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
