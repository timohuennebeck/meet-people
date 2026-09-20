import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Plan } from '@shared/data/schemas';
import { ActionPill, Button, GlowingMascot, PersonRow, SectionLabel, Text } from '@shared/ui';

import { useAcceptRequest } from '../data/usePlans';

/** `1.5px dashed` panel shown while a freshly published plan has no requests. */
function NoRequestsYet() {
  const { t } = useTranslation();

  return (
    <View className="gap-[12px]">
      <SectionLabel className="tracking-[0.4px]">{t('plan.requestsLabel')}</SectionLabel>
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
      <Button label={t('plan.inviteFriends')} variant="outlineBrand" />
    </View>
  );
}

export interface HostRequestListProps {
  plan: Plan;
  /** Switches to the waitlist presentation once every seat is taken. */
  full: boolean;
}

/**
 * The host's view of who wants in: pending requests while seats remain, or the
 * waitlist plus a chat action once the plan is full.
 */
export function HostRequestList({ plan, full }: HostRequestListProps) {
  const { t } = useTranslation();
  const { mutate: accept } = useAcceptRequest();

  if (full) {
    return (
      <>
        <View className="gap-[12px]">
          <SectionLabel className="tracking-[0.4px]">
            {t('plan.waitlistCount', { count: plan.waitlist.length })}
          </SectionLabel>
          {plan.waitlist.map((request) => (
            <PersonRow
              key={request.id}
              avatarUri={request.user.avatarUrl}
              name={`${request.user.name}, ${request.user.age}`}
              detail={t('plan.waitlistNote')}
              trailing={<ActionPill label={t('plan.addSeat')} muted />}
            />
          ))}
        </View>
        <Button label={t('plan.openGroupChatHost')} variant="primarySheet" />
      </>
    );
  }

  if (plan.requests.length === 0) return <NoRequestsYet />;

  return (
    <View className="gap-[12px]">
      <SectionLabel className="tracking-[0.4px]">
        {t('plan.requestsCount', { count: plan.requests.length })}
      </SectionLabel>

      {plan.requests.map((request) => (
        <PersonRow
          key={request.id}
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
              onPress={() => accept({ planId: plan.id, requestId: request.id })}
            />
          }
        />
      ))}

      <Text weight={600} className="pt-[4px] text-center text-[12px] text-ink-dim">
        {t('plan.swipeToDecline')}
      </Text>
    </View>
  );
}
