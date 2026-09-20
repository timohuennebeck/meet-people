import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { gradients } from '@shared/theme/tokens';
import {
  HostCard,
  Button,
  NoteField,
  Chip,
  SectionLabel,
  SheetScrim,
  SheetSurface,
  Text,
  TextButton,
  WarningNote,
} from '@shared/ui';

import { usePlan, useSetMembership } from '../data/usePlans';

/** The note the design shows already drafted, in placeholder grey. */
const SAMPLE_NOTE = 'Desculpa, meu turno mudou. Fica para a próxima.';

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
  const { mutate: setMembership } = useSetMembership(id ?? '');

  const leave = () => {
    if (plan) setMembership('guest');
    // `dismissAll` pops to the top of the *nearest* stack, which is the plan's
    // own — it would land back on the sheet for the plan just left. The map is
    // the target, so dismiss the whole modal group instead.
    router.dismissTo('/(tabs)');
  };

  // "com Phil, Sara e você" — the viewer is named by the template's tail, so
  // they must not appear in the list as well.
  const attendees = (plan?.participants ?? [])
    .filter((participant) => !participant.isViewer)
    .map((participant) => participant.user.name)
    .join(', ');

  return (
    <View className="flex-1">
      <LinearGradient colors={gradients.map} className="absolute inset-0" />
      <SheetScrim strong />

      <SheetSurface gap={18} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
        <View className="gap-[6px] pt-[6px]">
          <Text weight={600} className="text-[24px] leading-[27.6px] tracking-[-0.5px]">
            {t('plan.leave.title')}
          </Text>
          <Text weight={500} className="text-[14.5px] leading-[21px] text-ink-muted">
            {t('plan.leave.subtitle', { name: plan?.host.name ?? '' })}
          </Text>
        </View>

        <HostCard
          avatarUri={plan?.host.avatarUrl ?? ''}
          name={plan?.title ?? ''}
          detail={`${plan?.whenLabel.split(' · ')[0] ?? ''} · ${t('plan.leave.attendees', {
            names: attendees,
          })}`}
          verified={false}
        />

        <View className="gap-[8px]">
          <SectionLabel sheet>{t('plan.leave.messageLabel')}</SectionLabel>
          <NoteField value={SAMPLE_NOTE} muted padding={{ vertical: 14, horizontal: 16 }} />
          <View className="flex-row flex-wrap gap-[8px]">
            <Chip label={t('plan.leave.reasonWork')} size="reason" tone="fill" />
            <Chip label={t('plan.leave.reasonSick')} size="reason" tone="fill" />
          </View>
        </View>

        <WarningNote>{t('plan.leave.warning')}</WarningNote>

        <View className="gap-[10px]">
          <Button label={t('plan.leave.confirm')} variant="danger" onPress={leave} />
          <TextButton
            label={t('plan.leave.keep')}
            tone="bodyStrong"
            onPress={() => router.back()}
          />
        </View>
      </SheetSurface>
    </View>
  );
}
