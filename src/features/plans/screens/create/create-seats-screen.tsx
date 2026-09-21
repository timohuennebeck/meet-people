import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { Button, Card, Glyph, Text } from '@shared/ui';

import { useCreatePlan } from '../../data/create-plan-provider';
import { CreateStepLayout } from '../../ui/create-step-layout';

const MIN_SEATS = 2;
const MAX_SEATS = 20;

/** What the stepper opens on — the design draws four. */
const DEFAULT_SEATS = 4;

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

/** Create step 6 — how many seats, counting the host. */
export function CreateSeatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, set } = useCreatePlan();
  // This step has no uncapped option — that is a standing meetup, which the
  // create flow does not make — so the stepper always has a number to show.
  const seats = draft.seats ?? DEFAULT_SEATS;

  return (
    <CreateStepLayout
      step={6}
      title={t('create.seats.title')}
      subtitle={t('create.seats.subtitle')}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/create/audience')} />
      }
    >
      <View className="mt-[22px] flex-1">
        <Card padding={{ vertical: 22, horizontal: 18 }}>
          <View className="items-center gap-[14px]">
            <View className="flex-row items-center gap-[14px] self-stretch">
              <StepperButton
                kind="minus"
                disabled={seats <= MIN_SEATS}
                onPress={() => set({ seats: Math.max(MIN_SEATS, seats - 1) })}
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
                onPress={() => set({ seats: Math.min(MAX_SEATS, seats + 1) })}
              />
            </View>
            {/* The caption is what moves: its `{{others}}` count is drawn with
                proportional figures and the label is only as wide as its text,
                so a centred line re-centres on every step. Tabular figures keep
                the digits one width and stretching the label to the card makes
                the centring independent of how long the line is. */}
            <Text
              className="self-stretch text-center text-[17px] text-ink-dim"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {t('create.seats.caption', { others: String(seats - 1) })}
            </Text>
          </View>
        </Card>
      </View>
    </CreateStepLayout>
  );
}
