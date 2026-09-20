import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { gradients, gradientStops } from '@shared/theme/tokens';
import {
  Avatar,
  Button,
  NoteField,
  Chip,
  SealNote,
  SheetScrim,
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
  const { mutate: setMembership } = useSetMembership(id ?? '');

  const host = plan?.host;
  const [message, setMessage] = useState('');

  // The chips under the field are one-tap additions to the note, not filters.
  const append = (phrase: string) =>
    setMessage((current) => (current.trim() ? `${current.trim()} ${phrase}.` : `${phrase}.`));

  const send = () => {
    if (plan) setMembership('requested');
    router.back();
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={gradients.mapFade}
        locations={gradientStops.mapFade}
        className="absolute inset-0"
      />
      <SheetScrim />

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

        <Button label={t('plan.request.send')} onPress={send} />
        <TextButton label={t('common.cancel')} tone="body" onPress={() => router.back()} />
      </SheetSurface>
    </View>
  );
}
