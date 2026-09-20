import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { gradients, gradientStops } from '@shared/theme/tokens';
import {
  Button,
  Glyph,
  LabelledDivider,
  Mascot,
  Screen,
  StepTitle,
  Text,
  TextButton,
} from '@shared/ui';

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
        <StepTitle>{t('create.published.title')}</StepTitle>
        {/* Not `StepSubtitle`: the design leaves this one's line-height at the
            font default rather than the 1.45 every other subtitle carries. */}
        <Text className="mt-[10px] text-[15.5px] text-ink-dim">
          {t('create.published.subtitle')}
        </Text>

        <Button label={t('create.published.invite')} className="mt-[20px]" />

        <LabelledDivider label={t('create.published.orShare')} className="mt-[20px]" />

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
