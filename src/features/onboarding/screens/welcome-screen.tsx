import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Star } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { colors, gradients, gradientStops, shadows } from '@shared/theme/tokens';
import { Button, Face, Highlight, Mascot, Screen, Text } from '@shared/ui';

import { LanguagePicker } from '../ui/language-picker';
import { LegalLink } from '../ui/legal-link';

/**
 * Two floating plan cards that overlap the mascot, pinned to the design's
 * offsets (`left:-4px top:26px` and `right:-6px bottom:44px`).
 */
function FloatingPlan({
  title,
  meta,
  position,
}: {
  title: string;
  meta: string;
  position: { left?: number; right?: number; top?: number; bottom?: number };
}) {
  return (
    <View
      className="absolute flex-row items-center gap-[9px] rounded-field bg-surface py-[9px] pl-[9px] pr-[13px]"
      style={[position, shadows.floatCard]}
    >
      {/* Faceless on purpose: nobody is signed in here and these two cards
          illustrate what a plan looks like rather than reporting real ones.
          The design's portraits were picsum strangers. */}
      <Face uri={null} size={34} />
      <View>
        <Text weight={600} className="text-[13px] leading-[15.6px]" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-[12px] text-ink-dim">{meta}</Text>
      </View>
    </View>
  );
}

/** The first screen: one image, one sentence and two real plans. */
export function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen padding="hero">
      <LinearGradient
        colors={gradients.welcome}
        locations={gradientStops.welcome}
        className="absolute inset-0"
      />

      {/* Before anything else, and out of the way of everyone who does not
          need it: the app's language used to be a whole step asking the
          question before the person had a reason to care. */}
      <View className="shrink-0 flex-row justify-end">
        <LanguagePicker />
      </View>

      <View className="relative flex-1 items-center justify-center">
        <Mascot size={244} />
        <FloatingPlan
          title={t('welcome.planRunTitle')}
          meta={t('welcome.planRunMeta')}
          position={{ left: -4, top: 26 }}
        />
        <FloatingPlan
          title={t('welcome.planCoffeeTitle')}
          meta={t('welcome.planCoffeeMeta')}
          position={{ right: -6, bottom: 44 }}
        />
      </View>

      <View className="relative shrink-0">
        {/* `padding:0 8px · radius:8px`, and the design breaks the line after it. */}
        <Highlight
          className="rounded-[8px] bg-brand-haze px-[8px]"
          textClassName="text-[34px] leading-[40.12px] tracking-[-1.19px] text-brand-ink"
        >
          {t('welcome.titleHighlight')}
        </Highlight>
        <Text weight={600} className="text-[34px] leading-[40.12px] tracking-[-1.19px]">
          {t('welcome.titleRest')}
        </Text>

        <Text className="mt-[11px] text-[16.5px] text-ink-dim">{t('welcome.subtitle')}</Text>

        {/* The design puts three faces before this line. They were picsum
            strangers presented as members, and three silhouettes in their
            place would say nothing, so the line stands on its own until real
            marketing artwork exists. */}
        <View className="mt-[20px] flex-row items-center gap-[10px]">
          <Text className="text-[14.5px] text-ink-body">{t('welcome.socialProof')}</Text>
        </View>

        <View className="mt-[14px] flex-row items-center gap-[9px]">
          {/* Drawn rather than typed: `★` is sharp-pointed and renders from a
              different font on every platform. Phosphor's filled star has the
              rounded points the design wants and one shape everywhere. */}
          <View className="flex-row gap-[2px]">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} size={16} weight="fill" color={colors.brand} />
            ))}
          </View>
          <Text weight={600} className="text-[15.5px]">
            {t('welcome.rating')}
          </Text>
          <Text className="text-[14.5px] text-ink-ghost">{t('welcome.ratingCount')}</Text>
        </View>

        <Button
          label={t('welcome.start')}
          className="mt-[20px]"
          onPress={() => router.push('/(onboarding)/location')}
        />

        <Pressable
          accessibilityRole="button"
          className="active:opacity-60"
          onPress={() => router.push('/(onboarding)/sign-in')}
        >
          <Text weight={500} className="mt-[15px] text-center text-[16px] text-ink-body">
            {t('welcome.haveAccount')}{' '}
            <Text weight={600} className="text-[16px] text-brand">
              {t('welcome.signIn')}
            </Text>
          </Text>
        </Pressable>

        <Text className="mt-[13px] text-center text-[13px] leading-[19.5px] text-ink-dim">
          {t('welcome.legalPrefix')}{' '}
          <LegalLink doc="terms" label={t('welcome.terms')} className="text-[13px] text-brand" />{' '}
          {t('welcome.legalJoin')}{' '}
          <LegalLink
            doc="privacy"
            label={t('welcome.privacy')}
            className="text-[13px] text-brand"
          />
          {t('welcome.legalSuffix')}
        </Text>
      </View>
    </Screen>
  );
}
