import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePlans } from '@shared/data/queries/use-plans';
import { useReportAndBlock } from '@shared/data/queries/use-safety';
import { useUser } from '@shared/data/queries/use-users';
import { formatDayMonth } from '@shared/lib/datetime';
import { Button, Spacer } from '@shared/ui/button';
import { SectionLabel } from '@shared/ui/card';
import { Chip } from '@shared/ui/chip';
import { NoteField } from '@shared/ui/fields';
import { NavHeader } from '@shared/ui/header';
import { WarningNote } from '@shared/ui/note';
import { HostCard } from '@shared/ui/person-row';
import { Screen } from '@shared/ui/screen';
import { Text } from '@shared/ui/text';

import { isReportReason } from '../lib/reasons';

/**
 * Step two: who is being reported, over which plan, and anything they want to
 * add in their own words.
 *
 * The note is optional on purpose — a report that needs an essay is a report
 * people abandon — so the two chips under it write the sentences that come up
 * most, exactly as the join-request sheet does.
 */
export function ReportDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id, reason, planId } = useLocalSearchParams<{
    id: string;
    reason?: string;
    planId?: string;
  }>();
  const { data: user } = useUser(id ?? '');
  const { data: plans } = usePlans();
  const [note, setNote] = useState('');
  const { mutate: report, isPending, isError } = useReportAndBlock();

  // The plan is context, not a required field: a report started from a profile
  // has none, and then the card falls back to where the person is from.
  const plan = planId ? plans?.find((candidate) => candidate.id === planId) : undefined;
  const planLine = plan
    ? `${plan.title} · ${formatDayMonth(new Date(plan.startsAt), i18n.language)}`
    : (user?.neighbourhood ?? '');

  const append = (phrase: string) =>
    setNote((current) => (current.trim() ? `${current.trim()} ${phrase}.` : `${phrase}.`));

  /**
   * Files the report, blocks the person, and only then confirms.
   *
   * The confirmation says both are done, so it must not be reached on a write
   * that failed — this screen is the last place a refusal can still be read.
   */
  const send = () => {
    if (isPending || !id || !isReportReason(reason)) return;
    report(
      { subjectId: id, reason, detail: note, planId },
      // Replaces, so the back gesture on the confirmation cannot land on a form
      // whose report has already gone in.
      { onSuccess: () => router.replace(`/report/${id}/sent`) },
    );
  };

  return (
    <Screen>
      <NavHeader
        title={t('safety.detail.navTitle', {
          reason: isReportReason(reason) ? t(`safety.reasons.${reason}.title`) : '',
        })}
        onBack={() => router.back()}
      />

      <View className="mt-[20px] shrink-0">
        <HostCard
          avatarUri={user?.avatarUrl ?? ''}
          name={user ? `${user.name}, ${user.age}` : ''}
          detail={planLine}
          verified={user?.verified ?? false}
        />
      </View>

      <View className="mt-[20px] shrink-0 gap-[10px]">
        <SectionLabel>{t('safety.detail.noteLabel')}</SectionLabel>
        <NoteField
          value={note}
          onChangeText={setNote}
          placeholder={t('safety.detail.notePlaceholder')}
          autoFocus
        />
        <View className="flex-row flex-wrap gap-[8px]">
          {(['chipNoReply', 'chipSecondTime'] as const).map((key) => (
            <Chip
              key={key}
              label={t(`safety.detail.${key}`)}
              size="soft"
              tone="fill"
              onPress={() => append(t(`safety.detail.${key}`))}
            />
          ))}
        </View>
      </View>

      <Spacer min={16} />

      <View className="shrink-0 gap-[14px]">
        <WarningNote>{t('safety.detail.warning')}</WarningNote>
        {isError ? (
          <Text className="text-center text-[14px] text-ink-dim">{t('safety.detail.failed')}</Text>
        ) : null}
        <Button
          label={isPending ? t('safety.detail.sending') : t('safety.detail.send')}
          variant="danger"
          disabled={isPending}
          onPress={send}
        />
      </View>
    </Screen>
  );
}
