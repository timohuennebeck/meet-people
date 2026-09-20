import { useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import type { User } from '@shared/data/schemas';
import { colors } from '@shared/theme/tokens';
import {
  Chip,
  Glyph,
  NavHeader,
  OutlinePill,
  PersonRow,
  Screen,
  SectionLabel,
  TextField,
} from '@shared/ui';

import { useRecentSearches, useUserSearch } from '../data/useUsers';

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

/** People search. Typing filters live; each hit shows district and shared plans. */
export function PeopleSearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState<Scope>('people');

  const { data: results } = useUserSearch(term);
  const { data: recent } = useRecentSearches();

  // The design only draws the `PESSOAS · n` group over a term that was typed;
  // with the field empty there is nothing to count, just the recent searches.
  const searching = term.trim().length > 0;

  const open = (userId: string) => router.push(`/people/${userId}`);

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
        {searching ? (
          <ResultGroup
            label={t('search.peopleCount', { count: (results ?? []).length })}
            people={results ?? []}
            onOpen={open}
          />
        ) : null}
        <ResultGroup label={t('search.recent')} people={recent ?? []} onOpen={open} />
      </ScrollView>
    </Screen>
  );
}
