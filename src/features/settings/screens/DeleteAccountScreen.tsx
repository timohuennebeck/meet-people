import { useRouter } from 'expo-router';
import { Info } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { MascotScreen } from '@shared/components/MascotScreen';
import { CONVERSATIONS, PLANS, VIEWER } from '@shared/data/fixtures';
import { useSession } from '@shared/providers/SessionProvider';
import { colors } from '@shared/theme/tokens';
import { Button, InfoNote, TextButton } from '@shared/ui';

/** The plans that disappear with the account are the ones the viewer hosts. */
const HOSTED_PLANS = PLANS.filter((plan) => plan.host?.id === VIEWER.id).length;

/**
 * Deleting the account. The question names the person and the sentence under it
 * counts what goes — the disclosure is the copy itself rather than a separate
 * list, and the tinted note carries the one thing deletion does *not* stop: a
 * subscription billed by the phone's store.
 */
export function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useSession();

  const remove = () => {
    // There is no account API yet, so deletion ends the session the way signing
    // out does: the router's guards then drop the user back at the welcome step.
    signOut();
    router.replace('/(onboarding)');
  };

  return (
    <MascotScreen
      navTitle={t('settings.deleteAccountPage.title')}
      onBack={() => router.back()}
      title={t('settings.deleteAccountPage.heading', { name: VIEWER.name })}
      subtitle={t('settings.deleteAccountPage.subtitle', {
        plans: t('settings.deleteAccountPage.plansCount', { count: HOSTED_PLANS }),
        chats: t('settings.deleteAccountPage.chatsCount', { count: CONVERSATIONS.length }),
      })}
      footer={
        <>
          <Button
            label={t('settings.deleteAccountPage.confirm')}
            variant="danger"
            onPress={remove}
          />
          <TextButton
            label={t('settings.deleteAccountPage.keep')}
            tone="bodyBold"
            onPress={() => router.back()}
          />
        </>
      }
    >
      <InfoNote icon={<Info size={26} weight="fill" color={colors.brand} />}>
        {t('settings.deleteAccountPage.billing')}
      </InfoNote>
    </MascotScreen>
  );
}
