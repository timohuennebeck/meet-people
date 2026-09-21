import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { usePreferences, useUpdatePreferences } from '@shared/data/queries/use-preferences';
import { MAX_INTEREST_LENGTH, MAX_INTERESTS } from '@shared/lib/limits';
import { Button, Spacer } from '@shared/ui/button';
import { SectionLabel } from '@shared/ui/card';
import { TagInput } from '@shared/ui/fields';
import { NavHeader } from '@shared/ui/header';
import { Screen } from '@shared/ui/screen';
import { SuggestionChips } from '@shared/ui/suggestion-chips';
import { Text } from '@shared/ui/text';

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
        max={MAX_INTERESTS}
        maxLength={MAX_INTEREST_LENGTH}
        onAdd={(tag) => update({ interests: [...interests, tag] })}
        onRemove={(tag) => update({ interests: interests.filter((entry) => entry !== tag) })}
      />

      <SectionLabel className="mt-[14px] shrink-0">
        {t('settings.interestsPage.suggestions')}
      </SectionLabel>

      <SuggestionChips
        className="mt-[10px]"
        chosen={interests}
        suggestions={[
          t('settings.interestsPage.suggestionLiveMusic'),
          t('settings.interestsPage.suggestionMuseums'),
        ]}
        max={MAX_INTERESTS}
        onAdd={(suggestion) => update({ interests: [...interests, suggestion] })}
      />

      <Spacer min={10} />

      <Button
        label={t('common.save')}
        variant="primaryCompact"
        className="mb-[12px]"
        onPress={() => router.back()}
      />
    </Screen>
  );
}
