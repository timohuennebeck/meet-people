import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePreferences, useUpdatePreferences } from '@features/settings/data/usePreferences';
import { LEVEL_LABEL_KEY, pickLanguages } from '@shared/lib/languages';
import { SelectableRow } from '@shared/ui';

export interface SpokenLanguageListProps {
  /** The shortlist to offer, in order. Onboarding and settings differ. */
  codes: readonly string[];
}

/**
 * The flag list for "languages I speak", shared by the onboarding step and the
 * settings page. A chosen language shows the user's level as its subtitle; the
 * rest show the language's own name.
 */
export function SpokenLanguageList({ codes }: SpokenLanguageListProps) {
  const { t } = useTranslation();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const spoken = preferences?.spokenLanguages ?? [];

  const toggle = (code: string, flag: string) => {
    const existing = spoken.find((language) => language.code === code);
    update({
      spokenLanguages: existing
        ? spoken.filter((language) => language.code !== code)
        : [...spoken, { code, flag, level: 'learning' }],
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
            subtitle={chosen ? t(LEVEL_LABEL_KEY[chosen.level]) : language.endonym}
            flag={language.flag}
            selected={Boolean(chosen)}
            onPress={() => toggle(language.code, language.flag)}
          />
        );
      })}
    </View>
  );
}
