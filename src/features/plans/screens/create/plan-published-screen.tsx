import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, gradientStops } from '@shared/theme/tokens';
import {
  Button,
  CircleButton,
  Glyph,
  LabelledDivider,
  Mascot,
  Screen,
  StepTitle,
  Text,
  TextButton,
} from '@shared/ui';

import { planLink, sharePlan } from '../../lib/share';

/** `56px circle · 13.5px caption` — the QR and "more" actions in the share row. */
function ShareAction({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? label : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="shrink-0 items-center gap-[7px] active:opacity-60"
    >
      <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-surface-chip">
        {icon}
      </View>
      <Text className="text-[13.5px] text-ink-dim">{label}</Text>
    </Pressable>
  );
}

/** The confirmation after publishing, with the share row. */
export function PlanPublishedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // The id the publish came back with. The link is the one thing on this screen
  // that has to name the plan that was actually made.
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <Screen padding="hero">
      <LinearGradient
        colors={gradients.success}
        locations={gradientStops.published}
        className="absolute inset-0"
      />

      {/* The plan is already published by the time this screen is reached, so
          the × is a way out of the flow rather than a cancel — it lands on the
          map, the same place "Concluído" does.

          Absolutely positioned: the design frame has no such control, and
          giving it a row of its own pushed the mascot and the whole heading
          block 20px down the screen. */}
      <View className="absolute left-[24px] z-10" style={{ top: Math.max(62, insets.top) }}>
        <CircleButton
          size={40}
          accessibilityLabel={t('common.close')}
          onPress={() => router.replace('/(tabs)')}
        >
          <Glyph.CloseHeader size={12} />
        </CircleButton>
      </View>

      <View className="relative flex-1 items-center justify-center">
        <Mascot size={210} />
      </View>

      <View className="relative shrink-0">
        <StepTitle>{t('create.published.title')}</StepTitle>
        {/* Not `StepSubtitle`: the design leaves this one's line-height at the
            font default rather than the 1.45 every other subtitle carries. */}
        <Text className="mt-[10px] text-[15.5px] text-ink-dim">
          {t('create.published.subtitle')}
        </Text>

        <Button
          label={t('create.published.invite')}
          className="mt-[20px]"
          onPress={() => {
            if (id) void sharePlan(id, t('create.published.title'));
          }}
        />

        <LabelledDivider label={t('create.published.orShare')} className="mt-[20px]" />

        <View className="mt-[16px] flex-row items-start gap-[12px]">
          <View className="min-w-0 flex-1 items-center gap-[7px]">
            <View className="h-[56px] w-full flex-row items-center gap-[9px] self-stretch rounded-pill border border-hair bg-surface px-[20px]">
              <Glyph.LinkGlyph size={16} />
              <Text numberOfLines={1} className="min-w-0 flex-1 text-[16px]">
                {id ? planLink(id).replace('https://', '') : 'treff.app'}
              </Text>
            </View>
            <Text className="text-[13.5px] text-ink-dim">{t('create.published.link')}</Text>
          </View>

          <ShareAction icon={<Glyph.QrGlyph size={22} />} label={t('create.published.qr')} />
          <ShareAction
            icon={<Glyph.DotsHorizontal size={22} />}
            label={t('create.published.more')}
            onPress={() => {
              if (id) void sharePlan(id, t('create.published.title'));
            }}
          />
        </View>

        <TextButton
          label={t('common.done')}
          className="mt-[15px]"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </Screen>
  );
}
