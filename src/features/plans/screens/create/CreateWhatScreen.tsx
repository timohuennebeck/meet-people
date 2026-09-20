import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Caret, Chip, SectionLabel, Spacer, Text } from '@shared/ui';

import { CreateStepLayout } from '../../ui/CreateStepLayout';

const MAX_TITLE = 60;

/** Title suggestions offered under the field. */
const SUGGESTIONS = ['Café da tarde', 'Corrida leve', 'Cinema ao ar livre', 'Caminhada no parque'];

/** Create step 1 — what the plan is called. */
export function CreateWhatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('Tarde de jogos no Café Kotti');

  return (
    <CreateStepLayout
      step={1}
      progress={0.2}
      title={t('create.what.title')}
      subtitle={t('create.what.subtitle')}
      footer={<Button label={t('common.continue')} onPress={() => router.push('/create/where')} />}
    >
      <View className="mt-[20px] shrink-0 flex-row flex-wrap items-center rounded-tile border-2 border-brand bg-surface p-[16px]">
        <Text weight={500} className="text-[20px] leading-[27px]">
          {title}
        </Text>
        <Caret height={22} />
      </View>

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
            tone="outline"
            onPress={() => setTitle(suggestion)}
          />
        ))}
      </View>

      <Spacer />
    </CreateStepLayout>
  );
}
