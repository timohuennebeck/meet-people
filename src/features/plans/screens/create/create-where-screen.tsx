import { useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Place } from '@shared/data/schemas';
import { colors } from '@shared/theme/tokens';
import { Button, Chip, Mascot, SectionLabel, Text, TextField } from '@shared/ui';

import { useCreatePlan } from '../../data/create-plan-provider';
import { useNearbyPlaces, useRecentPlaces } from '../../data/use-places';
import { CreateStepLayout } from '../../ui/create-step-layout';
import { PlaceRow } from '../../ui/place-row';

/** Create step 2 — where to meet. Asked before the time, since the venue limits it. */
export function CreateWhereScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: recent } = useRecentPlaces();
  const { data: nearby } = useNearbyPlaces();
  const { draft, set } = useCreatePlan();
  const selected = draft.place?.id ?? null;
  const setSelected = (place: Place) => set({ place });
  const [query, setQuery] = useState('');

  // One filter over both lists: typing narrows what is already offered rather
  // than replacing the sections with a flat result list.
  const match = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (places: readonly Place[]) =>
      needle
        ? places.filter((place) => `${place.name} ${place.address}`.toLowerCase().includes(needle))
        : places;
  }, [query]);

  const term = query.trim();
  const recentMatches = match(recent ?? []);
  const nearbyMatches = match(nearby ?? []);
  // Both labels over two empty lists read as a broken screen, so a search that
  // hits nothing anywhere replaces the sections outright. An empty field is not
  // a failed search — it just has not narrowed anything yet.
  const nothingFound = term.length > 0 && recentMatches.length === 0 && nearbyMatches.length === 0;

  return (
    <CreateStepLayout
      step={2}
      title={t('create.where.title')}
      subtitle={t('create.where.subtitle')}
      footer={
        <View className="pt-[16px]">
          <Button
            label={t('common.continue')}
            disabled={selected === null}
            onPress={() => router.push('/create/when')}
          />
        </View>
      }
    >
      <TextField
        className="mt-[18px] rounded-well"
        height={56}
        radius={20}
        fontSize={16}
        value={query}
        onChangeText={setQuery}
        placeholder={t('create.where.searchPlaceholder')}
        autoCorrect={false}
        clearButtonMode="while-editing"
        leading={<MagnifyingGlass size={21} color={colors.inkGhost} />}
      />

      <View className="mt-[12px] shrink-0 flex-row flex-wrap gap-[8px]">
        <Chip label={t('create.where.filterNear')} size="place" tone="brand" />
        <Chip label={t('create.where.filterParks')} size="place" tone="outlineStrong" />
      </View>

      {nothingFound ? (
        <View className="mt-[28px] flex-1 items-center">
          <Mascot size={120} />
          <Text weight={600} className="mt-[14px] max-w-[280px] text-center text-[17px]">
            {t('create.where.emptyTitle', { query: term })}
          </Text>
          <Text className="mt-[6px] max-w-[280px] text-center text-[14.5px] leading-[19.6px] text-ink-dim">
            {t('create.where.emptyBody')}
          </Text>
        </View>
      ) : (
        <>
          <SectionLabel className="mt-[18px] shrink-0">{t('create.where.recent')}</SectionLabel>
          <View className="mt-[8px] shrink-0 gap-[10px]">
            {recentMatches.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                selected={selected === place.id}
                onPress={() => setSelected(place)}
              />
            ))}
          </View>

          <SectionLabel className="mt-[18px] shrink-0">{t('create.where.nearYou')}</SectionLabel>
          <View className="mt-[8px] shrink-0 gap-[10px]">
            {nearbyMatches.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                selected={selected === place.id}
                onPress={() => setSelected(place)}
              />
            ))}
          </View>

          <View className="flex-1" />
        </>
      )}
    </CreateStepLayout>
  );
}
