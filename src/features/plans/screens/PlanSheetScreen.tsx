import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Plan } from '@shared/data/schemas';
import { gradients } from '@shared/theme/tokens';
import {
  Button,
  HostCard,
  SeatList,
  SeatSummary,
  SheetScrim,
  SheetSurface,
  Text,
  TextButton,
  TimelineStep,
} from '@shared/ui';

import { usePlan, useSetMembership } from '../data/usePlans';
import { openSeatCount, seatsFor } from '../lib/seats';
import { HostRequestList } from '../ui/HostRequestList';
import { PlanSheetHeader } from '../ui/PlanSheetHeader';

/** The plan is open and the viewer can ask to join. */
function OpenState({ plan, onJoin }: { plan: Plan; onJoin: () => void }) {
  const { t } = useTranslation();
  const open = openSeatCount(plan);

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 40 }}>
      <PlanSheetHeader plan={plan} photoHeight={220} mascotSize={148} titleGap={6} />

      <HostCard
        avatarUri={plan.host.avatarUrl}
        name={`${plan.host.name}, ${plan.host.age}`}
        detail={t('plan.hostTenure')}
      />

      <View className="gap-[10px]">
        <SeatSummary
          filled={t('plan.participating', {
            filled: String(plan.participants.length),
            total: String(plan.capacity),
          })}
          open={open === 1 ? t('plan.seatsFreeOne') : t('plan.seatsFree', { count: open })}
        />
        <SeatList
          seats={seatsFor(plan, t('common.freeSeat'), t('common.you'))}
          size={52}
          gap={14}
        />
      </View>

      {plan.description ? (
        <Text weight={500} className="text-[14px] leading-[21px] text-ink-body">
          {plan.description}
        </Text>
      ) : null}

      <View className="gap-[10px]">
        <Button label={t('plan.askToJoin')} variant="primarySheet" onPress={onJoin} />
        <TextButton label={t('plan.maybeLater')} tone="muted" />
      </View>
    </SheetSurface>
  );
}

/** The request is in; the primary action becomes withdrawing it. */
function RequestedState({ plan, onWithdraw }: { plan: Plan; onWithdraw: () => void }) {
  const { t } = useTranslation();
  const open = openSeatCount(plan);

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <PlanSheetHeader plan={plan} photoHeight={180} mascotSize={132} />

      <View className="gap-[20px] py-[2px]">
        <TimelineStep
          state="done"
          connector={38}
          title={t('plan.sent.title')}
          description={t('plan.sent.body', { name: plan.host.name })}
        />
        <TimelineStep
          state="active"
          tight
          estimate={t('plan.sent.confirmEstimate')}
          title={t('plan.sent.confirmTitle', { name: plan.host.name })}
          description={t('plan.sent.confirmBody')}
        />
      </View>

      <HostCard
        avatarUri={plan.host.avatarUrl}
        name={`${plan.host.name}, ${plan.host.age}`}
        detail={`${t('plan.participating', {
          filled: String(plan.participants.length),
          total: String(plan.capacity),
        })} · ${open === 1 ? t('plan.seatsFreeOne') : t('plan.seatsFree', { count: open })}`}
        action={t('common.profile')}
      />

      <Button label={t('plan.withdraw')} variant="outline" onPress={onWithdraw} />
    </SheetSurface>
  );
}

/** The viewer is in: green badge, their face in the seats, chat as the action. */
function JoinedState({ plan, onLeave }: { plan: Plan; onLeave: () => void }) {
  const { t } = useTranslation();
  const open = openSeatCount(plan);

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <PlanSheetHeader plan={plan} photoHeight={180} mascotSize={132} joined />

      <HostCard
        avatarUri={plan.host.avatarUrl}
        name={`${plan.host.name}, ${plan.host.age}`}
        detail={t('plan.hostTenure')}
      />

      <View className="gap-[10px]">
        <SeatSummary
          filled={t('plan.participating', {
            filled: String(plan.participants.length),
            total: String(plan.capacity),
          })}
          open={open === 1 ? t('plan.seatsFreeOne') : t('plan.seatsFree', { count: open })}
        />
        <SeatList
          seats={seatsFor(plan, t('common.freeSeat'), t('common.you'))}
          size={52}
          gap={14}
        />
      </View>

      <View className="gap-[10px]">
        {plan.description ? (
          <Text weight={500} className="mb-[4px] text-[14.5px] leading-[21px] text-ink-body">
            {plan.description}
          </Text>
        ) : null}
        <Button label={t('plan.openGroupChat')} variant="primarySheet" />
        <TextButton label={t('plan.notGoing')} tone="muted" onPress={onLeave} />
      </View>
    </SheetSurface>
  );
}

/** The viewer hosts this plan: seats, then the requests still to answer. */
function HostState({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  const open = openSeatCount(plan);
  const full = open === 0;

  return (
    <SheetSurface gap={18} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <PlanSheetHeader plan={plan} photoHeight={160} mascotSize={118} hosting hideDistance />

      <View className="gap-[12px]">
        <View className="flex-row items-baseline justify-between">
          <Text weight={600} className="text-[12px] tracking-[0.4px] text-ink-faint">
            {t('plan.seatsLabel')}
          </Text>
          <Text weight={600} className="text-[13px] text-category-games">
            {open === 1 ? t('plan.seatsFreeOne') : t('plan.seatsFree', { count: open })}
          </Text>
        </View>
        <SeatList
          seats={seatsFor(plan, t('common.freeSeat'), `${t('common.you')} · ${t('plan.hostRole')}`)}
          size={plan.capacity > 4 ? 58 : 72}
          gap={plan.capacity > 4 ? 8 : 10}
          even
          captionSize={12}
          tintedEmpty
        />
      </View>

      <HostRequestList plan={plan} full={full} />
    </SheetSurface>
  );
}

/**
 * The plan detail sheet. Which state renders follows the viewer's membership,
 * so the same route serves the guest and host flows.
 */
export function PlanSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: plan } = usePlan(id ?? '');
  const { mutate: setMembership } = useSetMembership();

  if (!plan) {
    return (
      <View className="flex-1">
        <LinearGradient colors={gradients.map} className="absolute inset-0" />
        <SheetScrim />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient colors={gradients.map} className="absolute inset-0" />
      <SheetScrim />

      {plan.membership === 'host' ? (
        <HostState plan={plan} />
      ) : plan.membership === 'requested' ? (
        <RequestedState
          plan={plan}
          onWithdraw={() => setMembership({ planId: plan.id, membership: 'guest' })}
        />
      ) : plan.membership === 'joined' ? (
        <JoinedState plan={plan} onLeave={() => router.push(`/plan/${plan.id}/leave`)} />
      ) : (
        <OpenState plan={plan} onJoin={() => router.push(`/plan/${plan.id}/join`)} />
      )}
    </View>
  );
}
