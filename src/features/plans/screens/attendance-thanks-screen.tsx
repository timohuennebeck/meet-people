import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, TextButton } from '@shared/ui/button';
import { MascotScreen } from '@shared/ui/mascot-screen';

/**
 * The thank-you after the check-list: what was submitted, and the reassurance
 * that answers are not attributed.
 *
 * The counts arrive as parameters because nothing stores them — the check-list
 * writes nowhere, so the numbers only exist between these two screens.
 *
 * "Denunciar quem faltou" leads into the report flow with `no_show` already
 * chosen. Reports are about one person, so when several were marked absent it
 * opens on the first of them; the rest are reported the same way from their
 * profiles.
 */
export function AttendanceThanksScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, present, absent, missed } = useLocalSearchParams<{
    id: string;
    present?: string;
    absent?: string;
    /** Comma-joined ids of everyone unticked, in list order. */
    missed?: string;
  }>();

  const presentCount = Number(present ?? 0);
  const absentCount = Number(absent ?? 0);
  const firstMissed = (missed ?? '').split(',').filter(Boolean)[0];

  return (
    <MascotScreen
      title={t('plan.attendance.thanks.title')}
      subtitle={t('plan.attendance.thanks.subtitle', {
        present: t('plan.attendance.thanks.present', { count: presentCount }),
        absent: t('plan.attendance.thanks.absent', { count: absentCount }),
      })}
      footer={
        <>
          <Button
            label={t('plan.attendance.thanks.back')}
            variant="primaryCompact"
            onPress={() => router.dismissTo('/(tabs)')}
          />
          {firstMissed ? (
            <TextButton
              label={t('plan.attendance.thanks.report')}
              tone="bodyStrong"
              onPress={() => router.push(`/report/${firstMissed}?reason=no_show&planId=${id}`)}
            />
          ) : null}
        </>
      }
    />
  );
}
