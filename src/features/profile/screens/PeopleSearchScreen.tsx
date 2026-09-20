import { useRouter } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import type { User } from '@shared/data/schemas';
import { colors } from '@shared/theme/tokens';
import {
  Caret,
  Chip,
  Glyph,
  NavHeader,
  OutlinePill,
  PersonRow,
  Screen,
  SectionLabel,
  Text,
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
      <SectionLabel className="tracking-[1.125px]">{label}</SectionLabel>
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
  const [term, setTerm] = useState('sara');
  const [scope, setScope] = useState<Scope>('people');

  const { data: results } = useUserSearch(term);
  const { data: recent } = useRecentSearches();

  const open = (userId: string) => router.push(`/people/${userId}`);

  return (
    <Screen className="bg-surface">
      <NavHeader title={t('search.title')} onBack={() => router.back()} />

      <View className="mt-[16px] h-[48px] shrink-0 flex-row items-center gap-[10px] rounded-[14px] bg-surface-fill px-[14px]">
        <MagnifyingGlass size={20} color={colors.inkGhost} />
        <View className="flex-1 flex-row items-center">
          <Text className="text-[16px]">{term}</Text>
          <Caret height={19} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={() => setTerm('')}
          className="h-[22px] w-[22px] items-center justify-center rounded-full bg-hair-stone"
        >
          <Glyph.CloseClear size={10} />
        </Pressable>
      </View>

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
        <ResultGroup
          label={t('search.peopleCount', { count: (results ?? []).length })}
          people={results ?? []}
          onOpen={open}
        />
        <ResultGroup label={t('search.recent')} people={recent ?? []} onOpen={open} />
      </ScrollView>
    </Screen>
  );
}
