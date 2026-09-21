import { View } from 'react-native';

import { usePreferences, useUpdatePreferences } from '@shared/data/use-preferences';
import { pickLanguages } from '@shared/lib/languages';
import { SelectableRow } from '@shared/ui';

export interface SpokenLanguageListProps {
  /** The shortlist to offer, in order. Onboarding and settings differ. */
  codes: readonly string[];
}

/**
 * The flag list for "languages I speak", shared by the onboarding step and the
 * settings page. Every row shows the language's own name as its subtitle.
 */
export function SpokenLanguageList({ codes }: SpokenLanguageListProps) {
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const spoken = preferences?.spokenLanguages ?? [];

  const toggle = (code: string, flag: string) => {
    const existing = spoken.find((language) => language.code === code);
    update({
      spokenLanguages: existing
        ? spoken.filter((language) => language.code !== code)
        : [...spoken, { code, flag }],
    });
  };

  return (
    <View className="gap-[10px]">
      {pickLanguages(codes).map((language) => {
        const chosen = spoken.find((entry) => entry.code === language.code);
        return (
          <SelectableRow
            key={language.code}
            title={language.name}
            subtitle={language.endonym}
            flag={language.flag}
            selected={Boolean(chosen)}
            onPress={() => toggle(language.code, language.flag)}
          />
        );
      })}
    </View>
  );
}
