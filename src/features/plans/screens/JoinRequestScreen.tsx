import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { gradients, gradientStops } from '@shared/theme/tokens';
import {
  Avatar,
  Button,
  Caret,
  Chip,
  SealNote,
  SheetScrim,
  SheetSurface,
  Text,
  TextButton,
} from '@shared/ui';

import { usePlan, useSetMembership } from '../data/usePlans';

/** The message the design shows already typed into the field. */
const SAMPLE_MESSAGE = 'Jogo desde criança, moro a duas quadras. Levo meu relógio de xadrez.';

/**
 * The join-request sheet: a note to the host, a few one-tap additions, and a
 * plain statement of what the host will and will not see.
 */
export function JoinRequestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan } = usePlan(id ?? '');
  const { mutate: setMembership } = useSetMembership();

  const host = plan?.host;

  const send = () => {
    if (plan) setMembership({ planId: plan.id, membership: 'requested' });
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

        <View className="min-h-[118px] rounded-tile border-2 border-brand bg-surface p-[14px]">
          <Text className="text-[17px] leading-[24.65px]">
            {SAMPLE_MESSAGE}
            <Caret height={20} />
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-[8px]">
          <Chip label={t('plan.request.chipBeginner')} size="soft" tone="fill" />
          <Chip label={t('plan.request.chipBoard')} size="soft" tone="fill" />
          <Chip label={t('plan.request.chipArrival')} size="soft" tone="fill" />
        </View>

        <SealNote>{t('plan.request.privacyNote', { name: host?.name ?? '' })}</SealNote>

        <Button label={t('plan.request.send')} onPress={send} />
        <TextButton label={t('common.cancel')} tone="mutedTall" onPress={() => router.back()} />
      </SheetSurface>
    </View>
  );
}
