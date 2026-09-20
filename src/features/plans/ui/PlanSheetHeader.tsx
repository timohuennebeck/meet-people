import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Plan } from '@shared/data/schemas';
import { cn } from '@shared/lib/cn';
import { Badge, CATEGORY_STYLE, PlanPhoto, Text } from '@shared/ui';

export interface PlanSheetHeaderProps {
  plan: Plan;
  /** Photo height: 220 open, 180 for status sheets, 160 for the host sheet. */
  photoHeight: number;
  mascotSize: number;
  /** Replaces the category badge with the green "you're in" badge. */
  joined?: boolean;
  /** Adds the white "VOCÊ É HOST" badge next to the category. */
  hosting?: boolean;
  /** Trims the trailing distance from the meta line, as the host sheet does. */
  hideDistance?: boolean;
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
  hideDistance = false,
  titleGap = 4,
}: PlanSheetHeaderProps) {
  const { t } = useTranslation();

  const categoryLabel =
    plan.category === 'sport' ? t('plan.categorySport') : t('plan.categoryGames');
  const meta = hideDistance ? plan.whenLabel.split(' · ').slice(0, 2).join(' · ') : plan.whenLabel;

  return (
    <>
      <PlanPhoto
        height={photoHeight}
        mascotSize={mascotSize}
        dismissible
        leading={
          joined ? (
            <Badge label={t('plan.joinedBadge')} className="bg-category-sport" />
          ) : (
            <>
              <Badge label={categoryLabel} className={cn(CATEGORY_STYLE[plan.category])} />
              {hosting ? (
                <Badge
                  label={t('plan.hostBadge')}
                  className="bg-white/[0.92]"
                  textClassName="text-ink"
                />
              ) : null}
            </>
          )
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
