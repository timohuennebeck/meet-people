import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { Button, CircleButton, Glyph, SealNote, Text } from '@shared/ui';

import { useUser } from '../data/useUsers';
import { ProfileHeader, ProfileInterests } from '../ui/ProfileHeader';

/** `radius:18px · #F7F9FC` tile — one of the three stats under the header. */
function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View className="flex-1 gap-[2px] rounded-field bg-surface-app px-[14px] py-[12px]">
      <Text weight={600} className={cn('text-[19px] tracking-[-0.38px]', accent && 'text-brand')}>
        {value}
      </Text>
      <Text className="text-[12.5px] text-ink-ghost">{label}</Text>
    </View>
  );
}

/** Another person's profile, with their home-country flag on the avatar. */
export function PersonProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user } = useUser(id ?? '');

  if (!user) return <View className="flex-1 bg-surface" />;

  return (
    <View className="flex-1 overflow-hidden bg-surface">
      <ProfileHeader
        user={user}
        locationLine={t('profile.distanceLine', {
          neighbourhood: user.neighbourhood,
          distance: '0,7 mi',
        })}
        actions={
          <View className="flex-row items-center justify-between">
            <CircleButton
              size={40}
              className="bg-white/75"
              accessibilityLabel={t('common.back')}
              onPress={() => router.back()}
            >
              <Glyph.ChevronLeft size={13} />
            </CircleButton>
            {/* The overflow the design draws is a menu, and reporting is the
                one thing it will ever hold that exists today (§9 of the
                database plan lists block and report as the pair). Until the
                block half has somewhere to be stored, the glyph goes straight
                to the report flow rather than opening a menu of one. */}
            <CircleButton
              size={40}
              className="bg-white/75"
              accessibilityLabel={t('safety.report.navTitle')}
              onPress={() => router.push(`/report/${user.id}`)}
            >
              <Glyph.DotsVertical size={17} color={colors.inkStrong} />
            </CircleButton>
          </View>
        }
      />

      <ScrollView
        className="min-h-0 flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-[10px]">
          <Stat value={String(user.plansCount ?? 0)} label={t('profile.statPlans')} />
          <Stat value={String(user.sharedPlansCount ?? 0)} label={t('profile.statShared')} />
          <Stat value={`${user.attendanceRate ?? 0}%`} label={t('profile.statAttendance')} accent />
        </View>

        {user.bio ? (
          <Text className="text-[16px] leading-[24px] text-ink-body">{user.bio}</Text>
        ) : null}

        <ProfileInterests interests={user.interests} />

        <SealNote>{t('profile.verifiedNote')}</SealNote>
      </ScrollView>

      <View
        className="shrink-0 px-[20px] pt-[12px]"
        style={{ paddingBottom: Math.max(30, insets.bottom) }}
      >
        <Button label={t('profile.invite')} variant="primaryCompact" />
      </View>
    </View>
  );
}
