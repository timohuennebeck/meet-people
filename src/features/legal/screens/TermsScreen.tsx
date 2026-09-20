import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveLegalDoc } from '@shared/lib/legal';
import { gradients, gradientStops } from '@shared/theme/tokens';
import { Button, CircleButton, Glyph, Text } from '@shared/ui';

import { LEGAL_DOCUMENTS } from '../lib/documents';

/** Room under the last section for the pinned action and its fade. */
const FOOTER_SPACE = 104;

/**
 * The terms of use and the privacy policy, which are the same page — `?doc=`
 * picks which one, defaulting to the terms.
 *
 * The screen draws its own frame rather than using `Screen`, because the copy
 * has to scroll the full height and pass under the pinned "got it" button,
 * which `Screen`'s bottom padding would hold it clear of.
 */
export function TermsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const document = LEGAL_DOCUMENTS[resolveLegalDoc(doc)];

  return (
    <View className="flex-1 overflow-hidden bg-surface-app">
      <View className="shrink-0 px-[20px]" style={{ paddingTop: Math.max(56, insets.top) }}>
        <CircleButton size={40} accessibilityLabel={t('common.back')} onPress={() => router.back()}>
          <Glyph.ChevronLeft size={13} />
        </CircleButton>
      </View>

      <ScrollView
        className="min-h-0 flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: FOOTER_SPACE + insets.bottom,
          rowGap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-[6px]">
          <Text weight={600} className="text-[28px] leading-[30.2px] tracking-[-0.84px]">
            {t(document.titleKey)}
          </Text>
          <Text className="text-[13.5px] text-ink-ghost">{t('legal.updated')}</Text>
        </View>

        {document.sections.map((section) => (
          <View key={section.heading} className="gap-[7px]">
            <Text weight={600} className="text-[16px]">
              {t(section.heading)}
            </Text>
            <Text className="text-[14.5px] leading-[22.5px] text-ink-body">{t(section.body)}</Text>
          </View>
        ))}
      </ScrollView>

      <LinearGradient
        colors={gradients.appFade}
        locations={gradientStops.appFade}
        className="absolute inset-x-0 bottom-0 px-[20px] pt-[14px]"
        style={{ paddingBottom: Math.max(34, insets.bottom) }}
        pointerEvents="box-none"
      >
        <Button
          label={t('legal.understood')}
          variant="primaryCompact"
          onPress={() => router.back()}
        />
      </LinearGradient>
    </View>
  );
}
