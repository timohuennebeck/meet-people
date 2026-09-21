import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useSession } from '@shared/providers/session-provider';
import {
  Button,
  CheckLine,
  CircleButton,
  Glyph,
  Highlight,
  Mascot,
  Screen,
  SelectableCard,
  SelectionDot,
  Spacer,
  Text,
  TextButton,
} from '@shared/ui';

type PlanId = 'monthly' | 'yearly';

/** One of the two subscription tiles. */
function PriceTile({
  label,
  price,
  period,
  selected,
  badge,
  onPress,
}: {
  label: string;
  price: string;
  period: string;
  selected: boolean;
  badge?: string;
  onPress: () => void;
}) {
  return (
    // The wrapper exists so the "melhor valor" badge can hang above the tile's
    // top edge; the tile itself owns the press and the ring swap.
    <View className="relative flex-1">
      <SelectableCard
        selected={selected}
        onPress={onPress}
        restingRing="cool"
        padding={{ vertical: 16, horizontal: 16 }}
        className="rounded-tile"
      >
        <View className="gap-[4px]">
          <View className="flex-row items-start justify-between">
            <Text weight={600} className="text-[15.5px]">
              {label}
            </Text>
            <SelectionDot selected={selected} size={23} restingClassName="border-hair-steel" />
          </View>
          <Text weight={600} className="mt-[8px] text-[21px] tracking-[-0.42px]">
            {price}
          </Text>
          <Text className="text-[14px] text-ink-ghost">{period}</Text>
        </View>
      </SelectableCard>
      {badge ? (
        <View className="absolute -top-[13px] left-1/2 -translate-x-1/2 rounded-pill bg-brand px-[12px] py-[5px]">
          <Text weight={600} className="text-[13px] text-white">
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The paywall. What is sold is the demand side — unlimited join requests,
 * seeing who wants to meet you, the whole city and the filters. Creating plans
 * stays free, because without hosts there is nothing to sell.
 */
export function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { completeOnboarding, signIn, setSubscribed } = useSession();
  const [selected, setSelected] = useState<PlanId>('yearly');

  const finish = (subscribed: boolean) => {
    signIn();
    completeOnboarding();
    // The real purchase runs through RevenueCat; until then, starting the trial
    // is what grants the entitlement.
    if (subscribed) setSubscribed(true);
    router.replace('/(tabs)');
  };

  return (
    <Screen padding="paywall" className="bg-surface-alt">
      <View className="h-[34px] shrink-0 flex-row items-center">
        <CircleButton
          size={34}
          className="bg-surface-dusk"
          accessibilityLabel={t('common.close')}
          onPress={() => finish(false)}
        >
          <Glyph.CloseHeader size={12} />
        </CircleButton>
      </View>

      <View className="mt-[4px] shrink-0 items-center">
        <Mascot size={132} />
      </View>

      <View className="mt-[8px] shrink-0 flex-row items-center gap-[8px]">
        <Text weight={600} className="text-[16px] text-ink-body">
          {t('paywall.brand')}
        </Text>
        <View className="rounded-pill bg-brand px-[11px] py-[4px]">
          <Text weight={600} className="text-[14px] text-white">
            {t('paywall.plus')}
          </Text>
        </View>
      </View>

      <View className="mt-[10px] shrink-0">
        <Text weight={600} className="text-[29px] leading-[32.48px] tracking-[-0.928px]">
          {t('paywall.titleLead')}
        </Text>
        {/* `padding:2px 10px · radius:10px`, pulled back 4px by the design's
            negative margin so the band lines up with the text above it. */}
        <View className="-ml-[4px] flex-row items-center gap-[6px]">
          <Highlight
            className="rounded-[10px] bg-brand-band px-[10px] py-[2px]"
            textClassName="text-[29px] leading-[32.48px] tracking-[-0.928px]"
          >
            {t('paywall.titleHighlight')}
          </Highlight>
          <Text weight={600} className="text-[29px] leading-[32.48px] tracking-[-0.928px]">
            {t('paywall.titleTrail')}
          </Text>
        </View>
      </View>

      <Text className="mt-[9px] shrink-0 text-[15px] leading-[21.3px] text-ink-dim">
        {t('paywall.subtitle')}
      </Text>

      <View className="mt-[16px] shrink-0 gap-[11px]">
        <CheckLine>{t('paywall.perkRequests')}</CheckLine>
        <CheckLine>{t('paywall.perkVisibility')}</CheckLine>
        <CheckLine>{t('paywall.perkCity')}</CheckLine>
        <CheckLine>{t('paywall.perkFilters')}</CheckLine>
      </View>

      <View className="mt-[18px] shrink-0 flex-row items-stretch gap-[12px]">
        <PriceTile
          label={t('paywall.monthly')}
          price="9,99 €"
          period={t('paywall.perMonth')}
          selected={selected === 'monthly'}
          onPress={() => setSelected('monthly')}
        />
        <PriceTile
          label={t('paywall.yearly')}
          price="5,99 €"
          period={t('paywall.perYear')}
          badge={t('paywall.save')}
          selected={selected === 'yearly'}
          onPress={() => setSelected('yearly')}
        />
      </View>

      <Spacer min={10} />

      <Button label={t('paywall.trial')} onPress={() => finish(true)} />

      <Text className="mt-[11px] shrink-0 text-center text-[13.5px] leading-[19.6px] text-ink-ghost">
        {t('paywall.trialTerms')}
      </Text>

      <TextButton label={t('paywall.restore')} tone="bodySmall" className="mt-[12px] shrink-0" />
    </Screen>
  );
}
