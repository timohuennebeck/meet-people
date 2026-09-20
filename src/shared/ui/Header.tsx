import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { haptics } from '@shared/lib/haptics';

import { ChevronLeft, CloseHeader } from './icons';
import { Text } from './Text';

export interface CircleButtonProps {
  children: ReactNode;
  onPress?: () => void;
  /** Diameter in px. The design uses 34 in step headers and 40 in nav headers. */
  size?: number;
  className?: string;
  /**
   * Required: the glyph inside carries no accessible name of its own, and the
   * same circle is a back chevron on one screen and an overflow, close or
   * compose button on the next.
   */
  accessibilityLabel: string;
}

/** The round, tinted tap target that holds a back chevron or overflow glyph. */
export function CircleButton({
  children,
  onPress,
  size = 40,
  className,
  accessibilityLabel,
}: CircleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={
        onPress &&
        (() => {
          haptics.tap();
          onPress();
        })
      }
      className={cn(
        'shrink-0 items-center justify-center rounded-full bg-surface-chip active:opacity-60',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </Pressable>
  );
}

export interface ProgressHeaderProps {
  /** 1-based index of the current step. */
  step: number;
  /** Total steps, shown as "{step} de {total}". */
  total: number;
  /**
   * Fill fraction 0–1. The design hand-tunes these (6%, 12%, 18%, 22%…) rather
   * than deriving them from step/total, so screens pass the exact value.
   */
  progress: number;
  /** Renders an × instead of a back chevron, as the skippable steps do. */
  dismissible?: boolean;
  onBack?: () => void;
  className?: string;
}

/**
 * `34px circle · 6px track · "N de M"` — the header on every onboarding and
 * create-plan step.
 */
export function ProgressHeader({
  step,
  total,
  progress,
  dismissible = false,
  onBack,
  className,
}: ProgressHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className={cn('h-[34px] shrink-0 flex-row items-center gap-[12px]', className)}>
      <CircleButton
        size={34}
        accessibilityLabel={dismissible ? t('common.close') : t('common.back')}
        onPress={onBack}
      >
        {dismissible ? <CloseHeader size={11} /> : <ChevronLeft size={11} strokeWidth={1.9} />}
      </CircleButton>
      <View className="h-[6px] flex-1 overflow-hidden rounded-[4px] bg-hair-rail">
        <View
          className="h-full rounded-[4px] bg-brand"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>
      <Text weight={500} className="shrink-0 text-[14.5px] text-ink-dim">
        {t('common.stepOf', { step: String(step), total: String(total) })}
      </Text>
    </View>
  );
}

export interface NavHeaderProps {
  title: string;
  onBack?: () => void;
  className?: string;
}

/**
 * `40px circle · absolutely-centred 17px/600 title` — the header on settings
 * pages and other pushed detail screens. The title is centred against the
 * screen rather than the remaining space, exactly as in the design.
 */
export function NavHeader({ title, onBack, className }: NavHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className={cn('relative h-[40px] shrink-0 flex-row items-center', className)}>
      <CircleButton size={40} accessibilityLabel={t('common.back')} onPress={onBack}>
        <ChevronLeft size={13} />
      </CircleButton>
      <Text
        weight={600}
        className="absolute left-0 right-0 text-center text-[17px] tracking-[-0.17px]"
        pointerEvents="none"
      >
        {title}
      </Text>
    </View>
  );
}

export interface SearchHeaderProps {
  title: string;
  onBack?: () => void;
}

/**
 * `34px circle · centred 16px/600 title · 34px spacer` — the header on the
 * language search screen, where the title is centred between two equal gutters.
 */
export function SearchHeader({ title, onBack }: SearchHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="h-[34px] shrink-0 flex-row items-center gap-[12px]">
      <CircleButton size={34} accessibilityLabel={t('common.back')} onPress={onBack}>
        <ChevronLeft size={11} strokeWidth={1.9} />
      </CircleButton>
      <Text weight={600} className="flex-1 text-center text-[16px]">
        {title}
      </Text>
      <View className="w-[34px]" />
    </View>
  );
}
