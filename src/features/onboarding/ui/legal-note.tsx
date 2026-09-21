import { useTranslation } from 'react-i18next';

import { Text } from '@shared/ui/text';

import { LegalLink } from './legal-link';

/** The terms-and-privacy line pinned to the foot of both account screens. */
export function LegalNote() {
  const { t } = useTranslation();

  return (
    <Text className="text-center text-[13.5px] leading-[20.25px] text-ink-ghost">
      {t('onboarding.account.legalPrefix')}{' '}
      <LegalLink
        doc="terms"
        label={t('onboarding.account.terms')}
        className="text-[13.5px] text-ink-body underline"
        pressedClassName="text-ink-trace"
      />{' '}
      {t('onboarding.account.legalJoin')}{' '}
      <LegalLink
        doc="privacy"
        label={t('onboarding.account.privacy')}
        className="text-[13.5px] text-ink-body underline"
        pressedClassName="text-ink-trace"
      />
      {t('onboarding.account.legalSuffix')}
    </Text>
  );
}
