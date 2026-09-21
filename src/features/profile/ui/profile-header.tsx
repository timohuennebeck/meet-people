import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { User } from '@shared/data/schemas';
import { formatMonthYear } from '@shared/lib/datetime';
import { gradients, gradientStops } from '@shared/theme/tokens';
import { Chip, FlaggedAvatar, SectionLabel, Text, VerifiedSeal, flagUri } from '@shared/ui';

export interface ProfileHeaderProps {
  user: User;
  /** The row of buttons above the avatar — back and overflow, or just one. */
  actions: ReactNode;
  /**
   * The line under the name. Another person's profile shows their distance;
   * the viewer's own shows just their neighbourhood.
   */
  locationLine: string;
}

/**
 * The washed header both profile screens open with: a gradient, an action row,
 * then the flagged avatar beside the name, location and tenure.
 */
export function ProfileHeader({ user, actions, locationLine }: ProfileHeaderProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="shrink-0">
      <LinearGradient
        colors={gradients.profile}
        locations={gradientStops.profile}
        className="absolute inset-0"
      />
      <View className="px-[20px] pb-[20px]" style={{ paddingTop: Math.max(58, insets.top) }}>
        {actions}

        <View className="mt-[18px] flex-row items-center gap-[16px]">
          {/* The country is optional on a profile, and an absent one draws no
              flag: defaulting it made every such person Spanish. */}
          <FlaggedAvatar
            uri={user.avatarUrl}
            flagUri={user.countryCode ? flagUri(user.countryCode) : undefined}
            size={92}
          />
          <View className="min-w-0 flex-1 gap-[5px]">
            <View className="flex-row items-center gap-[7px]">
              <Text weight={600} className="text-[27px] tracking-[-0.81px]">
                {user.name}, {user.age}
              </Text>
              {user.verified ? <VerifiedSeal size={22} /> : null}
            </View>
            <Text className="text-[15px] text-ink-body">{locationLine}</Text>
            {/* The design writes "No app desde março · responde em ~2 h" here.
                Nothing measures a reply time — no column, no view — so the
                line keeps the half the profile row does answer. */}
            <Text className="text-[14px] text-ink-dim">
              {t('profile.tenureLine', {
                month: formatMonthYear(new Date(user.joinedAt), i18n.language),
              })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** The interests chip group both profiles render under the header. */
export function ProfileInterests({ interests }: { interests: readonly string[] }) {
  const { t } = useTranslation();

  return (
    <View className="gap-[10px]">
      <SectionLabel>{t('profile.interests')}</SectionLabel>
      <View className="flex-row flex-wrap gap-[8px]">
        {interests.map((interest) => (
          <Chip key={interest} label={interest} size="soft" tone="fill" />
        ))}
      </View>
    </View>
  );
}
