import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, gradientStops } from '@shared/theme/tokens';
import {
  flagUri,
  Button,
  Chip,
  CircleButton,
  FlaggedAvatar,
  Glyph,
  SealNote,
  SectionLabel,
  Text,
  VerifiedSeal,
} from '@shared/ui';

import { useUser } from '../data/useUsers';

/** `radius:18px · #F7F9FC` tile — one of the three stats under the header. */
function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View className="flex-1 gap-[2px] rounded-field bg-surface-app px-[14px] py-[12px]">
      <Text
        weight={600}
        className={
          accent ? 'text-[19px] tracking-[-0.38px] text-brand' : 'text-[19px] tracking-[-0.38px]'
        }
      >
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
      {/* Header block, washed with the brand gradient. */}
      <View className="shrink-0">
        <LinearGradient
          colors={gradients.profile}
          locations={gradientStops.profile}
          className="absolute inset-0"
        />
        <View className="px-[20px] pb-[20px]" style={{ paddingTop: Math.max(58, insets.top) }}>
          <View className="flex-row items-center justify-between">
            <CircleButton size={40} className="bg-white/75" onPress={() => router.back()}>
              <Glyph.ChevronLeft size={13} />
            </CircleButton>
            <CircleButton size={40} className="bg-white/75">
              <Glyph.DotsVertical size={17} color={colors.inkStrong} />
            </CircleButton>
          </View>

          <View className="mt-[18px] flex-row items-center gap-[16px]">
            <FlaggedAvatar
              uri={user.avatarUrl}
              flagUri={flagUri(user.countryCode ?? 'es')}
              size={92}
            />
            <View className="min-w-0 flex-1 gap-[5px]">
              <View className="flex-row items-center gap-[7px]">
                <Text weight={600} className="text-[27px] tracking-[-0.81px]">
                  {user.name}, {user.age}
                </Text>
                {user.verified ? <VerifiedSeal size={22} /> : null}
              </View>
              <Text className="text-[15px] text-ink-body">
                {t('profile.distanceLine', {
                  neighbourhood: user.neighbourhood,
                  distance: '0,7 mi',
                })}
              </Text>
              <Text className="text-[14px] text-ink-dim">{t('profile.tenureLine')}</Text>
            </View>
          </View>
        </View>
      </View>

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

        <View className="gap-[10px]">
          <SectionLabel>{t('profile.interests')}</SectionLabel>
          <View className="flex-row flex-wrap gap-[8px]">
            {user.interests.map((interest) => (
              <Chip key={interest} label={interest} size="soft" tone="fill" />
            ))}
          </View>
        </View>

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
