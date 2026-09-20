import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { cn } from '@shared/lib/cn';
import { STEPS } from '@shared/lib/steps';
import { colors } from '@shared/theme/tokens';
import { Button, FieldLabel, Glyph, Spacer, Text, TextField } from '@shared/ui';

/** The label beside the meter, one per lit segment. */
const STRENGTH_LABEL = ['weak', 'weak', 'fair', 'good', 'strong'] as const;

/**
 * How many of the meter's four segments light up. Length carries most of the
 * weight, with a segment each for mixing in a digit and a symbol.
 */
function strengthOf(password: string): number {
  if (password.length === 0) return 0;
  let score = 1;
  if (password.length >= 8) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^\w\s]/.test(password)) score += 1;
  return score;
}

/** Four segments that fill as the password gets stronger. */
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const strength = strengthOf(password);

  return (
    <StepScaffold
      position={STEPS.signUp}
      padding="form"
      title={t('onboarding.signUp.title')}
      subtitle={t('onboarding.signUp.subtitle')}
    >
      <FieldLabel className="mt-[24px]">{t('onboarding.account.emailLabel')}</FieldLabel>
      <TextField
        className="mt-[9px] rounded-field"
        height={62}
        fontSize={17}
        value={email}
        onChangeText={setEmail}
        placeholder={t('onboarding.signUp.emailPlaceholder')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
      />

      <FieldLabel className="mt-[18px]">{t('onboarding.account.passwordLabel')}</FieldLabel>
      <TextField
        className="mt-[9px] gap-[12px] rounded-field"
        height={62}
        fontSize={17}
        value={password}
        onChangeText={setPassword}
        placeholder={t('onboarding.account.passwordPlaceholder')}
        secureTextEntry={!revealed}
        autoCapitalize="none"
        autoComplete="new-password"
        accessory={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.signUp.togglePassword')}
            className="shrink-0 active:opacity-60"
            onPress={() => setRevealed((current) => !current)}
          >
            <Glyph.EyeGlyph size={21} color={colors.inkDim} />
          </Pressable>
        }
      />

      <StrengthMeter filled={strength} />

      <View className="mt-[9px] shrink-0 flex-row items-center justify-between">
        <Text className="text-[14px] text-ink-dim">{t('onboarding.signUp.strength')}</Text>
        <Text weight={600} className="text-[14px] text-brand">
          {t(`onboarding.signUp.${STRENGTH_LABEL[strength]!}`)}
        </Text>
      </View>

      <Button
        label={t('onboarding.account.createAccount')}
        className="mt-[20px]"
        onPress={() => router.push('/(onboarding)/confirmation')}
      />

      <Pressable
        accessibilityRole="button"
        className="mt-[14px] shrink-0 active:opacity-60"
        onPress={() => router.push('/(onboarding)/account')}
      >
        <Text className="text-center text-[15.5px] text-ink-body">
          {t('onboarding.signUp.haveAccount')}{' '}
          <Text weight={600} className="text-[15.5px] text-brand">
            {t('onboarding.signUp.signIn')}
          </Text>
        </Text>
      </Pressable>

      <Spacer />
    </StepScaffold>
  );
}
