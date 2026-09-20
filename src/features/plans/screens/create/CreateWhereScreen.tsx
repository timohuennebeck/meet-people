import { useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { colors } from '@shared/theme/tokens';
import { Button, Chip, SectionLabel, Text } from '@shared/ui';

import { useNearbyPlaces, useRecentPlaces } from '../../data/usePlaces';
import { CreateStepLayout } from '../../ui/CreateStepLayout';
import { PlaceRow } from '../../ui/PlaceRow';

/** Create step 2 — where to meet. Asked before the time, since the venue limits it. */
export function CreateWhereScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: recent } = useRecentPlaces();
  const { data: nearby } = useNearbyPlaces();
  const [selected, setSelected] = useState('p-kotti');

  return (
    <CreateStepLayout
      step={2}
      progress={0.4}
      title={t('create.where.title')}
      subtitle={t('create.where.subtitle')}
      footer={
        <View className="pt-[16px]">
          <Button label={t('common.continue')} onPress={() => router.push('/create/when')} />
        </View>
      }
    >
      <View className="mt-[18px] h-[56px] shrink-0 flex-row items-center gap-[10px] rounded-well border border-hair bg-surface px-[16px]">
        <MagnifyingGlass size={21} color={colors.inkGhost} />
        <Text className="flex-1 text-[16px] text-ink-ghost">
          {t('create.where.searchPlaceholder')}
        </Text>
      </View>

      <View className="mt-[12px] shrink-0 flex-row flex-wrap gap-[8px]">
        <Chip label={t('create.where.filterNear')} size="place" tone="brand" />
        <Chip label={t('create.where.filterParks')} size="place" tone="outlineStrong" />
      </View>

      <SectionLabel className="mt-[18px] shrink-0">{t('create.where.recent')}</SectionLabel>
      <View className="mt-[8px] shrink-0 gap-[10px]">
        {(recent ?? []).map((place) => (
          <PlaceRow
            key={place.id}
            place={place}
            selected={selected === place.id}
            onPress={() => setSelected(place.id)}
          />
        ))}
      </View>

      <SectionLabel className="mt-[18px] shrink-0">{t('create.where.nearYou')}</SectionLabel>
      <View className="mt-[8px] shrink-0 gap-[10px]">
        {(nearby ?? []).map((place) => (
          <PlaceRow
            key={place.id}
            place={place}
            selected={selected === place.id}
            onPress={() => setSelected(place.id)}
          />
        ))}
      </View>

      <View className="flex-1" />
    </CreateStepLayout>
  );
}
