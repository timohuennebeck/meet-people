import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

/**
 * The sentence to show when signing up or signing in fails.
 *
 * Each one is something the person can act on — try a different password, sign
 * in instead, reconnect — rather than a status code. The copy lives under
 * `onboarding.authError.<name>` in the locales.
 */
export type AuthFailure =
  | 'offline'
  | 'invalidCredentials'
  | 'emailTaken'
  | 'invalidEmail'
  | 'weakPassword'
  | 'tooManyAttempts'
  | 'unknown';

/**
 * Sorts a Supabase auth error into one of those sentences.
 *
 * `error.code` is the stable name; the message is English prose that changes
 * between releases, so it is never matched on.
 */
export function describeAuthFailure(error: AuthError): AuthFailure {
  // The request never reached Supabase: aeroplane mode, captive portal, a
  // project that is asleep. Worth saying, because retrying actually works.
  if (isAuthRetryableFetchError(error)) return 'offline';

  switch (error.code) {
    case 'invalid_credentials':
    case 'email_not_confirmed':
      return 'invalidCredentials';
    case 'user_already_exists':
    case 'email_exists':
      return 'emailTaken';
    case 'validation_failed':
    case 'email_address_invalid':
      return 'invalidEmail';
    case 'weak_password':
      return 'weakPassword';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'tooManyAttempts';
    default:
      return 'unknown';
  }
}
