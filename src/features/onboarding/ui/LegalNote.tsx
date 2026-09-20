import { useTranslation } from 'react-i18next';

import { Text } from '@shared/ui';

/** The terms-and-privacy line pinned to the foot of both account screens. */
export function LegalNote() {
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
