import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { cn } from '@shared/lib/cn';
import { STEPS } from '@shared/lib/steps';
import { Button, Caret, Spacer, Text } from '@shared/ui';

const LENGTH = 6;

/** One box of the SMS code field. */
function CodeBox({ digit, focused }: { digit: string; focused: boolean }) {
  return (
    <View
      className={cn(
        'h-[66px] flex-1 items-center justify-center rounded-field',
        digit ? 'border border-hair bg-surface' : 'border border-surface-chip bg-surface-chip',
        focused && 'border-2 border-brand bg-surface-chip',
      )}
    >
      {digit ? (
        <Text weight={600} className="text-[24px]">
          {digit}
        </Text>
      ) : focused ? (
        <Caret height={26} />
      ) : null}
    </View>
  );
}

/**
 * The SMS code step that pairs with `PhoneScreen`.
 *
 * The six boxes are not six fields. A single hidden input holds the code and
 * the boxes render from it, which is the only way to get one caret, working
 * backspace and SMS autofill out of a segmented code field.
 */
export function CodeScreen() {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);

  return (
    <StepScaffold
      position={STEPS.code}
      title={t('onboarding.code.title')}
      footer={<Button label={t('onboarding.code.confirm')} disabled={code.length < LENGTH} />}
    >
      <Text className="mt-[10px] shrink-0 text-[15.5px] leading-[22.5px] text-ink-dim">
        {t('onboarding.code.sentTo', { phone: '+49 151 23456789' })}{' '}
        <Text weight={500} className="text-[15.5px] text-brand">
          {t('onboarding.code.change')}
        </Text>
      </Text>

      <Pressable
        accessibilityRole="none"
        accessibilityLabel={t('onboarding.code.title')}
        className="mt-[22px] shrink-0"
        onPress={() => input.current?.focus()}
      >
        <View className="flex-row gap-[9px]">
          {Array.from({ length: LENGTH }, (_, index) => (
            <CodeBox
              key={index}
              digit={code[index] ?? ''}
              focused={focused && index === Math.min(code.length, LENGTH - 1)}
            />
          ))}
        </View>

        <TextInput
          ref={input}
          value={code}
          onChangeText={(next) => setCode(next.replace(/\D/g, '').slice(0, LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={LENGTH}
          autoFocus
          // Invisible, but still on screen: a `display:none` input cannot take
          // focus, and an off-screen one makes the keyboard jump on Android.
          className="absolute inset-0 opacity-0"
        />
      </Pressable>

      <Text className="mt-[16px] shrink-0 text-center text-[15px] text-ink-dim">
        {t('onboarding.code.resendIn', { time: '0:24' })}
      </Text>

      <Spacer />
    </StepScaffold>
  );
}
