import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOpenDirect } from '@features/chat/data/useChat';
import { isDataError } from '@shared/data/errors';
import { useViewer } from '@shared/data/useViewer';
import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { Button, CircleButton, Glyph, SealNote, Text } from '@shared/ui';

import { useRecordProfileView, useUser } from '../data/useUsers';
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
  const { data: me } = useViewer();
  const openDirect = useOpenDirect();
  const { mutate: recordView } = useRecordProfileView();
  const recorded = useRef(false);

  // A visit, not a render: the ref is what makes it once per mount, since the
  // effect re-runs as the two profiles arrive. Own profile is skipped here as
  // well as inside the function — there is no point in the round trip, and
  // waiting for `me` costs nothing because it is already cached by the profile
  // tab. Nothing is read back: the RPC returns void whether it recorded the
  // look or decided it was not one, and a call that never arrives leaves the
  // screen exactly as it is.
  useEffect(() => {
    if (recorded.current || !user || !me || user.id === me.id) return;
    recorded.current = true;
    recordView(user.id);
  }, [user, me, recordView]);

  if (!user) return <View className="flex-1 bg-surface" />;

  const onMessage = () => {
    if (openDirect.isPending) return;
    openDirect.mutate(user.id, {
      onSuccess: (conversationId) => router.push(`/chat/${conversationId}`),
      onError: (error) => {
        // A cold direct message is what Plus sells, so the paywall is the
        // answer rather than a sentence explaining it. Every other refusal
        // is read off the mutation below.
        if (isDataError(error) && error.code === 'PLUS_REQUIRED') {
          router.push('/(onboarding)/paywall');
        }
      },
    });
  };

  const refusal =
    isDataError(openDirect.error) && openDirect.error.code !== 'PLUS_REQUIRED'
      ? t(openDirect.error.messageKey)
      : null;

  return (
    <View className="flex-1 overflow-hidden bg-surface">
      <ProfileHeader
        user={user}
        // The design draws "Kreuzberg · 0,7 mi de você" here, but nothing
        // answers the second half: `distance_to` measures to a place, and
        // `profile_locations` keeps other people's points behind row-level
        // security precisely so a profile cannot be used to locate them. So the
        // line is the neighbourhood, as it already is on the viewer's own
        // profile, rather than a distance that was the same 0,7 mi for
        // everybody.
        locationLine={user.neighbourhood}
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

      {/* The design's `padding:12px 20px 30px · gap:10px` column draws only the
          invite; the message action is the second row that column already
          leaves room for. */}
      <View
        className="shrink-0 gap-[10px] px-[20px] pt-[12px]"
        style={{ paddingBottom: Math.max(30, insets.bottom) }}
      >
        <Button label={t('profile.invite')} variant="primaryCompact" />
        <Button
          label={t('profile.message')}
          variant="secondaryCompact"
          disabled={openDirect.isPending}
          onPress={onMessage}
        />
        {refusal ? <Text className="text-center text-[14px] text-ink-dim">{refusal}</Text> : null}
      </View>
    </View>
  );
}
