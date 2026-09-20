import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { usePreferences } from '@features/settings/data/usePreferences';
import { colors } from '@shared/theme/tokens';
import { Button, CircleButton, Glyph, SealNote } from '@shared/ui';

import { useMe } from '../data/useUsers';
import { ProfileHeader, ProfileInterests } from '../ui/ProfileHeader';

/** The Profile tab: the signed-in user's own profile, with settings behind the overflow. */
export function MyProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: me } = useMe();
  const { data: preferences } = usePreferences();

  if (!me) return <View className="flex-1 bg-surface" />;

  return (
    <View className="flex-1 overflow-hidden bg-surface">
      <ProfileHeader
        user={me}
        locationLine={me.neighbourhood}
        actions={
          <View className="flex-row items-center justify-end">
            <CircleButton
              size={40}
              className="bg-white/75"
              accessibilityLabel={t('settings.title')}
              onPress={() => router.push('/settings')}
            >
              <Glyph.DotsVertical size={17} color={colors.inkStrong} />
            </CircleButton>
          </View>
        }
      />

      <ScrollView
        className="min-h-0 flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, gap: 18, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileInterests interests={preferences?.interests ?? me.interests} />

        <SealNote>{t('profile.verifiedNote')}</SealNote>

        <Button
          label={t('settings.title')}
          variant="secondaryTall"
          onPress={() => router.push('/settings')}
        />
      </ScrollView>
    </View>
  );
}
