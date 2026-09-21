import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useViewer } from '@shared/data/queries/use-viewer';
import { useSession } from '@shared/providers/session-provider';
import { Button, TextButton } from '@shared/ui/button';
import { MascotScreen } from '@shared/ui/mascot-screen';
import { HostCard } from '@shared/ui/person-row';

/**
 * Signing out. Unlike deleting the account nothing is lost here, so the page
 * says so plainly above a card naming the account being left, then ends the
 * session — the router's guards take it from there and the welcome step is what
 * the user lands on.
 *
 * Staying is the primary button: the page is reached from a settings row that
 * is easy to hit by accident, and the destructive-looking half of a pair should
 * not be the one the thumb finds first.
 */
export function SignOutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut, email } = useSession();
  const { data: viewer } = useViewer();

  const leave = () => {
    signOut();
    router.replace('/(onboarding)');
  };

  return (
    <MascotScreen
      navTitle={t('settings.signOutPage.title')}
      onBack={() => router.back()}
      title={t('settings.signOutPage.heading')}
      subtitle={t('settings.signOutPage.subtitle')}
      footer={
        <>
          <Button
            label={t('settings.signOutPage.stay')}
            variant="primaryCompact"
            onPress={() => router.back()}
          />
          <TextButton label={t('settings.signOutPage.confirm')} tone="bodyBold" onPress={leave} />
        </>
      }
    >
      <HostCard
        avatarUri={viewer?.avatarUrl ?? ''}
        name={viewer?.name ?? ''}
        detail={email ?? ''}
        verified={viewer?.verified ?? false}
      />
    </MascotScreen>
  );
}
