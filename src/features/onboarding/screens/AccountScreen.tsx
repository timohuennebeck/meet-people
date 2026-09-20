import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { gradients } from '@shared/theme/tokens';
import { Button, Glyph, Mascot, Spacer, Text } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** The legal line pinned to the foot of both account screens. */
function LegalNote() {
  const { t } = useTranslation();

  return (
    <Text className="text-center text-[13.5px] leading-[20.25px] text-ink-ghost">
      {t('onboarding.account.legalPrefix')}{' '}
      <Text weight={500} className="text-[13.5px] text-ink-body underline">
        {t('onboarding.account.terms')}
      </Text>{' '}
      {t('onboarding.account.legalJoin')}{' '}
      <Text weight={500} className="text-[13.5px] text-ink-body underline">
        {t('onboarding.account.privacy')}
      </Text>
      {t('onboarding.account.legalSuffix')}
    </Text>
  );
}

/** Step 7 — create or restore an account. Mascot card, e-mail first, Google below. */
export function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepLayout
      step={STEPS.account}
      title={t('onboarding.account.title')}
      subtitle={t('onboarding.account.subtitle')}
      footer={<LegalNote />}
    >
      <LinearGradient
        colors={gradients.photo}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        className="mt-[20px] h-[288px] shrink-0 items-center justify-center rounded-[28px]"
      >
        <Mascot size={172} />
      </LinearGradient>

      <View className="mt-[20px] shrink-0 gap-[12px]">
        <Button
          label={t('onboarding.account.withEmail')}
          icon={<Glyph.EnvelopeGlyph size={19} />}
          onPress={() => router.push('/(onboarding)/sign-up')}
        />
        <Button
          label={t('onboarding.account.withGoogle')}
          variant="secondaryTall"
          icon={<Glyph.GoogleGlyph size={19} />}
          onPress={() => router.push('/(onboarding)/confirmation')}
        />
      </View>

      <Spacer />
    </StepLayout>
  );
}
