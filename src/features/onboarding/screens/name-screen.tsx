import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { STEPS } from '@shared/lib/steps';
import { Button, Spacer } from '@shared/ui/button';
import { TextField } from '@shared/ui/fields';
import { Mascot } from '@shared/ui/mascot';
import { StepScaffold } from '@shared/ui/step-scaffold';

import { saveProfile } from '../lib/profile-writes';

/** First name only. */
export function NameScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');

  /** Saved on the way out, so a sign-up abandoned after this step keeps it. */
  const next = () => {
    const trimmed = name.trim();
    if (trimmed) saveProfile({ name: trimmed });
    router.push('/(onboarding)/birthday');
  };

  return (
    <StepScaffold
      position={STEPS.name}
      title={t('onboarding.name.title')}
      subtitle={t('onboarding.name.subtitle')}
      footer={<Button label={t('common.continue')} onPress={next} />}
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
