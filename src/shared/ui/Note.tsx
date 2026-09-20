import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { VerifiedSeal } from './Avatar';
import { Check, CheckSeal } from './icons';
import { Text } from './Text';

export interface NoteProps {
  children: string;
  /** Rendered at the leading edge — a seal, an icon or a warning pip. */
  icon?: ReactNode;
  className?: string;
  textClassName?: string;
}

/**
 * A tinted explanatory row: `radius:18–20px · padding:12–14px · 13.5–14.5px`.
 * Used for privacy notes, host reassurance and the amber cancellation warning.
 */
export function Note({ children, icon, className, textClassName }: NoteProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-[12px] rounded-well bg-surface-app p-[14px]',
        className,
      )}
    >
      {icon}
      <Text className={cn('flex-1 text-[14.5px] leading-[20.3px] text-ink-body', textClassName)}>
        {children}
      </Text>
    </View>
  );
}

/** The privacy note with the verification seal, e.g. "Phil sees your profile…". */
export function SealNote({ children }: { children: string }) {
  return (
    <Note
      className="rounded-well bg-surface-app px-[16px] py-[14px]"
      icon={<VerifiedSeal size={34} />}
    >
      {children}
    </Note>
  );
}

/** `#FFF4E8` amber note with an `!` pip — shown when leaving a plan. */
export function WarningNote({ children }: { children: string }) {
  return (
    <View className="flex-row items-start gap-[12px] rounded-field bg-warn-wash px-[14px] py-[12px]">
      <View className="h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-warn-solid">
        <Text weight={600} className="text-[13px] leading-[13px] text-white">
          !
        </Text>
      </View>
      <Text weight={500} className="flex-1 text-[13.5px] leading-[19.6px] text-warn-ink">
        {children}
      </Text>
    </View>
  );
}

/** `#E6F0FE` note with a filled brand icon bubble — the create-plan hint. */
export function InfoNote({ children, icon }: { children: string; icon: ReactNode }) {
  return (
    <View className="flex-row items-center gap-[12px] rounded-well bg-brand-mist p-[16px]">
      <View className="h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-brand">
        {icon}
      </View>
      <Text className="flex-1 text-[14.5px] leading-[19.6px] text-brand-deep">{children}</Text>
    </View>
  );
}

/** A checked benefit line — used on the paywall and the verification success screen. */
export function CheckLine({
  children,
  variant = 'plain',
}: {
  children: string;
  variant?: 'plain' | 'card';
}) {
  const dot = (
    <View
      className={cn(
        'shrink-0 items-center justify-center rounded-full bg-brand',
        variant === 'card' ? 'h-[28px] w-[28px]' : 'h-[23px] w-[23px]',
      )}
    >
      {variant === 'card' ? (
        <CheckSeal size={14} strokeWidth={3} />
      ) : (
        <Check size={12} strokeWidth={2.8} />
      )}
    </View>
  );

  if (variant === 'card') {
    return (
      <View className="flex-row items-center gap-[12px] rounded-well bg-surface px-[16px] py-[14px]">
        {dot}
        <Text className="flex-1 text-[14.5px] leading-[20.3px] text-ink-body">{children}</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-[11px]">
      {dot}
      <Text className="flex-1 text-[15px]">{children}</Text>
    </View>
  );
}
