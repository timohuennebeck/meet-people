import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AVATARS } from '@shared/data/fixtures';
import { gradients, gradientStops } from '@shared/theme/tokens';
import { Avatar, Button, CheckLine, Mascot, Screen, Text, VerifiedSeal } from '@shared/ui';

/** The full-page confirmation shown once the selfie review clears. */
export function VerificationSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const name = t('verification.success.badgeName');

  return (
    <Screen padding="hero">
      <LinearGradient
        colors={gradients.success}
        locations={gradientStops.success}
        className="absolute inset-0"
      />

      <View className="relative min-h-0 flex-1 items-center justify-center">
        <Mascot size={228} />
      </View>

      <View className="relative shrink-0">
        {/* The newly badged profile, overlapping the mascot slightly. */}
        <View className="-mt-[18px] flex-row items-center gap-[12px] rounded-tile border border-hair bg-surface py-[11px] pl-[11px] pr-[15px]">
          <Avatar uri={AVATARS.maraProfile} size={48} />
          <View className="min-w-0 flex-1 gap-[2px]">
            <View className="flex-row items-center gap-[7px]">
              <Text weight={600} className="text-[17px] tracking-[-0.17px]">
                {name}
              </Text>
              <VerifiedSeal size={20} />
            </View>
            <Text className="text-[13.5px] text-ink-ghost">
              {t('verification.success.badgeMeta')}
            </Text>
          </View>
        </View>

        <Text weight={600} className="mt-[18px] text-[32px] leading-[34.56px] tracking-[-1.024px]">
          {t('verification.success.title', { name })}
        </Text>

        <Text className="mt-[10px] text-[15.5px] leading-[22.5px] text-ink-dim">
          {t('verification.success.subtitle')}
        </Text>

        <View className="mt-[20px] gap-[10px]">
          <CheckLine variant="card">{t('verification.success.perkSealed')}</CheckLine>
          <CheckLine variant="card">{t('verification.success.perkHost')}</CheckLine>
        </View>

        <Button
          label={t('verification.success.action')}
          className="mt-[20px]"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </Screen>
  );
}
