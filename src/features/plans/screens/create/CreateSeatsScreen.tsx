import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { Button, Card, Glyph, Text } from '@shared/ui';

import { CREATE_TOTAL, CreateStepLayout } from '../../ui/CreateStepLayout';

const MIN_SEATS = 2;
const MAX_SEATS = 20;

/** A round stepper control; the decrement greys out at the minimum. */
function StepperButton({
  kind,
  disabled,
  onPress,
}: {
  kind: 'minus' | 'plus';
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={kind}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full',
        kind === 'plus' ? 'bg-brand' : 'bg-surface-chip',
        disabled ? 'opacity-40' : 'active:opacity-70',
      )}
    >
      {kind === 'plus' ? (
        <Glyph.PlusGlyph size={22} strokeWidth={2.4} />
      ) : (
        <Glyph.MinusGlyph size={22} color={colors.inkStrong} />
      )}
    </Pressable>
  );
}

/** Create step 5 — how many seats, counting the host. */
export function CreateSeatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [seats, setSeats] = useState(4);

  return (
    <CreateStepLayout
      step={5}
      progress={1}
      total={CREATE_TOTAL}
      title={t('create.seats.title')}
      subtitle={t('create.seats.subtitle')}
      footer={
        <Button label={t('common.publish')} onPress={() => router.push('/create/audience')} />
      }
    >
      <View className="mt-[22px] flex-1">
        <Card padding={{ vertical: 22, horizontal: 18 }}>
          <View className="items-center gap-[14px]">
            <View className="flex-row items-center gap-[14px] self-stretch">
              <StepperButton
                kind="minus"
                disabled={seats <= MIN_SEATS}
                onPress={() => setSeats((count) => Math.max(MIN_SEATS, count - 1))}
              />
              <Text
                weight={600}
                className="flex-1 text-center text-[38px] leading-[38px] tracking-[-1.52px]"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {seats}
              </Text>
              <StepperButton
                kind="plus"
                disabled={seats >= MAX_SEATS}
                onPress={() => setSeats((count) => Math.min(MAX_SEATS, count + 1))}
              />
            </View>
            <Text className="text-[17px] text-ink-dim">
              {t('create.seats.caption', { others: String(seats - 1) })}
            </Text>
          </View>
        </Card>
      </View>
    </CreateStepLayout>
  );
}
