import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Plan } from '@shared/data/schemas';
import { gradients, shadows } from '@shared/theme/tokens';
import {
  Button,
  CircleButton,
  Glyph,
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

/** The host summary the open and joined sheets both open with. */
function PlanHost({ plan }: { plan: Plan }) {
  const { t } = useTranslation();

  return (
    <HostCard
      avatarUri={plan.host.avatarUrl}
      name={`${plan.host.name}, ${plan.host.age}`}
      detail={t('plan.hostTenure')}
    />
  );
}

/** The seat count and the row of faces under it. */
function PlanSeats({ plan }: { plan: Plan }) {
  const { t } = useTranslation();

  return (
    <View className="gap-[10px]">
      <SeatSummary
        filled={t('plan.participating', {
          filled: String(plan.participants.length),
          total: String(plan.capacity),
        })}
        open={t('plan.seatsFree', { count: openSeatCount(plan) })}
      />
      <SeatList seats={seatsFor(plan, t('common.freeSeat'), t('common.you'))} size={52} gap={14} />
    </View>
  );
}

/** The plan is open and the viewer can ask to join. */
function OpenState({ plan, onJoin }: { plan: Plan; onJoin: () => void }) {
  const { t } = useTranslation();

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 40 }}>
      <PlanSheetHeader plan={plan} photoHeight={220} mascotSize={148} titleGap={6} />

      <PlanHost plan={plan} />

      <PlanSeats plan={plan} />

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
  const router = useRouter();
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
          mutedTitle
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
        })} · ${t('plan.seatsFree', { count: open })}`}
        action={t('common.profile')}
        onPressAction={() => router.push(`/people/${plan.host.id}`)}
      />

      <Button label={t('plan.withdraw')} variant="outline" onPress={onWithdraw} />
    </SheetSurface>
  );
}

/** The viewer is in: green badge, their face in the seats, chat as the action. */
function JoinedState({ plan, onLeave }: { plan: Plan; onLeave: () => void }) {
  const { t } = useTranslation();

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <PlanSheetHeader plan={plan} photoHeight={180} mascotSize={132} joined />

      <PlanHost plan={plan} />

      <PlanSeats plan={plan} />

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

/**
 * The viewer hosts this plan: seats, then whoever still wants in.
 *
 * The design gives each host state its own proportions — a tall photo and a
 * seats header while requests are outstanding, a short photo and a bare seat
 * row once the plan is fresh or full — so the geometry follows the state.
 */
function HostState({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  const open = openSeatCount(plan);
  const full = open === 0;
  const hasRequests = plan.requests.length > 0;

  // A plan with five seats lays them out smaller to fit the row.
  const wide = plan.capacity > 4;
  // Freshly published: nobody has asked yet and nothing is taken.
  const fresh = !hasRequests && !full;

  const seatRow = (
    <SeatList
      seats={seatsFor(plan, t('common.freeSeat'), `${t('common.you')} · ${t('plan.hostRole')}`)}
      size={full ? 68 : wide ? 58 : 72}
      gap={wide ? 8 : 10}
      even
      captionSize={wide ? 11 : 12}
      captionGap={6}
      tintedEmpty
    />
  );

  return (
    <SheetSurface gap={18} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <PlanSheetHeader
        plan={plan}
        photoHeight={hasRequests ? 220 : 160}
        mascotSize={hasRequests ? 148 : 118}
        hosting
        // A freshly published plan carries only the host badge.
        showCategory={!fresh}
        showDistance={false}
      />

      {full ? (
        seatRow
      ) : (
        <View className="gap-[12px]">
          <View className="flex-row items-baseline justify-between">
            <Text weight={600} className="text-[12px] tracking-[0.4px] text-ink-faint">
              {t('plan.seatsLabel')}
            </Text>
            <Text weight={600} className="text-[13px] text-category-games">
              {t('plan.seatsFree', { count: open })}
            </Text>
          </View>
          {seatRow}
        </View>
      )}

      <HostRequestList plan={plan} full={full} />
    </SheetSurface>
  );
}

/**
 * The × over the map, at the top left of the plan-on-map screen.
 *
 * The sheet states that open with a photo carry their own × in its top-right
 * corner, but the ones that do not — and the map behind the sheet — left no way
 * out but the system back gesture. This sits where the wordmark does on the map
 * itself, so it lands in the same place on every state.
 */
function CloseOverlay({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-[18px] rounded-full"
      style={[{ top: Math.max(70, insets.top + 11) }, shadows.chip]}
    >
      <CircleButton
        size={40}
        className="bg-surface"
        accessibilityLabel={t('common.close')}
        onPress={onPress}
      >
        <Glyph.CloseHeader size={13} />
      </CircleButton>
    </View>
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
  const { mutate: setMembership } = useSetMembership(id ?? '');

  if (!plan) {
    return (
      <View className="flex-1">
        <LinearGradient colors={gradients.map} className="absolute inset-0" />
        <SheetScrim />
        <CloseOverlay onPress={() => router.back()} />
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
        <RequestedState plan={plan} onWithdraw={() => setMembership('guest')} />
      ) : plan.membership === 'joined' ? (
        <JoinedState plan={plan} onLeave={() => router.push(`/plan/${plan.id}/leave`)} />
      ) : (
        <OpenState plan={plan} onJoin={() => router.push(`/plan/${plan.id}/join`)} />
      )}

      {/* Last, so a sheet tall enough to reach the top of the screen cannot
          bury the only control that closes it. */}
      <CloseOverlay onPress={() => router.back()} />
    </View>
  );
}
