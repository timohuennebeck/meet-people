import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { isDataError } from '@shared/data/errors';
import { useProfileViewCount, useProfileViewers } from '@shared/data/queries/use-users';
import { formatPastMoment } from '@shared/lib/datetime';
import { colors } from '@shared/theme/tokens';
import { Button, Glyph, NavHeader, PersonRow, Screen, Text } from '@shared/ui';

/**
 * What a free account is shown instead of the list.
 *
 * It says the true thing it is allowed to say — the count, which
 * `profile_view_count()` gives everybody — and then what Plus adds. There are
 * no blurred faces: the point of the count is that it is real, and a row of
 * invented silhouettes would make the number look invented too.
 */
function PlusPrompt({ count, onPress }: { count: number; onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <View className="mt-[40px] items-center gap-[12px]">
      <View className="h-[64px] w-[64px] items-center justify-center rounded-full bg-brand-mist">
        <Glyph.EyeGlyph size={30} color={colors.brand} />
      </View>
      <Text weight={600} className="text-center text-[19px] tracking-[-0.38px]">
        {t('profile.views.lockedCount', { count })}
      </Text>
      <Text className="text-center text-[15px] leading-[21px] text-ink-dim">
        {t('profile.views.lockedBody')}
      </Text>
      <Button
        label={t('profile.views.lockedAction')}
        variant="primaryCompact"
        className="mt-[14px]"
        onPress={onPress}
      />
    </View>
  );
}

/**
 * Who looked at your profile, newest first.
 *
 * Three answers share one screen, and which one shows is decided by the query
 * rather than by the screen guessing: the list, the refusal that opens the
 * paywall, and nobody at all. Nothing renders in the body until one of them is
 * settled — an empty state shown over a read still in flight is a sentence the
 * screen has to take back a moment later.
 */
export function ProfileViewersScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: viewers, error, isPending } = useProfileViewers();
  const { data: count } = useProfileViewCount();

  // The one refusal that is an answer. Every other failure leaves the body
  // empty rather than claiming nobody looked.
  const locked = isDataError(error) && error.code === 'PLUS_REQUIRED';

  if (locked) {
    return (
      <Screen className="bg-surface">
        <NavHeader title={t('profile.views.navTitle')} onBack={() => router.back()} />
        <PlusPrompt count={count ?? 0} onPress={() => router.push('/(onboarding)/paywall')} />
      </Screen>
    );
  }

  const people = viewers ?? [];

  return (
    <Screen className="bg-surface">
      <NavHeader title={t('profile.views.navTitle')} onBack={() => router.back()} />

      <ScrollView
        className="mt-[22px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {people.map(({ user, viewedAt }) => (
          <PersonRow
            key={user.id}
            size={50}
            avatarUri={user.avatarUrl}
            name={`${user.name}, ${user.age}`}
            detail={formatPastMoment(new Date(viewedAt), i18n.language)}
            verified={user.verified}
            onPress={() => router.push(`/people/${user.id}`)}
          />
        ))}

        {!isPending && !error && people.length === 0 ? (
          <Text className="mt-[24px] text-center text-[15px] leading-[21px] text-ink-dim">
            {t('profile.views.none')}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
