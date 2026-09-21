import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  withTiming,
  type EntryAnimationsValues,
} from 'react-native-reanimated';

import { STEPS } from '@shared/lib/steps';
import { gradientAngles, gradients, shadows } from '@shared/theme/tokens';
import { Button, Spacer, TextButton } from '@shared/ui/button';
import * as Glyph from '@shared/ui/icons';
import { Mascot } from '@shared/ui/mascot';
import { StepScaffold } from '@shared/ui/step-scaffold';
import { Text } from '@shared/ui/text';

const RULE_COUNT = 3;

/**
 * `translateX(112%) rotate(5deg) → none` over `.62s cubic-bezier(.2,.8,.25,1)`,
 * with the fade finishing at 60% — the design's `ruleInA` keyframes. Each card
 * is dealt in from the right like the next card off a deck, which is why it
 * arrives tilted and straightens as it lands.
 *
 * Written out rather than composed from `SlideInRight`, which has no rotation.
 */
const DURATION = 620;

function dealIn(values: EntryAnimationsValues) {
  'worklet';
  const easing = Easing.bezier(0.2, 0.8, 0.25, 1);
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateX: values.targetWidth * 1.12 }, { rotate: '5deg' }],
    },
    animations: {
      opacity: withTiming(1, { duration: DURATION * 0.6, easing }),
      transform: [
        { translateX: withTiming(0, { duration: DURATION, easing }) },
        { rotate: withTiming('0deg', { duration: DURATION, easing }) },
      ],
    },
  };
}

/** A confirmed rule, listed under the card as the user works through them. */
function ConfirmedRule({ title, index }: { title: string; index: number }) {
  return (
    <Animated.View
      // `ruleRowIn`: down from 8px above over .45s, not the default 25px.
      entering={FadeInUp.duration(450)
        .delay(index * 40)
        .withInitialValues({ opacity: 0, transform: [{ translateY: -8 }] })}
      className="flex-row items-center gap-[11px] rounded-[16px] bg-brand-row px-[15px] py-[12px]"
    >
      <View className="h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand">
        <Glyph.Check size={12} strokeWidth={2.8} />
      </View>
      <Text weight={500} className="text-[15.5px] text-brand-slate">
        {title}
      </Text>
    </Animated.View>
  );
}

/** The last step — the three community rules, confirmed one at a time. */
export function RulesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(0);

  const rules = [
    { title: t('onboarding.rules.showUpTitle'), body: t('onboarding.rules.showUpBody') },
    { title: t('onboarding.rules.publicTitle'), body: t('onboarding.rules.publicBody') },
    { title: t('onboarding.rules.noFlirtTitle'), body: t('onboarding.rules.noFlirtBody') },
  ];

  const allDone = confirmed >= RULE_COUNT;
  const index = Math.min(confirmed, RULE_COUNT - 1);
  const current = rules[index]!;

  const advance = () => {
    if (allDone) {
      router.push('/(onboarding)/paywall');
      return;
    }
    setConfirmed((count) => count + 1);
  };

  return (
    <StepScaffold
      position={STEPS.rules}
      // The rules card is taller than a usual step's content, so the design
      // pulls the heading block in.
      spacing={{ title: 20, subtitle: 8 }}
      title={t('onboarding.rules.title')}
      subtitle={t('onboarding.rules.subtitle')}
      footer={
        <>
          <Button
            label={
              allDone
                ? t('onboarding.rules.allConfirmed')
                : confirmed === RULE_COUNT - 1
                  ? t('onboarding.rules.confirmAll')
                  : t('onboarding.rules.agree')
            }
            onPress={advance}
          />
          <TextButton
            label={t('onboarding.rules.restart')}
            tone="mutedSoft"
            className="mt-[14px]"
            onPress={() => setConfirmed(0)}
          />
        </>
      }
    >
      <Animated.View
        // Re-keying on the index replays the card's entrance for each rule —
        // the design alternates two identical keyframe names for the same
        // reason, since CSS will not restart an animation that is already on.
        key={index}
        entering={dealIn}
        className="mt-[20px] h-[296px] shrink-0 rounded-[30px] bg-surface p-[20px]"
        style={shadows.ruleCard}
      >
        <View className="shrink-0 flex-row items-center gap-[12px]">
          <View className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-brand-pale">
            <Text weight={600} className="text-[21px] text-brand">
              {index + 1}
            </Text>
          </View>
          <Text weight={500} className="flex-1 text-[14.5px] text-ink-dim">
            {t('onboarding.rules.counter', { index: String(index + 1) })}
          </Text>
        </View>

        <LinearGradient
          colors={gradients.photo}
          {...gradientAngles.photo}
          className="mt-[16px] min-h-0 flex-1 items-center justify-center overflow-hidden rounded-well"
        >
          <Mascot size={120} />
        </LinearGradient>

        <Text
          weight={600}
          className="mt-[14px] shrink-0 text-[22px] leading-[25.08px] tracking-[-0.528px]"
        >
          {current.title}
        </Text>
        <Text className="mt-[5px] shrink-0 text-[15px] leading-[21px] text-ink-dim">
          {current.body}
        </Text>
      </Animated.View>

      <View className="mt-[16px] shrink-0 gap-[9px]">
        {rules.slice(0, confirmed).map((rule, position) => (
          <ConfirmedRule key={rule.title} title={rule.title} index={position} />
        ))}
      </View>

      <Spacer />
    </StepScaffold>
  );
}
