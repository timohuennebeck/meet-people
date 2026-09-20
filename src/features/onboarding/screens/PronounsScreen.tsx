import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ChoiceTile } from '@shared/components/ChoiceTile';
import { StepScaffold } from '@shared/components/StepScaffold';
import type { Pronouns } from '@shared/data/schemas';
import { STEPS } from '@shared/lib/steps';
import { Button, Spacer, Text, TextButton } from '@shared/ui';

/** Pronouns, shown beside the user's name. Skippable. */
export function PronounsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<Pronouns>('she');

  const next = () => router.push('/(onboarding)/photo');

  const options: { value: Pronouns; label: string }[] = [
    { value: 'she', label: t('onboarding.pronouns.she') },
    { value: 'he', label: t('onboarding.pronouns.he') },
    { value: 'they', label: t('onboarding.pronouns.they') },
    { value: 'unspecified', label: t('common.preferNotToSay') },
  ];

  return (
    <StepScaffold
      position={STEPS.pronouns}
      title={t('onboarding.pronouns.title')}
      subtitle={t('onboarding.pronouns.subtitle')}
      footer={
        <>
          <Button label={t('common.continue')} onPress={next} />
          <TextButton label={t('common.skip')} className="mt-[15px]" onPress={next} />
        </>
      }
    >
      <View className="mt-[20px] shrink-0 gap-[12px]">
        <View className="flex-row gap-[12px]">
          {options.slice(0, 2).map((option) => (
            <ChoiceTile
              key={option.value}
              label={option.label}
              selected={selected === option.value}
              onPress={() => setSelected(option.value)}
            />
          ))}
        </View>
        <View className="flex-row gap-[12px]">
          {options.slice(2).map((option) => (
            <ChoiceTile
              key={option.value}
              label={option.label}
              selected={selected === option.value}
              onPress={() => setSelected(option.value)}
              icon={
                option.value === 'unspecified' ? (
                  <Text className="text-[26px] leading-[26px] text-ink-dim">—</Text>
                ) : undefined
              }
            />
          ))}
        </View>
      </View>

      <Spacer />
    </StepScaffold>
  );
}
