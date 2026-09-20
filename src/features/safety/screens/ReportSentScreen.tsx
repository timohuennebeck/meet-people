import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUser } from '@features/profile/data/useUsers';
import { MascotScreen } from '@shared/components/MascotScreen';
import { Button, TextButton } from '@shared/ui';

/**
 * Step three: the report is in, and the person is blocked.
 *
 * Blocking by default is what `docs/database.md` §3.9 describes — the two
 * simply stop existing for each other — so the screen states it rather than
 * asking, and offers the one tap that undoes it. There is no `blocks` table in
 * the fixture layer, so the block lives in this screen's state: it decides
 * whether the undo is still on offer and goes no further than that.
 */
export function ReportSentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user } = useUser(id ?? '');
  const [blocked, setBlocked] = useState(true);

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
                toPlans();
              }}
            />
          ) : null}
        </>
      }
    />
  );
}
