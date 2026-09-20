import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { supabase } from '@shared/lib/supabase/client';
import { colors } from '@shared/theme/tokens';
import { Button, FieldLabel, Glyph, Spacer, Text, TextField } from '@shared/ui';

import { describeAuthFailure, type AuthFailure } from '../lib/authErrors';
import { flushProfileWrites } from '../lib/profileWrites';

/**
 * Signing back in. The design has no screen for it — it only ever draws the
 * link — so this is `SignUpScreen` with the strength meter taken out: the same
 * scaffold, the same two fields, the same failure line.
 */
export function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<AuthFailure | null>(null);

  /** Closes the button to a second tap before the re-render disables it. */
  const inFlight = useRef(false);

  const signIn = async () => {
    if (inFlight.current) return;
    if (!supabase) {
      setFailure('unknown');
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setFailure(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setFailure(describeAuthFailure(error));
        return;
      }

      // Someone who started the flow on this device and only now signed in has
      // answers waiting that had nowhere to go.
      await flushProfileWrites();

      // Someone who already finished is carried to the app by the router's own
      // guards the moment the session lands; this is for everyone who stopped
      // part way and is picking the sign-up back up.
      router.replace('/(onboarding)/name');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <StepScaffold
      position={STEPS.signIn}
      padding="form"
      title={t('onboarding.signIn.title')}
      subtitle={t('onboarding.signIn.subtitle')}
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
        autoComplete="current-password"
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

      {failure ? (
        <Text className="mt-[16px] shrink-0 text-[13.5px] leading-[19px] text-danger">
          {t(`onboarding.authError.${failure}`)}
        </Text>
      ) : null}

      <Button
        label={t(submitting ? 'onboarding.signIn.submitting' : 'onboarding.signIn.submit')}
        className="mt-[20px]"
        disabled={submitting}
        onPress={() => void signIn()}
      />

      <Pressable
        accessibilityRole="button"
        className="mt-[14px] shrink-0 active:opacity-60"
        onPress={() => router.push('/(onboarding)/sign-up')}
      >
        <Text className="text-center text-[15.5px] text-ink-body">
          {t('onboarding.signIn.noAccount')}{' '}
          <Text weight={600} className="text-[15.5px] text-brand">
            {t('onboarding.signIn.createAccount')}
          </Text>
        </Text>
      </Pressable>

      <Spacer />
    </StepScaffold>
  );
}
