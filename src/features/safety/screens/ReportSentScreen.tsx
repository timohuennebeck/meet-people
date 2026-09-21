import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUser } from '@features/profile/data/useUsers';
import { MascotScreen } from '@shared/components/MascotScreen';
import { Button, TextButton } from '@shared/ui';

import { useUnblock } from '../data/useSafety';

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
      title={t('safety.sent.title')}
      subtitle={t('safety.sent.subtitle', { name })}
      footer={
        <>
          <Button label={t('safety.sent.back')} variant="primaryCompact" onPress={toPlans} />
          {blocked ? (
            <TextButton
              label={t('safety.sent.unblock', { name })}
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
