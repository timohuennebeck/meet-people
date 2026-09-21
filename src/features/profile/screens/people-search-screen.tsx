import { useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { useNearbyPlaces, useRecentPlaces } from '@features/plans/data/use-places';
import { usePlans } from '@features/plans/data/use-plans';
import { PlaceRow } from '@features/plans/ui/place-row';
import type { Place, Plan, User } from '@shared/data/schemas';
import { colors } from '@shared/theme/tokens';
import {
  Chip,
  Glyph,
  NavHeader,
  OutlinePill,
  PersonRow,
  Screen,
  SectionLabel,
  Text,
  TextField,
} from '@shared/ui';

import { useRecentSearches, useUserSearch } from '../data/use-users';

const SCOPES = [
  { id: 'people', labelKey: 'search.scopePeople' },
  { id: 'plans', labelKey: 'search.scopePlans' },
  { id: 'places', labelKey: 'search.scopePlaces' },
] as const;

type Scope = (typeof SCOPES)[number]['id'];

/** A titled group of matched people. */
function ResultGroup({
  label,
  people,
  onOpen,
}: {
  label: string;
  people: readonly { user: User; detail: string }[];
  onOpen: (userId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-[10px]">
      <SectionLabel>{label}</SectionLabel>
      {people.map(({ user, detail }) => (
        <PersonRow
          key={user.id}
          size={50}
          avatarUri={user.avatarUrl}
          name={`${user.name}, ${user.age}`}
          detail={detail}
          verified={user.verified}
          trailing={<OutlinePill label={t('common.profile')} onPress={() => onOpen(user.id)} />}
          onPress={() => onOpen(user.id)}
        />
      ))}
    </View>
  );
}

/** A titled group of matched plans. Tapping one opens its sheet. */
function PlanResults({ plans, onOpen }: { plans: readonly Plan[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation();

  return (
    <View className="gap-[10px]">
      <SectionLabel>{t('search.plansCount', { count: plans.length })}</SectionLabel>
      {plans.map((plan) => (
        <PersonRow
          key={plan.id}
          size={50}
          avatarUri={plan.host?.avatarUrl ?? plan.participants[0]?.user.avatarUrl ?? ''}
          name={plan.title}
          detail={`${plan.whenLabel} · ${plan.place.name}`}
          trailing={<OutlinePill label={t('search.open')} onPress={() => onOpen(plan.id)} />}
          onPress={() => onOpen(plan.id)}
        />
      ))}
    </View>
  );
}

/**
 * A titled group of matched places.
 *
 * These rows do not lead anywhere, and that is deliberate: a place is not a
 * screen in this app — plans are. The search answers "is there one near me and
 * how far", and the map is where anything is done about it.
 */
function PlaceResults({ places }: { places: readonly Place[] }) {
  const { t } = useTranslation();

  return (
    <View className="gap-[10px]">
      <SectionLabel>{t('search.placesCount', { count: places.length })}</SectionLabel>
      {places.map((place) => (
        <PlaceRow key={place.id} place={place} />
      ))}
    </View>
  );
}

/** People search. Typing filters live; each hit shows district and shared plans. */
export function PeopleSearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState<Scope>('people');

  const { data: results } = useUserSearch(term);
  const { data: recent } = useRecentSearches();
  // The other two scopes narrow what the app already has rather than asking the
  // server again: `nearby_plans()` has already decided which plans this person
  // may see, and the place lists are the ones the create flow offers.
  const { data: plans } = usePlans();
  const { data: nearbyPlaces } = useNearbyPlaces();
  const { data: recentPlaces } = useRecentPlaces();

  // The design only draws the `PESSOAS · n` group over a term that was typed;
  // with the field empty there is nothing to count, just the recent searches.
  const searching = term.trim().length > 0;

  const open = (userId: string) => router.push(`/people/${userId}`);
  const openPlan = (planId: string) => router.push(`/plan/${planId}`);

  const needle = term.trim().toLowerCase();
  const matchedPlans = (plans ?? []).filter((plan) =>
    `${plan.title} ${plan.place.name}`.toLowerCase().includes(needle),
  );
  const matchedPlaces = [...(recentPlaces ?? []), ...(nearbyPlaces ?? [])]
    .filter((place) => `${place.name} ${place.address}`.toLowerCase().includes(needle))
    // Both lists can hold the same venue.
    .filter((place, index, all) => all.findIndex((other) => other.id === place.id) === index);

  return (
    <Screen className="bg-surface">
      <NavHeader title={t('search.title')} onBack={() => router.back()} />

      <TextField
        className="mt-[16px] bg-surface-fill"
        ring={false}
        height={48}
        radius={14}
        fontSize={16}
        paddingHorizontal={14}
        value={term}
        onChangeText={setTerm}
        placeholder={t('search.placeholder')}
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        leading={<MagnifyingGlass size={20} color={colors.inkGhost} />}
        accessory={
          term ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              onPress={() => setTerm('')}
              className="h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-hair-stone active:opacity-60"
            >
              <Glyph.CloseClear size={10} />
            </Pressable>
          ) : null
        }
      />

      <View className="mt-[14px] shrink-0 flex-row gap-[8px]">
        {SCOPES.map((option) => (
          <Chip
            key={option.id}
            label={t(option.labelKey)}
            size="scope"
            tone={scope === option.id ? 'brand' : 'fill'}
            onPress={() => setScope(option.id)}
          />
        ))}
      </View>

      <ScrollView
        className="mt-[22px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {scope === 'people' ? (
          <>
            {searching ? (
              <ResultGroup
                label={t('search.peopleCount', { count: (results ?? []).length })}
                people={results ?? []}
                onOpen={open}
              />
            ) : null}
            <ResultGroup label={t('search.recent')} people={recent ?? []} onOpen={open} />
          </>
        ) : null}

        {scope === 'plans' ? <PlanResults plans={matchedPlans} onOpen={openPlan} /> : null}
        {scope === 'places' ? <PlaceResults places={matchedPlaces} /> : null}

        {scope !== 'people' &&
        (scope === 'plans' ? matchedPlans.length : matchedPlaces.length) === 0 ? (
          <Text className="text-center text-[15px] text-ink-dim">
            {t('search.noResults', { query: term.trim() })}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
