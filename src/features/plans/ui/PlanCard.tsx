import { Clock, HandWaving, MapPinSimple } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Plan } from '@shared/data/schemas';
import { cn } from '@shared/lib/cn';
import { colors, shadows } from '@shared/theme/tokens';
import { Avatar, PlanPhoto, Text } from '@shared/ui';

import { PlanLanguages } from './PlanLanguages';
import { openSeatCount } from '../lib/seats';

/** One detail line under a plan's title: icon, then a single line of copy. */
function DetailLine({ icon, children }: { icon: React.ReactNode; children: string }) {
  return (
    <View className="flex-row items-center gap-[8px]">
      {icon}
      <Text weight={600} className="text-[13px] text-ink-body">
        {children}
      </Text>
    </View>
  );
}

/**
 * The overlapping avatar cluster on a plan card: two faces plus a "+N" pill,
 * positioned exactly as the design stacks them inside a 62×44 box.
 */
function AttendeeCluster({ plan }: { plan: Plan }) {
  const [first, second] = plan.participants;
  const remaining = plan.participants.length - 2;

  return (
    <View className="h-[44px] w-[62px] shrink-0">
      {first ? (
        <View className="absolute left-0 top-0 overflow-hidden rounded-full border-2 border-white">
          <Avatar uri={first.user.avatarUrl} size={28} />
        </View>
      ) : null}
      {second ? (
        <View className="absolute left-[24px] top-[8px] overflow-hidden rounded-full border-2 border-white">
          <Avatar uri={second.user.avatarUrl} size={28} />
        </View>
      ) : null}
      {remaining > 0 ? (
        <View className="absolute left-[2px] top-[16px] h-[28px] w-[28px] items-center justify-center rounded-full border-2 border-white bg-brand-tint">
          <Text weight={600} className="text-[11px] tracking-[-0.2px] text-brand">
            +{remaining}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * `300px` — the carousel card's width, as the design draws it. Exported because
 * the map's carousel derives its snap interval from it; keeping the number in
 * one place stops the two drifting apart.
 */
export const PLAN_CARD_WIDTH = 300;

export interface PlanCardProps {
  plan: Plan;
  /** The focused card shows full detail; the peeking one is title-only. */
  variant: 'full' | 'peek';
  onPress?: () => void;
}

/** `300px · radius:26px · padding:12px` — a plan in the map's bottom carousel. */
export function PlanCard({ plan, variant, onPress }: PlanCardProps) {
  const { t } = useTranslation();
  const openSeats = openSeatCount(plan);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'shrink-0 gap-[12px] rounded-card bg-surface p-[12px]',
        variant === 'peek' && 'opacity-90',
      )}
      style={[{ width: PLAN_CARD_WIDTH }, shadows.planCard]}
    >
      <PlanPhoto
        height={140}
        mascotSize={100}
        radius={18}
        trailing={
          variant === 'full' && openSeats !== null && openSeats > 0 ? (
            <View
              className="rounded-pill px-[10px] py-[6px]"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
            >
              <Text weight={600} className="text-[11px]">
                {t('plan.seatsFree', { count: openSeats })}
              </Text>
            </View>
          ) : null
        }
      />

      {variant === 'peek' ? (
        <Text weight={600} className="px-[4px] text-[18px] leading-[21.6px]">
          {plan.title}
        </Text>
      ) : (
        <>
          <View className="gap-[8px] px-[4px]">
            <Text weight={600} className="text-[18px] leading-[21.6px] tracking-[-0.3px]">
              {plan.title}
            </Text>
            <View className="gap-[6px]">
              <DetailLine icon={<Clock size={17} color={colors.inkFaint} />}>
                {plan.whenLabel}
              </DetailLine>
              <DetailLine icon={<MapPinSimple size={17} color={colors.inkFaint} />}>
                {`${plan.place.name} · a ${plan.place.distanceLabel}`}
              </DetailLine>
              <DetailLine icon={<HandWaving size={17} color={colors.inkFaint} />}>
                {`${
                  plan.capacity === null
                    ? t('plan.participatingUncapped', { count: plan.participants.length })
                    : t('plan.participating', {
                        filled: String(plan.participants.length),
                        total: String(plan.capacity),
                      })
                } · ${
                  plan.host ? t('plan.hostLine', { name: plan.host.name }) : t('plan.standingLine')
                }`}
              </DetailLine>
            </View>

            {/* Which languages the evening runs in, under the seat and host
                line and above the actions — the last thing read before the
                decision to open the plan at all. */}
            <PlanLanguages codes={plan.languages} className="mt-[2px]" />
          </View>

          <View className="flex-row items-center gap-[8px] px-[4px] pb-[4px]">
            <AttendeeCluster plan={plan} />
            <View className="h-[46px] flex-1 items-center justify-center rounded-pill bg-brand">
              <Text weight={600} className="text-[15px] text-white">
                {t('map.preview')}
              </Text>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}
