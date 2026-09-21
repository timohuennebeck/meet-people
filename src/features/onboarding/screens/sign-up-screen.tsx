import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/step-scaffold';
import { useAcceptLegal, useLegalDocument } from '@shared/data/use-legal';
import { cn } from '@shared/lib/cn';
import { STEPS } from '@shared/lib/steps';
import { supabase } from '@shared/lib/supabase/client';
import { Button, Spacer, Text } from '@shared/ui';

import { describeAuthFailure, type AuthFailure } from '../lib/auth-errors';
import { flushProfileWrites } from '../lib/profile-writes';
import { AuthSwitchLink, CredentialFields } from '../ui/credential-fields';

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
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const strength = strengthOf(password);

  // "Ao criar a conta você aceita os Termos de uso e a Política de privacidade"
  // sits under this button, so creating the account is the acceptance. Both
  // documents are already loaded by the time it is tapped — the same two the
  // links above open.
  const { data: terms } = useLegalDocument('terms');
  const { data: privacy } = useLegalDocument('privacy');
  const { mutateAsync: acceptLegal } = useAcceptLegal();

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

      // Consent is consent to a version, so this records the ids of the
      // documents actually in force. It must not stop the sign-up: the account
      // exists either way, and a lost acceptance row is recoverable where a
      // person stranded on the password screen with an account already made is
      // not. With no session yet — confirmations on — there is nobody to write
      // it as, and the row waits for the sign-in that follows.
      const documentIds = [terms?.id, privacy?.id].filter((id): id is string => Boolean(id));
      if (documentIds.length > 0) {
        await acceptLegal(documentIds).catch((error: unknown) =>
          console.warn('[legal] Could not record acceptance:', error),
        );
      }

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
      <CredentialFields
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        passwordAutoComplete="new-password"
        failure={failure}
      >
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
      </CredentialFields>

      <Button
        label={t(submitting ? 'onboarding.signUp.creating' : 'onboarding.account.createAccount')}
        className="mt-[20px]"
        disabled={submitting}
        onPress={() => void createAccount()}
      />

      <AuthSwitchLink
        prompt={t('onboarding.signUp.haveAccount')}
        action={t('onboarding.signUp.signIn')}
        onPress={() => router.push('/(onboarding)/sign-in')}
      />

      <Spacer />
    </StepScaffold>
  );
}
