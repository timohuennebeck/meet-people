import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { Button, Flag, Spacer, Text, TextField } from '@shared/ui';

/**
 * Phone verification. Taken out of the main onboarding flow for now — the
 * design keeps it built but unlinked — and reachable from account settings.
 */
export function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [number, setNumber] = useState('');

  return (
    <StepScaffold
      position={STEPS.phone}
      title={t('onboarding.phone.title')}
      subtitle={t('onboarding.phone.subtitle')}
      footer={
        <Button
          label={t('onboarding.phone.sendCode')}
          onPress={() => router.push('/(onboarding)/code')}
        />
      }
    >
      <View className="mt-[20px] shrink-0 flex-row gap-[10px]">
        {/* The country code is a fixed prefix in the design, not a picker. */}
        <View className="flex-row items-center gap-[8px] rounded-well border border-hair bg-surface px-[14px] py-[17px]">
          <Flag code="de" size={26} />
          <Text weight={500} className="text-[17px]">
            +49
          </Text>
        </View>
        <TextField
          className="flex-1 rounded-well"
          height={62}
          radius={20}
          fontSize={17}
          weight={500}
          paddingHorizontal={14}
          value={number}
          onChangeText={setNumber}
          placeholder={t('onboarding.phone.placeholder')}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          autoFocus
        />
      </View>

      <Spacer />
    </StepScaffold>
  );
}
