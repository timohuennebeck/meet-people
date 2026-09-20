import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { Button, Mascot, Spacer, TextField } from '@shared/ui';

/** First name only. */
export function NameScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');

  return (
    <StepScaffold
      position={STEPS.name}
      title={t('onboarding.name.title')}
      subtitle={t('onboarding.name.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/birthday')}
        />
      }
    >
      <View className="mt-[20px] shrink-0 gap-[16px] rounded-card bg-brand-tint p-[16px]">
        <View className="h-[212px] items-center justify-center">
          <Mascot size={190} />
        </View>
        {/* `radius:18px · padding:18px 16px · 19px/500`, on the tinted card and
            so without a ring of its own. */}
        <TextField
          value={name}
          onChangeText={setName}
          placeholder={t('onboarding.name.placeholder')}
          ring={false}
          height={60}
          fontSize={19}
          weight={500}
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          returnKeyType="next"
        />
      </View>

      <Spacer />
    </StepScaffold>
  );
}
