import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Chip, NoteField, SectionLabel, Spacer, Text } from '@shared/ui';

import { useCreatePlan } from '../../data/create-plan-provider';
import { CreateStepLayout } from '../../ui/create-step-layout';

const MAX_TITLE = 60;

/** Create step 1 — what the plan is called. */
export function CreateWhatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, set } = useCreatePlan();
  const title = draft.title;
  const setTitle = (value: string) => set({ title: value });

  /** Title suggestions offered under the field. */
  const suggestions = [
    t('create.what.suggestionAfternoonCoffee'),
    t('create.what.suggestionEasyRun'),
    t('create.what.suggestionOpenAirCinema'),
    t('create.what.suggestionParkWalk'),
  ];

  return (
    <CreateStepLayout
      step={1}
      title={t('create.what.title')}
      subtitle={t('create.what.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          disabled={title.trim().length === 0}
          onPress={() => router.push('/create/where')}
        />
      }
    >
      {/* `radius:22px · padding:18px · 20px/500 · inset 0 0 0 2px`, one line
          tall — 18 + 27 + 18 — and wrapping onto a second rather than
          scrolling sideways. */}
      <NoteField
        className="mt-[20px] shrink-0"
        value={title}
        onChangeText={setTitle}
        placeholder={t('create.what.placeholder')}
        padding={{ vertical: 18, horizontal: 18 }}
        lines={1}
        minHeight={63}
        fontSize={20}
        lineHeight={27}
        weight={500}
        maxLength={MAX_TITLE}
        autoFocus
      />

      <Text className="mt-[10px] shrink-0 text-right text-[13px] text-ink-dim">
        {t('create.what.counter', { used: String(title.length), max: String(MAX_TITLE) })}
      </Text>

      <SectionLabel className="mt-[20px] shrink-0">{t('create.what.suggestions')}</SectionLabel>

      <View className="mt-[10px] shrink-0 flex-row flex-wrap gap-[8px]">
        {suggestions.map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            size="suggestion"
            tone={title === suggestion ? 'brand' : 'outline'}
            onPress={() => setTitle(suggestion)}
          />
        ))}
      </View>

      <Spacer />
    </CreateStepLayout>
  );
}
