import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useViewer } from '@shared/data/use-viewer';
import { useSession } from '@shared/providers/session-provider';
import { gradients, gradientStops } from '@shared/theme/tokens';
import {
  Avatar,
  Button,
  CheckLine,
  Mascot,
  Screen,
  StepSubtitle,
  StepTitle,
  Text,
  VerifiedSeal,
} from '@shared/ui';

/** The full-page confirmation shown once the selfie review clears. */
export function VerificationSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setVerified } = useSession();
  // The card under the mascot is the viewer's own profile, now badged — so it
  // has to be them. It named the fixture person and wore her face, and the
  // neighbourhood beside it was a city typed into the locale file.
  const { data: viewer } = useViewer();

  // Reaching this screen means the review cleared, so the badge is now held.
  useEffect(() => setVerified(true), [setVerified]);

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
          <Avatar uri={viewer?.avatarUrl ?? ''} size={48} />
          <View className="min-w-0 flex-1 gap-[2px]">
            <View className="flex-row items-center gap-[7px]">
              <Text weight={600} className="text-[17px] tracking-[-0.17px]">
                {viewer?.name ?? ''}
              </Text>
              <VerifiedSeal size={20} />
            </View>
            <Text className="text-[13.5px] text-ink-ghost">
              {viewer?.neighbourhood
                ? t('verification.success.badgeMeta', { neighbourhood: viewer.neighbourhood })
                : t('verification.success.badgeMetaPlain')}
            </Text>
          </View>
        </View>

        <StepTitle className="mt-[18px]">{t('verification.success.title', { name })}</StepTitle>

        <StepSubtitle className="mt-[10px]">{t('verification.success.subtitle')}</StepSubtitle>

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
