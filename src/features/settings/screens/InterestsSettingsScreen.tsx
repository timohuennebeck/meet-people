import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Chip, NavHeader, Screen, SectionLabel, Spacer, TagInput, Text } from '@shared/ui';

import { usePreferences, useUpdatePreferences } from '../data/usePreferences';

/** Suggestions offered under the field. */
const SUGGESTIONS = ['Música ao vivo', 'Museus'];

/** Settings → Interests. The same tag field as onboarding, saved in place. */
export function InterestsSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const interests = preferences?.interests ?? [];

  return (
    <Screen padding="keyboard">
      <NavHeader title={t('settings.interests')} onBack={() => router.back()} />

      <Text className="mt-[16px] shrink-0 text-[15px] text-ink-dim">
        {t('settings.interestsPage.note')}
      </Text>

      <TagInput
        className="mt-[16px]"
        minHeight={190}
        tags={interests}
        draft="mús"
        onRemove={(tag) => update({ interests: interests.filter((entry) => entry !== tag) })}
      />

      <SectionLabel className="mt-[14px] shrink-0">
        {t('settings.interestsPage.suggestions')}
      </SectionLabel>

      <View className="mt-[10px] shrink-0 flex-row flex-wrap gap-[8px]">
        {SUGGESTIONS.map((suggestion) => (
          <Chip
            key={suggestion}
            label={`+ ${suggestion}`}
            size="suggestion"
            tone="outline"
            onPress={() => update({ interests: [...interests, suggestion] })}
          />
        ))}
      </View>

      <Spacer min={10} />

      <Button
        label={t('common.save')}
        variant="primarySheet"
        className="mb-[12px]"
        onPress={() => router.back()}
      />
    </Screen>
  );
}
