import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Chip, NoteField, SectionLabel, Spacer, Text } from '@shared/ui';

import { CreateStepLayout } from '../../ui/CreateStepLayout';

const MAX_TITLE = 60;

/** Title suggestions offered under the field. */
const SUGGESTIONS = ['Café da tarde', 'Corrida leve', 'Cinema ao ar livre', 'Caminhada no parque'];

/** Create step 1 — what the plan is called. */
export function CreateWhatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');

  return (
    <CreateStepLayout
      step={1}
      progress={0.2}
      title={t('create.what.title')}
      subtitle={t('create.what.subtitle')}
      footer={<Button label={t('common.continue')} onPress={() => router.push('/create/where')} />}
    >
      {/* `radius:22px · padding:16px · 20px/500`, wrapping onto a second line
          rather than scrolling sideways. */}
      <NoteField
        className="mt-[20px] shrink-0"
        value={title}
        onChangeText={setTitle}
        placeholder={t('create.what.placeholder')}
        padding={{ vertical: 16, horizontal: 16 }}
        minHeight={0}
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
        {SUGGESTIONS.map((suggestion) => (
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
