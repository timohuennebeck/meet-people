import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { isDataError } from '@shared/data/errors';
import {
  Avatar,
  Button,
  NoteField,
  Chip,
  SealNote,
  SheetSurface,
  Text,
  TextButton,
} from '@shared/ui';

import { usePlan, useSetMembership } from '../data/usePlans';

/**
 * The join-request sheet: a note to the host, a few one-tap additions, and a
 * plain statement of what the host will and will not see.
 */
export function JoinRequestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan } = usePlan(id ?? '');
  const { mutate: setMembership, isPending, error } = useSetMembership(id ?? '');

  const host = plan?.host;
  const [message, setMessage] = useState('');

  // The chips under the field are one-tap additions to the note, not filters.
  const append = (phrase: string) =>
    setMessage((current) => (current.trim() ? `${current.trim()} ${phrase}.` : `${phrase}.`));

  /**
   * The sheet stays up until the server has answered. Dismissing on the tap
   * would hide the only place the refusal can be said: the optimistic
   * membership flips, the rollback quietly puts it back, and the plan reads as
   * broken rather than as refused.
   */
  const send = () => {
    if (!plan || isPending) return;
    setMembership(
      { membership: 'requested', note: message },
      {
        onSuccess: () => router.back(),
        onError: (failure) => {
          // A spent weekly quota is what Plus sells, so the paywall is the
          // answer rather than a sentence explaining it. Every other refusal
          // is read off the mutation below, and none of them dismiss.
          if (isDataError(failure) && failure.code === 'NO_CREDITS') {
            router.push('/(onboarding)/paywall');
          }
        },
      },
    );
  };

  const refusal = isDataError(error) && error.code !== 'NO_CREDITS' ? t(error.messageKey) : null;

  // No map backdrop and no scrim: the sheet is presented over the real map
  // now, and the system dims what is behind it.
  return (
    <SheetSurface gap={16} padding={{ top: 14, horizontal: 20, bottom: 32 }}>
      <View className="flex-row items-center gap-[13px]">
        {host ? <Avatar uri={host.avatarUrl} size={52} /> : null}
        <View className="min-w-0 flex-1 gap-[3px]">
          <Text weight={600} className="text-[22px] tracking-[-0.44px]">
            {t('plan.request.title', { name: host?.name ?? '' })}
          </Text>
          <Text className="text-[14.5px] text-ink-dim">{t('plan.request.subtitle')}</Text>
        </View>
      </View>

      <NoteField
        value={message}
        onChangeText={setMessage}
        placeholder={t('plan.request.notePlaceholder')}
        autoFocus
      />

      <View className="flex-row flex-wrap gap-[8px]">
        {(['chipBeginner', 'chipBoard', 'chipArrival'] as const).map((key) => (
          <Chip
            key={key}
            label={t(`plan.request.${key}`)}
            size="soft"
            tone="fill"
            onPress={() => append(t(`plan.request.${key}`))}
          />
        ))}
      </View>

      <SealNote>{t('plan.request.privacyNote', { name: host?.name ?? '' })}</SealNote>

      <Button
        label={isPending ? t('plan.request.sending') : t('plan.request.send')}
        disabled={isPending}
        onPress={send}
      />
      {refusal ? <Text className="text-center text-[14px] text-ink-dim">{refusal}</Text> : null}
      <TextButton label={t('common.cancel')} tone="body" onPress={() => router.back()} />
    </SheetSurface>
  );
}
