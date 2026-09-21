import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { isDataError } from '@shared/data/errors';
import {
  HostCard,
  Button,
  NoteField,
  Chip,
  SectionLabel,
  SheetSurface,
  Text,
  TextButton,
  WarningNote,
} from '@shared/ui';

import { usePlan, useSetMembership } from '../data/use-plans';

/**
 * Leaving a plan. The confirmation is honest about the consequences — the seat
 * returns to the map, the host is told, the group chat closes — and keeps the
 * way back open.
 */
export function LeavePlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan } = usePlan(id ?? '');
  const { mutate: setMembership, isPending, error } = useSetMembership(id ?? '');
  const [note, setNote] = useState('');

  /**
   * Same rule as the join sheet: the seat is only given up once the server
   * says so. Leaving on the tap would dismiss both sheets and leave a refusal
   * — a host cannot leave their own plan — with nowhere to be read.
   */
  const leave = () => {
    if (!plan || isPending) return;
    setMembership(
      { membership: 'guest', note },
      {
        // Both this sheet and the plan sheet under it have to go — going back
        // once would land on the sheet for the plan just left — so name the map
        // as the target rather than popping a step at a time.
        onSuccess: () => router.dismissTo('/(tabs)'),
      },
    );
  };

  const refusal = isDataError(error) ? t(error.messageKey) : null;

  // "com Phil, Sara e você" — the viewer is named by the template's tail, so
  // they must not appear in the list as well.
  const attendees = (plan?.participants ?? [])
    .filter((participant) => !participant.isViewer)
    .map((participant) => participant.user.name)
    .join(', ');

  // No map backdrop and no scrim: the sheet is presented over the real map
  // now, and the system dims what is behind it.
  return (
    <SheetSurface gap={18} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <View className="gap-[6px] pt-[6px]">
        <Text weight={600} className="text-[24px] leading-[27.6px] tracking-[-0.5px]">
          {t('plan.leave.title')}
        </Text>
        <Text weight={500} className="text-[14.5px] leading-[21px] text-ink-muted">
          {t('plan.leave.subtitle', { name: plan?.host?.name ?? '' })}
        </Text>
      </View>

      <HostCard
        avatarUri={plan?.host?.avatarUrl ?? ''}
        name={plan?.title ?? ''}
        detail={`${plan?.whenLabel ?? ''} · ${t('plan.leave.attendees', {
          names: attendees,
        })}`}
        verified={false}
      />

      <View className="gap-[8px]">
        <SectionLabel sheet>{t('plan.leave.messageLabel')}</SectionLabel>
        <NoteField
          value={note}
          onChangeText={setNote}
          placeholder={t('plan.leave.notePlaceholder')}
          muted
          padding={{ vertical: 16, horizontal: 18 }}
          autoFocus
        />
        <View className="flex-row flex-wrap gap-[8px]">
          {(['reasonWork', 'reasonSick'] as const).map((key) => (
            <Chip
              key={key}
              label={t(`plan.leave.${key}`)}
              size="reason"
              tone="fill"
              onPress={() => setNote(t(`plan.leave.${key}`))}
            />
          ))}
        </View>
      </View>

      <WarningNote>{t('plan.leave.warning')}</WarningNote>

      <View className="gap-[10px]">
        <Button
          label={isPending ? t('plan.leave.leaving') : t('plan.leave.confirm')}
          variant="danger"
          disabled={isPending}
          onPress={leave}
        />
        {refusal ? <Text className="text-center text-[14px] text-ink-dim">{refusal}</Text> : null}
        <TextButton label={t('plan.leave.keep')} tone="bodyStrong" onPress={() => router.back()} />
      </View>
    </SheetSurface>
  );
}
