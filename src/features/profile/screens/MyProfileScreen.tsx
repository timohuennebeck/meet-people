import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { usePreferences } from '@shared/data/usePreferences';
import { useViewer } from '@shared/data/useViewer';
import { colors } from '@shared/theme/tokens';
import { Button, CircleButton, Glyph, SealNote, Text } from '@shared/ui';

import { useProfileViewCount } from '../data/useUsers';
import { ProfileHeader, ProfileInterests } from '../ui/ProfileHeader';

/**
 * "3 pessoas viram seu perfil esta semana" — the first thing on your own
 * profile.
 *
 * Drawn as the same tinted panel as the `SealNote` further down the same
 * scroll view: `radius:20px · #F7F9FC · padding:16px 14px` with a 34px glyph
 * leading it. A `ListRow` would have been the closer fit for a tappable row,
 * but it draws its chevron unconditionally, and the one state this row has to
 * get right is the one where there is nothing to tap.
 *
 * Zero is said rather than hidden. A row that only appears once somebody has
 * looked would make its own absence the news, and "ninguém" is a true and
 * un-anxious answer; it simply stops being a link, since there is no list.
 */
function ProfileViewsRow({ count, onPress }: { count: number; onPress: () => void }) {
  const { t } = useTranslation();

  const panel = (
    <View className="flex-row items-center gap-[12px] rounded-well bg-surface-app px-[16px] py-[14px]">
      <View className="h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand-mist">
        <Glyph.EyeGlyph size={18} color={colors.brand} />
      </View>
      <Text weight={500} className="flex-1 text-[14.5px] leading-[20.3px] text-ink-body">
        {count > 0 ? t('profile.views.row', { count }) : t('profile.views.none')}
      </Text>
      {count > 0 ? <Glyph.ChevronRight size={13} /> : null}
    </View>
  );

  if (count === 0) return panel;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-60">
      {panel}
    </Pressable>
  );
}

/** The Profile tab: the signed-in user's own profile, with settings behind the overflow. */
export function MyProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: me } = useViewer();
  const { data: preferences } = usePreferences();
  const { data: viewCount } = useProfileViewCount();

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
        {/* Held back until the count has actually arrived, so the row does not
            land on "ninguém" for a moment and then change its mind. */}
        {viewCount === undefined ? null : (
          <ProfileViewsRow count={viewCount} onPress={() => router.push('/profile-views')} />
        )}

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
