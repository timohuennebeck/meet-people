import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { cn } from '@shared/lib/cn';
import { STEPS } from '@shared/lib/steps';
import { supabase } from '@shared/lib/supabase/client';
import { colors } from '@shared/theme/tokens';
import { Button, FieldLabel, Glyph, Spacer, Text, TextField } from '@shared/ui';

import { describeAuthFailure, type AuthFailure } from '../lib/authErrors';
import { flushProfileWrites } from '../lib/profileWrites';

/** The label beside the meter, one per lit segment. */
const STRENGTH_LABEL = ['weak', 'weak', 'fair', 'good', 'strong'] as const;

/**
 * The tone a score wears — red, amber, green, then brand blue. The bars and the
 * label beside them read from the same entry so the two always agree. Index 0
 * is never used: neither the meter nor the label renders on an empty field.
 */
const STRENGTH_TONE = [
  { bar: 'bg-hair-rail', label: 'text-ink-dim' },
  { bar: 'bg-danger', label: 'text-danger' },
  { bar: 'bg-warn', label: 'text-warn' },
  { bar: 'bg-joined', label: 'text-joined' },
  { bar: 'bg-brand', label: 'text-brand' },
] as const;

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
  const lit = STRENGTH_TONE[filled]!.bar;

  return (
    <View className="mt-[12px] shrink-0 flex-row items-center gap-[6px]">
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          className={cn('h-[5px] flex-1 rounded-[3px]', index < filled ? lit : 'bg-hair-rail')}
        />
      ))}
    </View>
  );
}

/** E-mail and password, with the keyboard up. */
export function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const strength = strengthOf(password);

  /**
   * Closes the button to a second tap before React has re-rendered it
   * disabled. `submitting` greys the button out; this is what stops the two
   * taps of a double tap from both getting through and creating the account
   * twice.
   */
  const inFlight = useRef(false);

  const createAccount = async () => {
    if (inFlight.current) return;
    if (!supabase) {
      setFailure('unknown');
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setFailure(null);

    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        setFailure(describeAuthFailure(error));
        return;
      }

      // An address that already has an account does not come back as an error
      // while confirmations are on — answering "that one is taken" to anyone
      // who asks would hand out the user list. Supabase returns a decoy user
      // with no identities instead, which is the one safe way to tell.
      if (data.user && data.user.identities?.length === 0) {
        setFailure('emailTaken');
        return;
      }

      // Everything answered before there was an account to hang it on.
      await flushProfileWrites();
      router.push('/(onboarding)/confirmation');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

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

      {/* Nothing stands under an untouched field — the meter arrives with the
          first character typed. */}
      {strength > 0 ? (
        <>
          <StrengthMeter filled={strength} />

          <View className="mt-[9px] shrink-0 flex-row items-center justify-between">
            <Text className="text-[14px] text-ink-dim">{t('onboarding.signUp.strength')}</Text>
            <Text weight={600} className={cn('text-[14px]', STRENGTH_TONE[strength]!.label)}>
              {t(`onboarding.signUp.${STRENGTH_LABEL[strength]!}`)}
            </Text>
          </View>
        </>
      ) : null}

      {/* Under the field it is about, above the button that caused it. */}
      {failure ? (
        <Text className="mt-[16px] shrink-0 text-[13.5px] leading-[19px] text-danger">
          {t(`onboarding.authError.${failure}`)}
        </Text>
      ) : null}

      <Button
        label={t(submitting ? 'onboarding.signUp.creating' : 'onboarding.account.createAccount')}
        className="mt-[20px]"
        disabled={submitting}
        onPress={() => void createAccount()}
      />

      <Pressable
        accessibilityRole="button"
        className="mt-[14px] shrink-0 active:opacity-60"
        onPress={() => router.push('/(onboarding)/sign-in')}
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
