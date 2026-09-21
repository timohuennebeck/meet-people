import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnblock } from '@shared/data/queries/use-moderation';
import { useUser } from '@shared/data/queries/use-users';
import { Button, TextButton } from '@shared/ui/button';
import { MascotScreen } from '@shared/ui/mascot-screen';

/**
 * Step three: the report is in, and the person is blocked.
 *
 * Blocking by default is what `docs/database.md` §3.9 describes — the two
 * simply stop existing for each other — so the screen states it rather than
 * asking, and offers the one tap that undoes it. Both happened before this
 * screen was reached; `blocked` only decides whether the undo is still on
 * offer.
 */
export function ReportSentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user } = useUser(id ?? '');
  const [blocked, setBlocked] = useState(true);
  const { mutate: unblock } = useUnblock();

  const name = user?.name ?? '';
  const toPlans = () => router.dismissTo('/(tabs)');

  return (
    <MascotScreen
      title={t('moderation.sent.title')}
      subtitle={t('moderation.sent.subtitle', { name })}
      footer={
        <>
          <Button label={t('moderation.sent.back')} variant="primaryCompact" onPress={toPlans} />
          {blocked ? (
            <TextButton
              label={t('moderation.sent.unblock', { name })}
              tone="bodyStrong"
              onPress={() => {
                setBlocked(false);
                // Leaving does not wait on the write: the block is lifted or it
                // is not, and there is no state on the map that reading the
                // answer here would correct.
                if (id) unblock(id);
                toPlans();
              }}
            />
          ) : null}
        </>
      }
    />
  );
}
