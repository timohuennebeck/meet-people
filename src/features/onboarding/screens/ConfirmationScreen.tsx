import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { VIEWER } from '@shared/data/fixtures';
import { STEPS } from '@shared/lib/steps';
import { Button, Mascot, Text, TextButton } from '@shared/ui';

/** Step 9 — a short confirmation once the account exists. */
export function ConfirmationScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepScaffold
      position={STEPS.confirmation}
      titleClassName="text-center"
      title={
        <>
          {t('onboarding.confirmation.titleLead')}{' '}
          <Text
            weight={600}
            className="rounded-[10px] bg-brand-tint px-[10px] text-[32px] leading-[34.56px] tracking-[-1.024px] text-brand"
          >
            {VIEWER.name}
          </Text>
          {t('onboarding.confirmation.titleTrail')}
        </>
      }
      footer={
        <>
          <Button
            label={t('common.continue')}
            onPress={() => router.push('/(onboarding)/widget')}
          />
          <TextButton label={t('onboarding.confirmation.manageAccount')} className="mt-[15px]" />
        </>
      }
    >
      <Text className="mt-[12px] shrink-0 text-center text-[15.5px] leading-[22.5px] text-ink-dim">
        {t('onboarding.confirmation.subtitle')}
      </Text>

      <View className="min-h-0 flex-1 items-center justify-center">
        <Mascot size={232} />
      </View>
    </StepScaffold>
  );
}
