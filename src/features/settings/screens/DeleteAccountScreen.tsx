import { useRouter } from 'expo-router';
import { Info } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { useConversations } from '@features/chat/data/useChat';
import { usePlans } from '@features/plans/data/usePlans';
import { MascotScreen } from '@shared/components/MascotScreen';
import { isDataError } from '@shared/data/errors';
import { useDeleteAccount } from '@shared/data/useAccount';
import { useViewer } from '@shared/data/useViewer';
import { useSession } from '@shared/providers/SessionProvider';
import { colors } from '@shared/theme/tokens';
import { Button, InfoNote, Text, TextButton } from '@shared/ui';

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
  const { data: viewer } = useViewer();
  const { data: plans } = usePlans();
  const { data: conversations } = useConversations();
  const { mutate: deleteAccount, isPending, error } = useDeleteAccount();

  // What actually goes: the plans this person is running, and every thread they
  // are in. Both were counted off the fixtures before, so the disclosure named
  // numbers that had nothing to do with the account being deleted.
  const hostedPlans = (plans ?? []).filter((plan) => plan.host?.id === viewer?.id).length;
  const chats = (conversations ?? []).length;

  const remove = () => {
    if (isPending) return;
    deleteAccount(undefined, {
      onSuccess: () => {
        // The account is gone; ending the session is what moves the router's
        // guards, and there is nothing left to come back to.
        signOut();
        router.replace('/(onboarding)');
      },
    });
  };

  const refusal = error
    ? isDataError(error)
      ? t(error.messageKey)
      : t('settings.deleteAccountPage.failed')
    : null;

  return (
    <MascotScreen
      navTitle={t('settings.deleteAccountPage.title')}
      onBack={() => router.back()}
      title={t('settings.deleteAccountPage.heading', { name: viewer?.name ?? '' })}
      subtitle={t('settings.deleteAccountPage.subtitle', {
        plans: t('settings.deleteAccountPage.plansCount', { count: hostedPlans }),
        chats: t('settings.deleteAccountPage.chatsCount', { count: chats }),
      })}
      footer={
        <>
          {refusal ? (
            <Text className="mb-[12px] text-center text-[14px] text-ink-dim">{refusal}</Text>
          ) : null}
          <Button
            label={
              isPending
                ? t('settings.deleteAccountPage.deleting')
                : t('settings.deleteAccountPage.confirm')
            }
            variant="danger"
            disabled={isPending}
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
