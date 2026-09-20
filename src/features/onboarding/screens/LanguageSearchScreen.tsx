import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { colors } from '@shared/theme/tokens';
import { Caret, Glyph, Screen, SearchHeader, SelectableRow, Text } from '@shared/ui';

/** Matches for the typed prefix, with the prefix bolded in each row. */
const MATCHES = [
  { code: 'pt', flag: 'pt', name: 'Português', endonym: 'Português' },
  { code: 'pt-BR', flag: 'br', name: 'Português (Brasil)', endonym: 'Português do Brasil' },
] as const;

/** Languages common in the user's neighbourhood, offered below the matches. */
const NEARBY = [
  { code: 'tr', flag: 'tr', name: 'Turco' },
  { code: 'ar', flag: 'sa', name: 'Árabe' },
] as const;

/** Step 5a — live language search, reached from the languages step. */
export function LanguageSearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = 'Portu';

  return (
    <Screen padding="keyboard">
      <SearchHeader title={t('onboarding.languageSearch.title')} onBack={() => router.back()} />

      <View className="mt-[18px] h-[56px] shrink-0 flex-row items-center gap-[10px] rounded-well border-2 border-brand bg-surface px-[14px]">
        <Glyph.SearchGlyph size={15} color={colors.inkDim} />
        <View className="flex-row items-center">
          <Text className="text-[16.5px]">{query}</Text>
          <Caret height={19} gap={1} />
        </View>
      </View>

      <View className="mt-[18px] min-h-0 flex-1 gap-[10px] overflow-hidden">
        {MATCHES.map((language) => (
          <SelectableRow
            key={language.code}
            title={language.name}
            subtitle={language.endonym}
            flag={language.flag}
            highlightPrefix={query}
            addable
          />
        ))}

        {/* This one label sits at regular weight in the design, not semibold. */}
        <Text className="mt-[6px] text-[12.5px] tracking-[1px] text-ink-dim">
          {t('onboarding.languageSearch.nearbyCommon')}
        </Text>

        {NEARBY.map((language) => (
          <SelectableRow key={language.code} title={language.name} flag={language.flag} addable />
        ))}
      </View>
    </Screen>
  );
}
