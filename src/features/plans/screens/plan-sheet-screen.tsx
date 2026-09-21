import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useOpenPlanChat } from '@shared/data/queries/use-chat';
import { usePlan, useSetMembership } from '@shared/data/queries/use-plans';
import type { Plan } from '@shared/data/schemas';
import { formatMonthYear } from '@shared/lib/datetime';
import { Button, TextButton } from '@shared/ui/button';
import { HostCard } from '@shared/ui/person-row';
import { SeatList, SeatSummary } from '@shared/ui/seats';
import { SheetSurface } from '@shared/ui/sheet';
import { Text } from '@shared/ui/text';
import { TimelineStep } from '@shared/ui/timeline';

import { hasEnded } from '../lib/attendance';
import { openSeatCount, openSeatsLabel, participatingLabel, seatsFor } from '../lib/seats';
import { HostRequestList } from '../ui/host-request-list';
import { PlanLanguages } from '../ui/plan-languages';
import { PlanSheetHeader } from '../ui/plan-sheet-header';
import { StandingMeetupCard } from '../ui/standing-meetup-card';

/**
 * The host summary the open and joined sheets both open with — or, on a plan
 * with no host, the card that says so. A standing meetup has no organiser, so
 * there is no face to show and nobody to name.
 */
function PlanHost({ plan }: { plan: Plan }) {
  const { t, i18n } = useTranslation();
  const host = plan.host;

  if (!host) return <StandingMeetupCard />;

  // The design writes "Em Berlim desde março · hospeda pela 4ª vez" here. The
  // second half is a count of the plans this person has hosted, which the
  // embedded host does not carry — `nearby_plans()` returns the profile row
  // and nothing computed over it — and the first half is a city, which no
  // column holds. So the line says what the row does answer: the neighbourhood
  // they put on their profile, and the month they joined.
  const month = formatMonthYear(new Date(host.joinedAt), i18n.language);

  return (
    <HostCard
      avatarUri={host.avatarUrl}
      name={`${host.name}, ${host.age}`}
      detail={
        host.neighbourhood
          ? t('plan.hostSinceIn', { place: host.neighbourhood, month })
          : t('plan.hostSince', { month })
      }
      verified={host.verified}
    />
  );
}

/**
 * The seat count and the row of faces under it.
 *
 * An uncapped event counts who is coming rather than how many places are left:
 * "3 de 6" and "3 vagas livres" both describe a plan with an end, and this one
 * has none.
 */
function PlanSeats({ plan }: { plan: Plan }) {
  const { t } = useTranslation();

  return (
    <View className="gap-[10px]">
      <SeatSummary filled={participatingLabel(plan, t)} open={openSeatsLabel(plan, t)} />
      <SeatList
        seats={seatsFor({ plan, freeLabel: t('common.freeSeat'), viewerLabel: t('common.you') })}
        size={52}
        gap={14}
      />
    </View>
  );
}

/** The plan is open and the viewer can ask to join. */
function OpenState({
  plan,
  onJoin,
  onDismiss,
}: {
  plan: Plan;
  onJoin: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 40 }}>
      <PlanSheetHeader plan={plan} photoHeight={220} mascotSize={148} titleGap={6} />

      <PlanHost plan={plan} />

      {/* Between the host and the seats, the same chips the card carries: the
          guest deciding whether to ask for a seat is the reader this answer
          was written for, so it must not be lost on the way into the sheet. */}
      <PlanLanguages codes={plan.languages} />

      <PlanSeats plan={plan} />

      {plan.description ? (
        <Text weight={500} className="text-[14px] leading-[21px] text-ink-body">
          {plan.description}
        </Text>
      ) : null}

      <View className="gap-[10px]">
        <Button label={t('plan.askToJoin')} variant="primarySheet" onPress={onJoin} />
        <TextButton label={t('plan.maybeLater')} tone="muted" onPress={onDismiss} />
      </View>
    </SheetSurface>
  );
}

/** The request is in; the primary action becomes withdrawing it. */
function RequestedState({ plan, onWithdraw }: { plan: Plan; onWithdraw: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();

  // Only an approval plan can leave someone waiting, and only a plan with a
  // host can be an approval plan — there is nobody else to do the approving.
  // So this state never renders without a host; the guard is for the compiler.
  const host = plan.host;
  if (!host) return null;

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <PlanSheetHeader plan={plan} photoHeight={180} mascotSize={132} />

      <View className="gap-[20px] py-[2px]">
        <TimelineStep
          state="done"
          connector={38}
          title={t('plan.sent.title')}
          description={t('plan.sent.body', { name: host.name })}
        />
        <TimelineStep
          state="active"
          tight
          mutedTitle
          estimate={t('plan.sent.confirmEstimate')}
          title={t('plan.sent.confirmTitle', { name: host.name })}
          description={t('plan.sent.confirmBody')}
        />
      </View>

      <HostCard
        avatarUri={host.avatarUrl}
        name={`${host.name}, ${host.age}`}
        detail={`${participatingLabel(plan, t)} · ${openSeatsLabel(plan, t)}`}
        action={t('common.profile')}
        onPressAction={() => router.push(`/people/${host.id}`)}
      />

      <Button label={t('plan.withdraw')} variant="outline" onPress={onWithdraw} />
    </SheetSurface>
  );
}

