import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';

import { Avatar, VerifiedSeal } from './avatar';
import { Text } from './text';

export interface HostCardProps {
  avatarUri: string;
  /** Name and age as one string, e.g. "Phil, 23". */
  name: string;
  /** Second line — tenure, or the current seat count. */
  detail: string;
  verified?: boolean;
  /** Trailing action label, e.g. "Perfil". */
  action?: string;
  onPressAction?: () => void;
}

/**
 * `#F3F6FA · radius:18px · padding:12px · 44px avatar` — the host summary that
 * appears in most plan sheets.
 */
export function HostCard({
  avatarUri,
  name,
  detail,
  verified = true,
  action,
  onPressAction,
}: HostCardProps) {
  return (
    <View className="flex-row items-center gap-[12px] rounded-field bg-surface-sunken p-[12px]">
      <Avatar uri={avatarUri} size={44} />
      <View className="flex-1 gap-[2px]">
        <View className="flex-row items-center gap-[6px]">
          <Text weight={600} className="text-[15px]">
            {name}
          </Text>
          {verified ? <VerifiedSeal size={20} inset /> : null}
        </View>
        <Text weight={600} className="text-[12px] text-ink-faint">
          {detail}
        </Text>
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onPressAction}>
          <Text weight={600} className="text-[13px] text-brand">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface PersonRowProps {
  avatarUri: string;
  name: string;
  detail: string;
  verified?: boolean;
  /** Avatar diameter: 48 for join requests, 50 for search results. */
  size?: 48 | 50;
  /** Trailing control — an "Aceitar" pill or an outlined "Perfil" button. */
  trailing?: ReactNode;
  onPress?: () => void;
}

/**
 * A person with their avatar, name, verification seal and one line of context.
 * Shared by the host's request list, the waitlist and people search.
 */
export function PersonRow({
  avatarUri,
  name,
  detail,
  verified = false,
  size = 48,
  trailing,
  onPress,
}: PersonRowProps) {
  const search = size === 50;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'flex-row items-center active:opacity-60',
        search ? 'gap-[13px] py-[2px]' : 'gap-[12px]',
      )}
    >
      <Avatar uri={avatarUri} size={size} />
      <View className="min-w-0 flex-1" style={{ gap: search ? 3 : 2 }}>
        <View className="flex-row items-center gap-[6px]">
          <Text
            weight={600}
            className={cn(search ? 'text-[16.5px] tracking-[-0.165px]' : 'text-[15px]')}
          >
            {name}
          </Text>
          {verified ? <VerifiedSeal size={search ? 17 : 20} inset={!search} /> : null}
        </View>
        <Text
          weight={search ? 400 : 600}
          numberOfLines={1}
          className={cn(search ? 'text-[14px] text-ink-dim' : 'text-[12px] text-ink-faint')}
        >
          {detail}
        </Text>
      </View>
      {trailing}
    </Pressable>
  );
}

/** `padding:10px 14px · 13px/600` — the "Aceitar" pill on a join request. */
export function ActionPill({
  label,
  outlined = false,
  muted = false,
  onPress,
}: {
  label: string;
  outlined?: boolean;
  muted?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'shrink-0 rounded-pill active:opacity-75',
        outlined
          ? 'border-2 border-brand px-[12px] py-[8px]'
          : muted
            ? 'bg-surface-sunken px-[14px] py-[10px]'
            : 'bg-brand px-[14px] py-[10px]',
      )}
    >
      <Text
        weight={600}
        className={cn(
          'text-[13px]',
          outlined ? 'text-brand' : muted ? 'text-ink-faint' : 'text-white',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** `padding:9px 16px · inset 0 0 0 1.5px #E6EBF3` — the outlined "Perfil" button. */
export function OutlinePill({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="shrink-0 rounded-pill border-[1.5px] border-hair px-[14.5px] py-[7.5px] active:opacity-60"
    >
      <Text weight={600} className="text-[14px]">
        {label}
      </Text>
    </Pressable>
  );
}
