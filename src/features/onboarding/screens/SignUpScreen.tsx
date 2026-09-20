import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { Button, Caret, Glyph, Spacer, Text } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** `12.5px/600 · .14em tracking` — the field label above each input. */
function FieldLabel({ children, className }: { children: string; className?: string }) {
  return (
    <Text
      weight={600}
      className={cn('shrink-0 text-[12.5px] tracking-[1.75px] text-ink-dim', className)}
    >
      {children}
    </Text>
  );
}

/** Four segments that fill as the password gets stronger; three are lit here. */
function StrengthMeter({ filled }: { filled: number }) {
  return (
    <View className="mt-[12px] shrink-0 flex-row items-center gap-[6px]">
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          className={cn(
            'h-[5px] flex-1 rounded-[3px]',
            index < filled ? 'bg-brand' : 'bg-hair-rail',
          )}
        />
      ))}
    </View>
  );
}

/** Step 8 — e-mail and password, with the keyboard up. */
export function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepLayout
      step={STEPS.signUp}
      padding="form"
      title={t('onboarding.signUp.title')}
      subtitle={t('onboarding.signUp.subtitle')}
    >
      <FieldLabel className="mt-[24px]">{t('onboarding.account.emailLabel')}</FieldLabel>
      <View className="mt-[9px] h-[62px] shrink-0 flex-row items-center rounded-field border-2 border-brand bg-surface px-[16px]">
        <Text className="text-[17px]">mara.k@mail.com</Text>
        <Caret height={22} gap={2} />
      </View>

      <FieldLabel className="mt-[18px]">{t('onboarding.account.passwordLabel')}</FieldLabel>
      <View className="mt-[9px] h-[62px] shrink-0 flex-row items-center gap-[12px] rounded-field border border-hair bg-surface px-[18px]">
        <Text className="flex-1 text-[20px] tracking-[6.4px] text-ink-body">••••••••</Text>
        <Glyph.EyeGlyph size={21} color={colors.inkDim} />
      </View>

      <StrengthMeter filled={3} />

      <View className="mt-[9px] shrink-0 flex-row items-center justify-between">
        <Text className="text-[14px] text-ink-dim">{t('onboarding.signUp.strength')}</Text>
        <Text weight={600} className="text-[14px] text-brand">
          {t('onboarding.signUp.strong')}
        </Text>
      </View>

      <Button
        label={t('onboarding.account.createAccount')}
        className="mt-[20px]"
        onPress={() => router.push('/(onboarding)/confirmation')}
      />

      <Pressable accessibilityRole="button" className="mt-[14px] shrink-0">
        <Text className="text-center text-[15.5px] text-ink-body">
          {t('onboarding.signUp.haveAccount')}{' '}
          <Text weight={600} className="text-[15.5px] text-brand">
            {t('onboarding.signUp.signIn')}
          </Text>
        </Text>
      </Pressable>

      <Spacer />
    </StepLayout>
  );
}
