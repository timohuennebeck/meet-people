import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Chip, SectionLabel, Spacer, WheelPicker } from '@shared/ui';

import { CreateStepLayout } from '../../ui/CreateStepLayout';

/** Day and time wheels, centred on the selected "Hoje 19:00". */
const COLUMNS = [
  ['Anteontem', 'Hoje', 'Hoje', 'Amanhã', 'Sáb'],
  ['18:00', '18:30', '19:00', '19:30', '20:00'],
] as const;

type Duration = 60 | 120 | 180 | null;

/** Create step 3 — start time and how long it runs. */
export function CreateWhenScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [duration, setDuration] = useState<Duration>(120);

  const durations: { value: Duration; label: string }[] = [
    { value: 60, label: t('create.when.oneHour') },
    { value: 120, label: t('create.when.twoHours') },
    { value: 180, label: t('create.when.threeHours') },
    { value: null, label: t('create.when.openEnded') },
  ];

  return (
    <CreateStepLayout
      step={3}
      progress={0.6}
      title={t('create.when.title')}
      subtitle={t('create.when.subtitle', { place: 'Café Kotti' })}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/create/join-mode')} />
      }
    >
      <View className="mt-[16px] shrink-0 flex-row flex-wrap gap-[8px]">
        <Chip label={t('create.when.inAnHour')} size="time" tone="chip" />
        <Chip label="Hoje 19:00" size="time" tone="brand" />
      </View>

      <WheelPicker
        className="mt-[14px]"
        columns={COLUMNS}
        height={262}
        bandHeight={54}
        bandRadius={16}
        columnGap={40}
        rowGap={16}
        fontSize={22}
        selectedFontSize={25}
        fade={70}
        radius={28}
      />

      <SectionLabel className="mt-[20px] shrink-0">{t('create.when.durationLabel')}</SectionLabel>

      <View className="mt-[10px] shrink-0 flex-row flex-wrap gap-[8px]">
        {durations.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            size="time"
            tone={option.value === duration ? 'brand' : 'outline'}
            onPress={() => setDuration(option.value)}
          />
        ))}
      </View>

      <Spacer min={16} />
    </CreateStepLayout>
  );
}
