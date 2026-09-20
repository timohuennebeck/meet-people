import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { usePreferences, useUpdatePreferences } from '@features/settings/data/usePreferences';
import { pickLanguages, searchLanguages, type LanguageOption } from '@shared/lib/languages';
import { colors } from '@shared/theme/tokens';
import { Glyph, Screen, SearchHeader, SelectableRow, Text, TextField } from '@shared/ui';

/** Languages common in the user's neighbourhood, offered while nothing is typed. */
const NEARBY = ['tr', 'ar'];

/** Step 5a — live language search, reached from the languages step. */
export function LanguageSearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const spoken = preferences?.spokenLanguages ?? [];
  const matches = useMemo(() => searchLanguages(query), [query]);

  const add = (language: LanguageOption) => {
    if (!spoken.some((entry) => entry.code === language.code)) {
      update({
        spokenLanguages: [
          ...spoken,
          { code: language.code, flag: language.flag, level: 'learning' },
        ],
      });
    }
    router.back();
  };

  // Only a match that actually starts with what was typed can have its prefix
  // bolded — bolding the first N characters of a mid-word match would highlight
  // the wrong letters.
  const prefixOf = (language: LanguageOption) =>
    language.name.toLowerCase().startsWith(query.trim().toLowerCase())
      ? language.name.slice(0, query.trim().length)
      : undefined;

  return (
    <Screen padding="keyboard">
      <SearchHeader title={t('onboarding.languageSearch.title')} onBack={() => router.back()} />

      <TextField
        className="mt-[18px] rounded-well"
        height={56}
        radius={20}
        value={query}
        onChangeText={setQuery}
        placeholder={t('onboarding.languageSearch.placeholder')}
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        paddingHorizontal={14}
        leading={<Glyph.SearchGlyph size={15} color={colors.inkDim} />}
      />

      {/* A ScrollView rather than a fixed column: the list runs past the bottom
          of the screen once a short query matches several languages, and a
          clipped column simply cut the last row's flag in half. */}
      <ScrollView
        className="mt-[18px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {query.trim() ? (
          matches.length > 0 ? (
            matches.map((language) => (
              <SelectableRow
                key={language.code}
                title={language.name}
                subtitle={language.endonym}
                flag={language.flag}
                highlightPrefix={prefixOf(language)}
                addable
                onPress={() => add(language)}
              />
            ))
          ) : (
            <Text className="mt-[6px] text-[15px] text-ink-dim">
              {t('onboarding.languageSearch.noResults', { query: query.trim() })}
            </Text>
          )
        ) : (
          <>
            {/* This one label sits at regular weight in the design, not semibold. */}
            <Text className="text-[12.5px] tracking-[1px] text-ink-dim">
              {t('onboarding.languageSearch.nearbyCommon')}
            </Text>
            {pickLanguages(NEARBY).map((language) => (
              <SelectableRow
                key={language.code}
                title={language.name}
                flag={language.flag}
                addable
                onPress={() => add(language)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
