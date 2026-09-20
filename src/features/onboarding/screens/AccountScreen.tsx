import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { gradientAngles, gradients } from '@shared/theme/tokens';
import { Button, Glyph, Mascot, Spacer } from '@shared/ui';

import { LegalNote } from '../ui/LegalNote';

/** Step 7 — create or restore an account. Mascot card, e-mail first, Google below. */
export function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepScaffold
      position={STEPS.account}
      title={t('onboarding.account.title')}
      subtitle={t('onboarding.account.subtitle')}
      footer={<LegalNote />}
    >
      <LinearGradient
        colors={gradients.photo}
        {...gradientAngles.photo}
        className="mt-[20px] h-[288px] shrink-0 items-center justify-center rounded-[28px]"
      >
        <Mascot size={172} />
      </LinearGradient>

      <View className="mt-[20px] shrink-0 gap-[12px]">
        <Button
          label={t('onboarding.account.withEmail')}
          variant="primaryTall"
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
    </StepScaffold>
  );
}
