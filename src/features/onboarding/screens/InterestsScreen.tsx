import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { MAX_INTEREST_LENGTH, MAX_INTERESTS } from '@shared/lib/limits';
import { STEPS } from '@shared/lib/steps';
import { Button, Chip, Spacer, TagInput } from '@shared/ui';

/** Suggestions offered under the field, as shown in the design. */
const SUGGESTIONS = ['Café', 'Café da manhã'];

/** Interests, entered as tags. */
export function InterestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tags, setTags] = useState(['Corrida', 'Cinema']);

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
        onAdd={(tag) => setTags((current) => [...current, tag])}
        onRemove={(tag) => setTags((current) => current.filter((entry) => entry !== tag))}
      />

      <View className="mt-[14px] shrink-0 flex-row flex-wrap gap-[8px]">
        {/* Already-added tags drop out of the suggestions: two chips under one
            key would collide, and removing either would take both. */}
        {/* Nothing to offer once the cap is reached — a chip that fails silently
            is worse than no chip. */}
        {(tags.length >= MAX_INTERESTS ? [] : SUGGESTIONS)
          .filter((suggestion) => !tags.includes(suggestion))
          .map((suggestion) => (
            <Chip
              key={suggestion}
              label={`+ ${suggestion}`}
              size="suggestion"
              tone="outline"
              onPress={() => setTags((current) => [...current, suggestion])}
            />
          ))}
      </View>

      <Spacer min={10} />
    </StepScaffold>
  );
}
