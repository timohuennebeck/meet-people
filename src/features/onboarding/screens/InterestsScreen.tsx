import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Chip, Spacer, TagInput } from '@shared/ui';

import { STEPS } from '../lib/steps';
import { StepLayout } from '../ui/StepLayout';

/** Suggestions offered under the field, as shown in the design. */
const SUGGESTIONS = ['Café', 'Café da manhã'];

/** Step 4b — interests, entered as tags. */
export function InterestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tags, setTags] = useState(['Corrida', 'Cinema']);

  return (
    <StepLayout
      step={STEPS.interests}
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
        draft="caf"
        onRemove={(tag) => setTags((current) => current.filter((entry) => entry !== tag))}
      />

      <View className="mt-[14px] shrink-0 flex-row flex-wrap gap-[8px]">
        {SUGGESTIONS.map((suggestion) => (
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
    </StepLayout>
  );
}
