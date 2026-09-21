import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PRONOUNS, type Pronouns } from '@shared/data/schemas';
import { STEPS } from '@shared/lib/steps';
import { Button, Spacer, TextButton } from '@shared/ui/button';
import { ChoiceTile } from '@shared/ui/choice-tile';
import { StepScaffold } from '@shared/ui/step-scaffold';
import { Text } from '@shared/ui/text';

import { saveProfile } from '../lib/profile-writes';

/** Pronouns, shown beside the user's name. Skippable. */
export function PronounsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<Pronouns>(PRONOUNS.SHE);

  const next = () => router.push('/(onboarding)/photo');

  /**
   * Skipping is not the same as answering "prefer not to say": the column
   * already defaults to `unspecified`, so a skip leaves it alone rather than
   * overwriting an answer given on an earlier run through.
   */
  const confirm = () => {
    saveProfile({ pronouns: selected });
    next();
  };

  const options: { value: Pronouns; label: string }[] = [
    { value: PRONOUNS.SHE, label: t('onboarding.pronouns.she') },
    { value: PRONOUNS.HE, label: t('onboarding.pronouns.he') },
    { value: PRONOUNS.THEY, label: t('onboarding.pronouns.they') },
    { value: PRONOUNS.UNSPECIFIED, label: t('common.preferNotToSay') },
  ];

  return (
    <StepScaffold
      position={STEPS.pronouns}
      title={t('onboarding.pronouns.title')}
      subtitle={t('onboarding.pronouns.subtitle')}
      footer={
        <>
          <Button label={t('common.continue')} onPress={confirm} />
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
                option.value === PRONOUNS.UNSPECIFIED ? (
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
