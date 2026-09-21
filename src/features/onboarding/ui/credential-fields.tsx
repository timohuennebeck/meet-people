import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { colors } from '@shared/theme/tokens';
import { FieldLabel, Glyph, Text, TextField } from '@shared/ui';

import type { AuthFailure } from '../lib/auth-errors';

export interface CredentialFieldsProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  /** `new-password` when creating an account, `current-password` when returning. */
  passwordAutoComplete: 'new-password' | 'current-password';
  /** Sits under the password field — where sign-up puts its strength meter. */
  children?: ReactNode;
  /** What went wrong, shown under the field it is about and above the button. */
  failure: AuthFailure | null;
}

/**
 * The e-mail and password pair both auth screens are built from.
 *
 * The design only ever draws it once, on sign-up: signing back in is the same
 * scaffold with the strength meter taken out. Keeping one copy is what stops
 * the two drifting — the reveal toggle, the 62px field height and the failure
 * line all have to match, because to the person they are the same form.
 */
export function CredentialFields({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordAutoComplete,
  children,
  failure,
}: CredentialFieldsProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);

  return (
    <>
      <FieldLabel className="mt-[24px]">{t('onboarding.account.emailLabel')}</FieldLabel>
      <TextField
        className="mt-[9px] rounded-field"
        height={62}
        fontSize={17}
        value={email}
        onChangeText={onEmailChange}
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
        onChangeText={onPasswordChange}
        placeholder={t('onboarding.account.passwordPlaceholder')}
        secureTextEntry={!revealed}
        autoCapitalize="none"
        autoComplete={passwordAutoComplete}
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

      {children}

      {failure ? (
        <Text className="mt-[16px] shrink-0 text-[13.5px] leading-[19px] text-danger">
          {t(`onboarding.authError.${failure}`)}
        </Text>
      ) : null}
    </>
  );
}

export interface AuthSwitchLinkProps {
  /** The plain half, e.g. "Já tem conta?". */
  prompt: string;
  /** The brand half that reads as the link, e.g. "Entrar". */
  action: string;
  onPress: () => void;
}

/** The "already have an account? sign in" line under the button, and its inverse. */
export function AuthSwitchLink({ prompt, action, onPress }: AuthSwitchLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="mt-[14px] shrink-0 active:opacity-60"
      onPress={onPress}
    >
      <Text className="text-center text-[15.5px] text-ink-body">
        {prompt}{' '}
        <Text weight={600} className="text-[15.5px] text-brand">
          {action}
        </Text>
      </Text>
    </Pressable>
  );
}