/**
 * The viewer is in: green badge, their face in the seats, chat as the action.
 *
 * The second action follows the clock. Until the plan ends it is the way out of
 * it; afterwards there is nothing left to leave, and the slot asks the question
 * the plan has just raised instead — who actually turned up.
 */
function JoinedState({
  plan,
  onLeave,
  onReview,
  onOpenChat,
}: {
  plan: Plan;
  onLeave: () => void;
  onReview: () => void;
  onOpenChat: () => void;
}) {
  const { t } = useTranslation();
  const ended = hasEnded(plan);

  return (
    <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 36 }}>
      <PlanSheetHeader plan={plan} photoHeight={180} mascotSize={132} joined />

      <PlanHost plan={plan} />

      <PlanLanguages codes={plan.languages} />

      <PlanSeats plan={plan} />

      <View className="gap-[10px]">
        {plan.description ? (
          <Text weight={500} className="mb-[4px] text-[14.5px] leading-[21px] text-ink-body">
            {plan.description}
          </Text>
        ) : null}
        <Button label={t('plan.openGroupChat')} variant="primarySheet" onPress={onOpenChat} />
        {ended ? (
          <TextButton label={t('plan.attendance.open')} tone="muted" onPress={onReview} />
        ) : (
          <TextButton label={t('plan.notGoing')} tone="muted" onPress={onLeave} />
        )}
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
function HostState({ plan, onOpenChat }: { plan: Plan; onOpenChat: () => void }) {
  const { t } = useTranslation();
  const open = openSeatCount(plan);
  // An uncapped plan never reads as full, so the seats header stays.
  const full = open === 0;
  const hasRequests = plan.requests.length > 0;

  // A plan with five seats lays them out smaller to fit the row, and so does an
  // uncapped one, which has however many people have turned up.
  const wide = plan.capacity === null || plan.capacity > 4;

  const seatRow = (
    <SeatList
      seats={seatsFor({
        plan,
        freeLabel: t('common.freeSeat'),
        viewerLabel: `${t('common.you')} · ${t('plan.hostRole')}`,
      })}
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
      {/* The only plan state that can outgrow the screen: a tall photo, the
          seat grid and a row per pending request. `fitToContents` stops
          growing the sheet at the full detent, so past that the content has to
          scroll. The sheet's own gap moves into the scroll content, and the
          ScrollView is deliberately left unstretched — `flex-1` here would
          measure to zero and the sheet with it. */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18 }}>
        <PlanSheetHeader
          plan={plan}
          photoHeight={hasRequests ? 220 : 160}
          mascotSize={hasRequests ? 148 : 118}
          hosting
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
              <Text weight={600} className="text-[13px] text-ink-slate">
                {open === null ? t('plan.seatsUnlimited') : t('plan.seatsFree', { count: open })}
              </Text>
            </View>
            {seatRow}
          </View>
        )}

        <HostRequestList plan={plan} full={full} onOpenChat={onOpenChat} />
      </ScrollView>
    </SheetSurface>
  );
}

/**
 * The plan detail sheet. Which state renders follows the viewer's membership,
 * so the same route serves the guest and host flows.
 *
 * Nothing here draws a map, a scrim or a close button any more: the route is a
 * native form sheet, so the real map sits behind it, the system dims it, and
 * the grabber, the swipe down and the tap outside all dismiss it. Every state
 * is its own `SheetSurface` because the design gives each its own padding.
 *
 * `useSafeAreaInsets` is gone with the close button. The sheet no longer runs
 * to the bottom of the window — it stops above the home indicator, and
 * `fitToContents` adds a little bottom inset of its own on iOS — so adding the
 * inset to the design's bottom padding would now count it twice.
 */
export function PlanSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: plan } = usePlan(id ?? '');
  const { mutate: setMembership } = useSetMembership(id ?? '');
  const { mutate: openPlanChat } = useOpenPlanChat();

  /**
   * The plan's group chat, which `private.open_plan_chat()` made on the plan's
   * own insert. A plan that predates that trigger has none, and the button
   * stays where it is rather than pushing an empty thread.
   */
  const openChat = () => {
    if (!plan) return;
    openPlanChat(plan.id, {
      onSuccess: (conversationId) => {
        if (conversationId) router.push(`/chat/${conversationId}`);
      },
    });
  };

  // A sheet sized to its contents has no height while the plan is loading, so
  // hold the open state's photo height rather than flashing an empty sliver.
  if (!plan) {
    return (
      <SheetSurface gap={16} padding={{ top: 12, horizontal: 18, bottom: 40 }}>
        <View className="h-[220px]" />
      </SheetSurface>
    );
  }

  if (plan.membership === 'host') return <HostState plan={plan} onOpenChat={openChat} />;

  if (plan.membership === 'requested') {
    return <RequestedState plan={plan} onWithdraw={() => setMembership({ membership: 'guest' })} />;
  }

  if (plan.membership === 'joined') {
    return (
      <JoinedState
        plan={plan}
        onLeave={() => router.push(`/plan/${plan.id}/leave`)}
        onReview={() => router.push(`/plan/${plan.id}/attendance`)}
        onOpenChat={openChat}
      />
    );
  }

  return (
    <OpenState
      plan={plan}
      onJoin={() => router.push(`/plan/${plan.id}/join`)}
      onDismiss={() => router.back()}
    />
  );
}
