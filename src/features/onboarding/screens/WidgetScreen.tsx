import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { AVATARS } from '@shared/data/fixtures';
import { STEPS } from '@shared/lib/steps';
import { AvatarStack, Button, Spacer, Text, TextButton } from '@shared/ui';

/** A dimmed placeholder tile in the mocked home screen behind the widget. */
function AppTile({ opacity }: { opacity: number }) {
  return (
    <View
      className="aspect-square flex-1 rounded-[13px]"
      style={{ backgroundColor: `rgba(255,255,255,${opacity})` }}
    />
  );
}

function TileRow({ opacities }: { opacities: number[] }) {
  return (
    <View className="flex-row gap-[11px]">
      {opacities.map((opacity, index) => (
        <AppTile key={index} opacity={opacity} />
      ))}
    </View>
  );
}

/** Step 10 — an optional home-screen widget, previewed on a mock springboard. */
export function WidgetScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const next = () => router.push('/(onboarding)/name');

  return (
    <StepScaffold
      position={STEPS.widget}
      title={t('onboarding.widget.title')}
      subtitle={t('onboarding.widget.subtitle')}
      footer={
        <>
          <Button label={t('onboarding.widget.add')} onPress={next} />
          <TextButton label={t('common.later')} className="mt-[15px]" onPress={next} />
        </>
      }
    >
      <View className="mt-[20px] shrink-0 gap-[14px] rounded-[28px] bg-surface-night p-[16px]">
        {/* Top block: the 2×2 widget beside a 2×2 block of app icons. */}
        <View className="flex-row gap-[11px]">
          <View className="aspect-square flex-[2] rounded-[18px] bg-surface p-[14px]">
            <Text weight={600} className="text-[10.5px] tracking-[1.26px] text-ink-ghost">
              {t('onboarding.widget.nearYou')}
            </Text>
            <Text weight={600} className="mt-[9px] text-[16.5px] leading-[19px] tracking-[-0.33px]">
              {t('onboarding.widget.planTitle')}
            </Text>
            <Text className="mt-[4px] text-[12.5px] text-ink-dim">
              {t('onboarding.widget.planMeta')}
            </Text>
            <View className="flex-1" />
            <View className="flex-row items-center gap-[7px]">
              <AvatarStack
                uris={[AVATARS.sara, AVATARS.lea]}
                size={20}
                overlap={7}
                ringColor="#fff"
              />
              <Text weight={600} className="text-[12.5px] text-brand">
                {t('onboarding.widget.seats')}
              </Text>
            </View>
          </View>

          <View className="flex-[2] gap-[11px]">
            <TileRow opacities={[0.1, 0.07]} />
            <TileRow opacities={[0.07, 0.11]} />
          </View>
        </View>

        {/* The row of icons that sits under the widget. */}
        <TileRow opacities={[0.07, 0.1, 0.07, 0.07]} />

        {/* Dock. */}
        <View
          className="rounded-well p-[10px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          <TileRow opacities={[0.12, 0.09, 0.12, 0.09]} />
        </View>
      </View>

      <Spacer min={16} />
    </StepScaffold>
  );
}
