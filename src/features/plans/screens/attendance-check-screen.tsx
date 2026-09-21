import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { isDataError } from '@shared/data/errors';
import { usePlan, useRecordAttendance } from '@shared/data/queries/use-plans';
import { formatDayMonth, formatTime, relativeDay } from '@shared/lib/datetime';
import { Button, TextButton } from '@shared/ui/button';
import { StepSubtitle, StepTitle } from '@shared/ui/card';
import { NavHeader } from '@shared/ui/header';
import { WarningNote } from '@shared/ui/note';
import { Screen } from '@shared/ui/screen';
import { Text } from '@shared/ui/text';

import { attendeeDetail, attendeesOf, type Attendee } from '../lib/attendance';
import { AttendeeRow } from '../ui/attendee-row';

/**
 * The check-list the app shows once a plan's end time has passed.
 *
 * Everyone starts ticked, so answering honestly costs a tap only when someone
 * did not turn up — which is why the subtitle's instruction is "desmarque quem
 * faltou" rather than "marque quem veio".
 *
 * The answer is written before the thank-you screen is reached: it decides
 * everyone's attendance rate, which is the number a stranger reads before
 * deciding to sit down with them, so it must not be lost to a dismissed screen.
 */
export function AttendanceCheckScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan } = usePlan(id ?? '');
  const { mutate: record, isPending, error } = useRecordAttendance(id ?? '');

  // The function names the two things it refuses: somebody who does not host
  // this plan, and a plan that has not happened yet.
  const refusal = error
    ? isDataError(error)
      ? t(error.messageKey)
      : t('errors.publishFailed')
    : null;

  // Absences are tracked rather than attendances, so the list needs no seeding
  // once the plan loads: an empty set already means "everyone was there".
  const [absentIds, setAbsentIds] = useState<string[]>([]);

  const attendees = plan ? attendeesOf(plan) : [];
  const missed = attendees.filter((attendee) => absentIds.includes(attendee.user.id));
  const present = attendees.length - missed.length;

  const toggle = (userId: string) =>
    setAbsentIds((current) =>
      current.includes(userId)
        ? current.filter((candidate) => candidate !== userId)
        : [...current, userId],
    );

  const detailFor = (attendee: Attendee) => {
    const detail = attendeeDetail(attendee);
    switch (detail.key) {
      case 'host':
        return t('plan.attendance.host');
      case 'hostPlans':
        return t('plan.attendance.hostPlans', { count: detail.count });
      case 'shared':
        return t('plan.attendance.shared', {
          neighbourhood: detail.neighbourhood,
          count: detail.count,
        });
      default:
        return t('plan.attendance.first');
    }
  };

  const whenLabel = () => {
    if (!plan) return '';
    const start = new Date(plan.startsAt);
    const time = formatTime(start, i18n.language);
    switch (relativeDay(start)) {
      case 'today':
        return t('plan.attendance.whenToday', { time });
      case 'yesterday':
        return t('plan.attendance.whenYesterday', { time });
      default:
        return t('plan.attendance.whenOn', { date: formatDayMonth(start, i18n.language), time });
    }
  };

  const confirm = () => {
    if (isPending || !id) return;
    record(
      missed.map((attendee) => attendee.user.id),
      {
        // Replaces rather than pushes: the answer is in, and the back gesture
        // on the thank-you screen should not offer to give it again.
        onSuccess: () =>
          router.replace(
            `/plan/${id}/attendance-thanks?present=${present}&absent=${missed.length}` +
              `&missed=${missed.map((attendee) => attendee.user.id).join(',')}`,
          ),
      },
    );
  };

  return (
    <Screen>
      <NavHeader title={t('plan.attendance.navTitle')} onBack={() => router.back()} />

      <View className="mt-[20px] shrink-0 gap-[10px]">
        <StepTitle>{t('plan.attendance.title')}</StepTitle>
        <StepSubtitle>
          {t('plan.attendance.subtitle', { plan: plan?.title ?? '', when: whenLabel() })}
        </StepSubtitle>
      </View>

      <ScrollView
        className="mt-[20px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {attendees.map((attendee) => (
          <AttendeeRow
            key={attendee.user.id}
            user={attendee.user}
            detail={detailFor(attendee)}
            present={!absentIds.includes(attendee.user.id)}
            onPress={() => toggle(attendee.user.id)}
          />
        ))}
      </ScrollView>

      <View className="mt-[16px] shrink-0">
        <WarningNote>{t('plan.attendance.warning')}</WarningNote>
      </View>

      <View className="mt-[16px] shrink-0 gap-[12px]">
        {refusal ? <Text className="text-center text-[14px] text-ink-dim">{refusal}</Text> : null}
        <Button
          label={isPending ? t('plan.attendance.confirming') : t('plan.attendance.confirm')}
          disabled={isPending}
          onPress={confirm}
        />
        <TextButton label={t('common.notNow')} tone="bodyStrong" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
