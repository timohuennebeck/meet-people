import { Repeat } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { colors } from '@shared/theme/tokens';
import { Text } from '@shared/ui/text';

/**
 * What stands where the host card goes on a plan nobody organises.
 *
 * A standing meetup is a weekday, a time and a place — the Wednesday walk, the
 * Saturday 5k — and it has no organiser function at all. Putting a name against
 * one would invent a responsibility nobody took on, so the card says plainly
 * that there is no host rather than leaving a blank where a face belongs.
 *
 * It borrows `HostCard`'s shape on purpose: same sunken field, same 44px
 * leading element, same two lines. The thing it replaces sits in exactly this
 * slot, and a differently proportioned card would make the sheet look like it
 * had lost something.
 */
export function StandingMeetupCard() {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-[12px] rounded-field bg-surface-sunken p-[12px]">
      <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-brand-tint">
        <Repeat size={21} weight="bold" color={colors.brand} />
      </View>
      <View className="flex-1 gap-[2px]">
        <Text weight={600} className="text-[15px]">
          {t('plan.standingTitle')}
        </Text>
        <Text weight={600} className="text-[12px] text-ink-faint">
          {t('plan.standingDetail')}
        </Text>
      </View>
    </View>
  );
}
