import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Plan } from '@shared/data/schemas';
import { Badge, PlanPhoto, Text } from '@shared/ui';

export interface PlanSheetHeaderProps {
  plan: Plan;
  /** Photo height: 220 open, 180 for status sheets, 160 for the host sheet. */
  photoHeight: number;
  mascotSize: number;
  /** Shows the green "you're in" badge on the photo. */
  joined?: boolean;
  /** Shows the white "VOCÊ É HOST" badge on the photo. */
  hosting?: boolean;
  /**
   * Appends the distance to the meta line. Guests see how far the plan is;
   * the host, who set the place, does not.
   */
  showDistance?: boolean;
  /** Gap under the photo: 6px on the open sheet, 4px elsewhere. */
  titleGap?: number;
}

/**
 * The photo, title and meta line every plan sheet opens with. Only the badges
 * and the photo height change between states.
 */
export function PlanSheetHeader({
  plan,
  photoHeight,
  mascotSize,
  joined = false,
  hosting = false,
  showDistance = true,
  titleGap = 4,
}: PlanSheetHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const meta = showDistance ? `${plan.whenLabel} · ${plan.place.distanceLabel}` : plan.whenLabel;

  return (
    <>
      <PlanPhoto
        height={photoHeight}
        mascotSize={mascotSize}
        onDismiss={() => router.back()}
        dismissLabel={t('common.close')}
        leading={
          joined ? (
            <Badge label={t('plan.joinedBadge')} className="bg-joined" />
          ) : hosting ? (
            <Badge
              label={t('plan.hostBadge')}
              className="bg-white/[0.92]"
              textClassName="text-ink"
            />
          ) : null
        }
      />

      <View style={{ gap: titleGap }}>
        <Text weight={600} className="text-[24px] leading-[27.6px] tracking-[-0.5px]">
          {plan.title}
        </Text>
        <Text weight={600} className="text-[14px] text-ink-faint">
          {meta}
        </Text>
      </View>
    </>
  );
}
