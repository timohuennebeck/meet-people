import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@features/settings/data/usePreferences';
import { colors, gradients, gradientStops } from '@shared/theme/tokens';
import {
  Button,
  Chip,
  CircleButton,
  FlaggedAvatar,
  Glyph,
  SealNote,
  SectionLabel,
  Text,
  VerifiedSeal,
  flagUri,
} from '@shared/ui';

import { useMe } from '../data/useUsers';

/** The Profile tab: the signed-in user's own profile, with settings behind the gear. */
export function MyProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const { data: preferences } = usePreferences();

  if (!me) return <View className="flex-1 bg-surface" />;

  return (
    <View className="flex-1 overflow-hidden bg-surface">
      <View className="shrink-0">
        <LinearGradient
          colors={gradients.profile}
          locations={gradientStops.profile}
          className="absolute inset-0"
        />
        <View className="px-[20px] pb-[20px]" style={{ paddingTop: Math.max(58, insets.top) }}>
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

          <View className="mt-[18px] flex-row items-center gap-[16px]">
            <FlaggedAvatar uri={me.avatarUrl} flagUri={flagUri(me.countryCode ?? 'es')} size={92} />
            <View className="min-w-0 flex-1 gap-[5px]">
              <View className="flex-row items-center gap-[7px]">
                <Text weight={600} className="text-[27px] tracking-[-0.81px]">
                  {me.name}, {me.age}
                </Text>
                {me.verified ? <VerifiedSeal size={22} /> : null}
              </View>
              <Text className="text-[15px] text-ink-body">{me.neighbourhood}</Text>
              <Text className="text-[14px] text-ink-dim">{t('profile.tenureLine')}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="min-h-0 flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, gap: 18, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-[10px]">
          <SectionLabel>{t('profile.interests')}</SectionLabel>
          <View className="flex-row flex-wrap gap-[8px]">
            {(preferences?.interests ?? me.interests).map((interest) => (
              <Chip key={interest} label={interest} size="soft" tone="fill" />
            ))}
          </View>
        </View>

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
