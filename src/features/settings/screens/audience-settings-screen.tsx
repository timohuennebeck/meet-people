import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePreferences, useUpdatePreferences } from '@shared/data/queries/use-preferences';
import { AUDIENCE_GENDER, type AudienceGender } from '@shared/data/schemas';
import { AgeRangeControl } from '@shared/ui/age-range-control';
import { Button, Spacer } from '@shared/ui/button';
import { SectionLabel } from '@shared/ui/card';
import { ChoiceTile } from '@shared/ui/choice-tile';
import { NavHeader } from '@shared/ui/header';
import { Screen } from '@shared/ui/screen';
import { Text } from '@shared/ui/text';

/** Settings → Who I want to see: gender tiles and an age range. */
export function AudienceSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const gender = preferences?.audienceGender ?? AUDIENCE_GENDER.EVERYONE;
  const range = preferences?.ageRange ?? [21, 34];

  const options: { value: AudienceGender; label: string; detail?: string }[] = [
    { value: AUDIENCE_GENDER.EVERYONE, label: t('settings.audiencePage.everyone') },
    { value: AUDIENCE_GENDER.WOMEN, label: t('settings.audiencePage.women') },
    { value: AUDIENCE_GENDER.MEN, label: t('settings.audiencePage.men') },
    {
      value: AUDIENCE_GENDER.NON_BINARY,
      label: t('settings.audiencePage.nonBinary'),
      detail: t('settings.audiencePage.nonBinaryDetail'),
    },
  ];

  return (
    <Screen>
      <NavHeader title={t('settings.audiencePage.title')} onBack={() => router.back()} />

      <Text className="mt-[20px] shrink-0 text-[15.5px] text-ink-dim">
        {t('settings.audiencePage.note')}
      </Text>

      <View className="mt-[20px] shrink-0 gap-[10px]">
        <SectionLabel>{t('settings.audiencePage.genderLabel')}</SectionLabel>
        <View className="gap-[12px]">
          <View className="flex-row gap-[12px]">
            {options.slice(0, 2).map((option) => (
              <ChoiceTile
                key={option.value}
                label={option.label}
                selected={gender === option.value}
                onPress={() => update({ audienceGender: option.value })}
              />
            ))}
          </View>
          <View className="flex-row gap-[12px]">
            {options.slice(2).map((option) => (
              <ChoiceTile
                key={option.value}
                label={option.label}
                detail={option.detail}
                selected={gender === option.value}
                onPress={() => update({ audienceGender: option.value })}
              />
            ))}
          </View>
        </View>
      </View>

      <View className="mt-[22px] shrink-0 gap-[10px]">
        <SectionLabel>{t('settings.audiencePage.ageLabel')}</SectionLabel>
        <AgeRangeControl
          range={range}
          onChange={(next) => update({ ageRange: [next[0], next[1]] })}
          presets="inside"
          readoutSize={32}
          cardPadding={20}
          allLabel={t('onboarding.ageRange.presetAll')}
          unitLabel={t('common.years')}
        />
      </View>

      <Text className="mt-[16px] shrink-0 text-center text-[15px] text-ink-dim">
        {t('settings.audiencePage.matchCount')}
      </Text>

      <Spacer min={12} />

      <Button label={t('common.save')} onPress={() => router.back()} />
    </Screen>
  );
}
