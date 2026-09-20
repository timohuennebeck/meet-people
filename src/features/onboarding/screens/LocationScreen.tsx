import { useRouter } from 'expo-router';
import { EyeSlash, MapPinSimple } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { colors } from '@shared/theme/tokens';
import { Button, Mascot, Text, TextButton } from '@shared/ui';

/** `30px brand-tinted bubble · 15.5px body` — one reassurance line. */
function Benefit({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View className="flex-row items-start gap-[13px]">
      <View className="h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-tintAlt">
        {icon}
      </View>
      <Text className="flex-1 text-[15.5px] leading-[22.5px] text-ink-body">{children}</Text>
    </View>
  );
}

/** The location permission ask. */
export function LocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepScaffold
      position={STEPS.location}
      padding="stepWide"
      title={t('onboarding.location.title')}
      subtitle={t('onboarding.location.subtitle')}
      footer={
        <>
          <Button
            label={t('onboarding.location.allow')}
            onPress={() => router.push('/(onboarding)/radius')}
          />
          <TextButton
            label={t('onboarding.location.chooseNeighbourhood')}
            className="mt-[15px]"
            onPress={() => router.push('/(onboarding)/radius')}
          />
        </>
      }
    >
      <View className="min-h-0 flex-1 items-center justify-center">
        <Mascot size={160} />
      </View>

      <View className="mb-[22px] shrink-0 gap-[14px]">
        <Benefit icon={<MapPinSimple size={16} color={colors.brand} />}>
          {t('onboarding.location.benefitDistance')}
        </Benefit>
        <Benefit icon={<EyeSlash size={16} color={colors.brand} />}>
          {t('onboarding.location.benefitPrivacy')}
        </Benefit>
      </View>
    </StepScaffold>
  );
}
