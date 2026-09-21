import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useAcceptRequest, useAddSeat, useDeclineRequest } from '@shared/data/queries/use-plans';
import type { Plan } from '@shared/data/schemas';
import { Button } from '@shared/ui/button';
import { SectionLabel } from '@shared/ui/card';
import { GlowingMascot } from '@shared/ui/mascot';
import { ActionPill, PersonRow } from '@shared/ui/person-row';
import { Text } from '@shared/ui/text';

import { sharePlan } from '../lib/share';

/** `1.5px dashed` panel shown while a freshly published plan has no requests. */
function NoRequestsYet({ plan }: { plan: Plan }) {
  const { t } = useTranslation();

  return (
    <View className="gap-[12px]">
      <SectionLabel sheet>{t('plan.requestsLabel')}</SectionLabel>
      <View className="items-center gap-[8px] rounded-well border-[1.5px] border-dashed border-hair-mid p-[18px]">
        <GlowingMascot />
        <Text weight={600} className="text-[15px]">
          {t('plan.noRequestsTitle')}
        </Text>
        <Text
          weight={500}
          className="max-w-[270px] text-center text-[13.5px] leading-[19.6px] text-ink-faint"
        >
          {t('plan.noRequestsBody')}
        </Text>
      </View>
      <Button
        label={t('plan.inviteFriends')}
        variant="outlineBrand"
        onPress={() => void sharePlan(plan.id, plan.title)}
      />
    </View>
  );
}

export interface HostRequestListProps {
  plan: Plan;
  /** Switches to the waitlist presentation once every seat is taken. */
  full: boolean;
  /** Opens the plan's group chat, which the host's full state leads with. */
  onOpenChat: () => void;
}

/**
 * The host's view of who wants in: pending requests while seats remain, or the
 * waitlist plus a chat action once the plan is full.
 */
export function HostRequestList({ plan, full, onOpenChat }: HostRequestListProps) {
  const { t } = useTranslation();
  const { mutate: accept } = useAcceptRequest(plan.id);
  const { mutate: decline } = useDeclineRequest(plan.id);
  const { mutate: addSeat } = useAddSeat(plan.id);

  if (full) {
    return (
      <>
        <View className="gap-[12px]">
          <SectionLabel sheet>
            {t('plan.waitlistCount', { count: plan.waitlist.length })}
          </SectionLabel>
          {plan.waitlist.map((request) => (
            <PersonRow
              key={request.id}
              avatarUri={request.user.avatarUrl}
              name={`${request.user.name}, ${request.user.age}`}
              detail={t('plan.waitlistNote')}
              trailing={
                <ActionPill label={t('plan.addSeat')} muted onPress={() => addSeat(request.id)} />
              }
            />
          ))}
        </View>
        <Button label={t('plan.openGroupChatHost')} variant="primarySheet" onPress={onOpenChat} />
      </>
    );
  }

  if (plan.requests.length === 0) return <NoRequestsYet plan={plan} />;

  return (
    <View className="gap-[12px]">
      <SectionLabel sheet>{t('plan.requestsCount', { count: plan.requests.length })}</SectionLabel>

      {plan.requests.map((request) => (
        // The line under this list has always promised a swipe; until now
        // nothing was bound to it, so a request could only ever be accepted.
        // The accessibility action is the same answer for anyone not swiping.
        <Swipeable
          key={request.id}
          renderRightActions={() => (
            <View className="my-[2px] ml-[10px] justify-center rounded-well bg-danger px-[20px]">
              <Text weight={600} className="text-[14px] text-white">
                {t('plan.decline')}
              </Text>
            </View>
          )}
          onSwipeableOpen={(direction) => {
            if (direction === 'right') decline(request.id);
          }}
        >
          <View
            accessibilityActions={[{ name: 'decline', label: t('plan.decline') }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'decline') decline(request.id);
            }}
          >
            <PersonRow
              avatarUri={request.user.avatarUrl}
              name={`${request.user.name}, ${request.user.age}`}
              verified={request.user.verified}
              // A quoted message when there is one, otherwise their track record.
              detail={request.message ? `„${request.message}"` : (request.note ?? '')}
              trailing={
                <ActionPill
                  label={t('plan.accept')}
                  // Unverified applicants get the outlined pill, a softer yes.
                  outlined={!request.user.verified}
                  onPress={() => accept(request.id)}
                />
              }
            />
          </View>
        </Swipeable>
      ))}

      <Text weight={600} className="pt-[4px] text-center text-[12px] text-ink-dim">
        {t('plan.swipeToDecline')}
      </Text>
    </View>
  );
}
