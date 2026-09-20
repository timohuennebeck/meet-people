import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { gradients, gradientStops } from '@shared/theme/tokens';
import { Button, Glyph, Mascot, Screen, Text, TextButton } from '@shared/ui';

/** `56px circle · 13.5px caption` — the QR and "more" actions in the share row. */
function ShareAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View className="shrink-0 items-center gap-[7px]">
      <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-surface-chip">
        {icon}
      </View>
      <Text className="text-[13.5px] text-ink-dim">{label}</Text>
    </View>
  );
}

/** The confirmation after publishing, with the share row. */
export function PlanPublishedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen padding="hero">
      <LinearGradient
        colors={gradients.success}
        locations={gradientStops.published}
        className="absolute inset-0"
      />

      <View className="relative flex-1 items-center justify-center">
        <Mascot size={210} />
      </View>

      <View className="relative shrink-0">
        <Text weight={600} className="text-[32px] leading-[34.56px] tracking-[-1.024px]">
          {t('create.published.title')}
        </Text>
        <Text className="mt-[10px] text-[15.5px] text-ink-dim">
          {t('create.published.subtitle')}
        </Text>

        <Button label={t('create.published.invite')} className="mt-[20px]" />

        <View className="mt-[20px] flex-row items-center gap-[12px]">
          <View className="h-[1px] flex-1 bg-hair-mid" />
          <Text className="text-[14px] text-ink-ghost">{t('create.published.orShare')}</Text>
          <View className="h-[1px] flex-1 bg-hair-mid" />
        </View>

        <View className="mt-[16px] flex-row items-start gap-[12px]">
          <View className="min-w-0 flex-1 items-center gap-[7px]">
            <View className="h-[56px] w-full flex-row items-center gap-[9px] self-stretch rounded-pill border border-hair bg-surface px-[20px]">
              <Glyph.LinkGlyph size={16} />
              <Text numberOfLines={1} className="min-w-0 flex-1 text-[16px]">
                treff.app/p/kotti
              </Text>
            </View>
            <Text className="text-[13.5px] text-ink-dim">{t('create.published.link')}</Text>
          </View>

          <ShareAction icon={<Glyph.QrGlyph size={22} />} label={t('create.published.qr')} />
          <ShareAction
            icon={<Glyph.DotsHorizontal size={22} />}
            label={t('create.published.more')}
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
