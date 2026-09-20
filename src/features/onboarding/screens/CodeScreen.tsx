import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { cn } from '@shared/lib/cn';
import { STEPS } from '@shared/lib/steps';
import { Button, Caret, Spacer, Text } from '@shared/ui';

/** The six code boxes: filled, focused, then empty. */
const DIGITS = ['4', '7', '1', 'caret', '', ''] as const;

/** One box of the SMS code field. */
function CodeBox({ value }: { value: (typeof DIGITS)[number] }) {
  const focused = value === 'caret';
  const filled = value !== '' && !focused;

  return (
    <View
      className={cn(
        'h-[66px] flex-1 items-center justify-center rounded-field',
        filled && 'border border-hair bg-surface',
        focused && 'border-2 border-brand bg-surface-chip',
        !filled && !focused && 'bg-surface-chip',
      )}
    >
      {focused ? (
        <Caret height={26} />
      ) : (
        <Text weight={600} className="text-[24px]">
          {value}
        </Text>
      )}
    </View>
  );
}

/** The SMS code step that pairs with `PhoneScreen`. */
export function CodeScreen() {
  const { t } = useTranslation();

  return (
    <StepScaffold
      position={STEPS.code}
      title={t('onboarding.code.title')}
      footer={<Button label={t('onboarding.code.confirm')} disabled />}
    >
      <Text className="mt-[10px] shrink-0 text-[15.5px] leading-[22.5px] text-ink-dim">
        {t('onboarding.code.sentTo', { phone: '+49 151 23456789' })}{' '}
        <Text weight={500} className="text-[15.5px] text-brand">
          {t('onboarding.code.change')}
        </Text>
      </Text>

      <View className="mt-[22px] shrink-0 flex-row gap-[9px]">
        {DIGITS.map((digit, index) => (
          <CodeBox key={index} value={digit} />
        ))}
      </View>

      <Text className="mt-[16px] shrink-0 text-center text-[15px] text-ink-dim">
        {t('onboarding.code.resendIn', { time: '0:24' })}
      </Text>

      <Spacer />
    </StepScaffold>
  );
}
