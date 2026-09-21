import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { StepScaffold } from '@shared/components/StepScaffold';
import { SuggestionChips } from '@shared/components/SuggestionChips';
import { usePreferences, useUpdatePreferences } from '@shared/data/usePreferences';
import { MAX_INTEREST_LENGTH, MAX_INTERESTS } from '@shared/lib/limits';
import { STEPS } from '@shared/lib/steps';
import { Button, Spacer, TagInput } from '@shared/ui';

/** Interests, entered as tags. */
export function InterestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  // Saved as each tag is added rather than on continue, which is what the
  // settings page does with the same field — and what keeps the answer when
  // the step is abandoned half way.
  const tags = preferences?.interests ?? [];

  return (
    <StepScaffold
      position={STEPS.interests}
      padding="keyboard"
      title={t('onboarding.interests.title')}
      subtitle={t('onboarding.interests.subtitle')}
      footer={
        <Button
          label={t('onboarding.interests.continueWith', { count: tags.length })}
          className="mb-[12px]"
          onPress={() => router.push('/(onboarding)/languages')}
        />
      }
    >
      <TagInput
        className="mt-[18px]"
        tags={tags}
        max={MAX_INTERESTS}
        maxLength={MAX_INTEREST_LENGTH}
        onAdd={(tag) => update({ interests: [...tags, tag] })}
        onRemove={(tag) => update({ interests: tags.filter((entry) => entry !== tag) })}
      />

      {/* Suggestions offered under the field, as the design shows them. */}
      <SuggestionChips
        className="mt-[14px]"
        chosen={tags}
        suggestions={[
          t('onboarding.interests.suggestionCoffee'),
          t('onboarding.interests.suggestionBreakfast'),
        ]}
        max={MAX_INTERESTS}
        onAdd={(suggestion) => update({ interests: [...tags, suggestion] })}
      />

      <Spacer min={10} />
    </StepScaffold>
  );
}
