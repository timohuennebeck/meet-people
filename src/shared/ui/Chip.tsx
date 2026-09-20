import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { shadows } from '@shared/theme/tokens';

import { CloseSmall } from './icons';
import { Text } from './Text';

/**
 * Pill recipes. The design uses a dozen near-identical chips that differ only
 * in padding, type size and fill, so each is named after where it appears.
 */
const CHIPS = {
  /** `9px 14px · 13px/600` — the Today / Tomorrow / Weekend map filters. */
  filter: { padding: 'px-[14px] py-[9px]', text: 'text-[13px]', weight: 600 as const },
  /** `10px 14px · 14.5px` — join-request suggestions and profile interests. */
  soft: { padding: 'px-[14px] py-[10px]', text: 'text-[14.5px]', weight: 400 as const },
  /** `9px 13px · 14px/500` — the cancellation reason chips. */
  reason: { padding: 'px-[13px] py-[9px]', text: 'text-[14px]', weight: 500 as const },
  /** `10px 15px · 15px` — the "+ suggestion" chips under a tag field. */
  suggestion: { padding: 'px-[15px] py-[10px]', text: 'text-[15px]', weight: 400 as const },
  /** `11px 16px · 14.5px` — the time and duration chips in the create flow. */
  time: { padding: 'px-[16px] py-[11px]', text: 'text-[14.5px]', weight: 400 as const },
  /** `9px 14px · 14.5px` — the place category chips. */
  place: { padding: 'px-[14px] py-[9px]', text: 'text-[14.5px]', weight: 400 as const },
  /** `8px 14px · 13.5px` — the people / plans / places search scopes. */
  scope: { padding: 'px-[14px] py-[8px]', text: 'text-[13.5px]', weight: 500 as const },
  /** `9px 0 · 14.5px` — the radius presets, which share the row's width evenly. */
  preset: { padding: 'px-0 py-[9px]', text: 'text-[14.5px]', weight: 500 as const },
  /** `10px 0 · 14.5px` — the age presets, one pixel taller than the radius ones. */
  presetTall: { padding: 'px-0 py-[10px]', text: 'text-[14.5px]', weight: 500 as const },
  /** `9px 12px 9px 14px · 15px/600` — a committed interest tag with its ×. */
  tag: { padding: 'py-[9px] pl-[14px] pr-[12px]', text: 'text-[15px]', weight: 600 as const },
} as const;

export type ChipSize = keyof typeof CHIPS;

/**
 * Fill treatments, independent of size.
 *
 * Only the outlined tones have a ring in the design, but a React Native border
 * takes its width out of the element, so a chip that swaps an outlined tone for
 * a filled one would shrink by 2px and shunt its row. Every tone therefore
 * carries a 1px border in its own fill colour, which is invisible and keeps all
 * chips the same size whichever tone they are wearing.
 */
const TONES = {
  /** `#2F7CF6` on white text — selected. */
  brand: { container: 'border border-brand bg-brand', text: 'text-white', selectedWeight: true },
  /** `#F1F4F9` — the default resting fill. */
  fill: {
    container: 'border border-surface-fill bg-surface-fill',
    text: 'text-ink-body',
    selectedWeight: false,
  },
  /** `#EEF2F8` — the slightly cooler resting fill used by time chips. */
  chip: {
    container: 'border border-surface-chip bg-surface-chip',
    text: 'text-ink-body',
    selectedWeight: false,
  },
  /** White with a `0 0 0 1px #E6EBF3` ring — suggestion chips. */
  outline: {
    container: 'bg-surface border border-hair',
    text: 'text-ink-body',
    selectedWeight: false,
  },
  /** As `outline`, but with the darker label the place filters use. */
  outlineStrong: {
    container: 'bg-surface border border-hair',
    text: 'text-ink-strong',
    selectedWeight: false,
  },
  /** White with a soft drop shadow — the resting map filter chips. */
  raised: { container: 'border border-surface bg-surface', text: 'text-ink', selectedWeight: true },
} as const;

export type ChipTone = keyof typeof TONES;

export interface ChipProps {
  label: string;
  size?: ChipSize;
  tone?: ChipTone;
  onPress?: () => void;
  /**
   * Adds the trailing × that removes a committed tag. Only the × removes — the
   * label itself is not a delete target, and keeps `onPress` if one is given.
   */
  onRemove?: () => void;
  /** Stretches the chip to share width evenly with its siblings. */
  grow?: boolean;
  className?: string;
}

/** The rounded label used for filters, suggestions, tags and quick replies. */
export function Chip({
  label,
  size = 'soft',
  tone = 'fill',
  onPress,
  onRemove,
  grow = false,
  className,
}: ChipProps) {
  const { t } = useTranslation();
  const recipe = CHIPS[size];
  const palette = TONES[tone];
  const weight = palette.selectedWeight ? 600 : recipe.weight;

  const content = (
    <>
      <Text weight={weight} className={cn(recipe.text, palette.text, grow && 'text-center')}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.remove', { label })}
          // The glyph is 11px, so the target is grown outwards rather than in.
          hitSlop={10}
          onPress={onRemove}
        >
          <CloseSmall size={11} />
        </Pressable>
      ) : null}
    </>
  );

  const classes = cn(
    'flex-row items-center justify-center gap-[8px] rounded-pill',
    recipe.padding,
    palette.container,
    grow && 'flex-1',
    className,
  );

  if (!onPress) {
    return (
      <View className={classes} style={tone === 'raised' ? shadows.chipSoft : undefined}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={classes}
      style={tone === 'raised' ? shadows.chipSoft : undefined}
    >
      {content}
    </Pressable>
  );
}

export interface BadgeProps {
  label: string;
  /** Background fill — a category colour, or translucent white. */
  className?: string;
  /** Label colour; defaults to white, which every filled badge uses. */
  textClassName?: string;
}

/**
 * `6px 10px · 11px/600 · .4em tracking` — the category and status badges laid
 * over a plan photo ("ESPORTE", "VOCÊ É HOST", "3 vagas livres").
 */
export function Badge({ label, className, textClassName = 'text-white' }: BadgeProps) {
  return (
    <View className={cn('rounded-pill px-[10px] py-[6px]', className)}>
      <Text weight={600} className={cn('text-[11px] tracking-[0.4px]', textClassName)}>
        {label}
      </Text>
    </View>
  );
}

/** `min-w-22 h-22 · 12.5px/600` — the blue unread count on a conversation row. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <View
      className={cn(
        'h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-brand px-[6px]',
        className,
      )}
    >
      <Text weight={600} className="text-[12.5px] text-white">
        {count}
      </Text>
    </View>
  );
}
