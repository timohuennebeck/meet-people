import { View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Check } from './icons';
import { Text } from './Text';

export type TimelineState = 'done' | 'active' | 'pending';

/**
 * The 22px status dot: a filled brand circle with a tick when complete, an
 * amber pip while in progress, and a hollow `#C5D7F2` ring when not yet reached.
 */
function TimelineDot({ state }: { state: TimelineState }) {
  if (state === 'done') {
    return (
      <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-brand">
        <Check size={12} strokeWidth={2.8} />
      </View>
    );
  }
  if (state === 'active') {
    return (
      <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-warn-tint">
        <View className="h-[8px] w-[8px] rounded-full bg-warn" />
      </View>
    );
  }
  return <View className="h-[22px] w-[22px] rounded-full border-2 border-brand-line" />;
}

export interface TimelineStepProps {
  title: string;
  description: string;
  state: TimelineState;
  /** Right-aligned estimate beside the title, e.g. "~1 h". */
  estimate?: string;
  /** Height of the connector below the dot. 0 omits it on the final step. */
  connector?: number;
  /** Pulls the step up by 14px, as the design does for every step after the first. */
  tight?: boolean;
}

/** One row of a vertical progress timeline. */
export function TimelineStep({
  title,
  description,
  state,
  estimate,
  connector = 0,
  tight = false,
}: TimelineStepProps) {
  const muted = state !== 'done';

  return (
    <View className={cn('flex-row items-start gap-[14px]', tight && '-mt-[14px]')}>
      <View className="shrink-0 items-center gap-[4px]">
        <TimelineDot state={state} />
        {connector > 0 ? (
          <View className="w-[2px] bg-brand-rail" style={{ height: connector }} />
        ) : null}
      </View>
      <View className="flex-1">
        {estimate ? (
          <View className="flex-row items-baseline justify-between gap-[8px]">
            <Text weight={600} className={cn('text-[16px]', muted && 'text-ink-dim')}>
              {title}
            </Text>
            <Text weight={600} className="text-[13px] tracking-[0.2px] text-ink-trace">
              {estimate}
            </Text>
          </View>
        ) : (
          <Text weight={600} className={cn('text-[16px]', muted && 'text-ink-dim')}>
            {title}
          </Text>
        )}
        <Text className="mt-[3px] text-[14px] leading-[20.3px] text-ink-dim">{description}</Text>
      </View>
    </View>
  );
}
