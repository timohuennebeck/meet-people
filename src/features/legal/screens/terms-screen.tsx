import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLegalDocument } from '@shared/data/queries/use-legal';
import { formatDayMonthYear } from '@shared/lib/datetime';
import { resolveLegalDoc } from '@shared/lib/legal';
import { useSession } from '@shared/providers/session-provider';
import { gradients, gradientStops } from '@shared/theme/tokens';
import { Button } from '@shared/ui/button';
import { CircleButton } from '@shared/ui/header';
import * as Glyph from '@shared/ui/icons';
import { Text } from '@shared/ui/text';

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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, hasOnboarded } = useSession();

  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const kind = resolveLegalDoc(doc);

  /**
   * The document in force, from `legal_documents`. It is what an acceptance
   * points at, so it has to be what was read.
   *
   * With no project configured there is no table, and the prose transcribed
   * into the locale files stands in — this is the only screen where the two
   * sources say the same words, because the rows were seeded from those keys.
   */
  const { data: published } = useLegalDocument(kind);
  const fallback = LEGAL_DOCUMENTS[kind];

  const title = published?.title ?? t(fallback.titleKey);
  const sections =
    published?.sections ??
    fallback.sections.map((section) => ({
      heading: t(section.heading),
      body: t(section.body),
    }));
  const updated = published
    ? t('legal.updatedOn', {
        date: formatDayMonthYear(new Date(published.effectiveAt), i18n.language),
        version: published.version,
      })
    : t('legal.updated');

  // This screen is reachable from the welcome page, from the account step and
  // from settings, so it normally has something to go back to. It sits outside
  // both route guards, though, which means a deep link or a guard flip can land
  // on it with an empty stack — and a dismiss that only calls `back()` would
  // strand the person here with no way out.
  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isAuthenticated && hasOnboarded ? '/(tabs)' : '/');
  };

  return (
    <View className="flex-1 overflow-hidden bg-surface-app">
      <View className="shrink-0 px-[20px]" style={{ paddingTop: Math.max(56, insets.top) }}>
        <CircleButton size={40} accessibilityLabel={t('common.back')} onPress={dismiss}>
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
            {title}
          </Text>
          <Text className="text-[13.5px] text-ink-ghost">{updated}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.heading} className="gap-[7px]">
            <Text weight={600} className="text-[16px]">
              {section.heading}
            </Text>
            <Text className="text-[14.5px] leading-[22.5px] text-ink-body">{section.body}</Text>
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
        <Button label={t('legal.understood')} variant="primaryCompact" onPress={dismiss} />
      </LinearGradient>
    </View>
  );
}
