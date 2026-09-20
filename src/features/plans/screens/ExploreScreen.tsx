import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AVATARS, VIEWER } from '@shared/data/fixtures';
import { gradients, shadows } from '@shared/theme/tokens';
import { Avatar, Chip, Glyph, Text } from '@shared/ui';

import { usePlans } from '../data/usePlans';
import { MapPin, UserDot } from '../ui/MapPin';
import { PlanCard } from '../ui/PlanCard';

/** The pill-shaped wordmark that floats over the top-left of the map. */
function BrandPill() {
  const { t } = useTranslation();

  return (
    <View
      className="flex-row items-center gap-[8px] rounded-pill bg-surface py-[8px] pl-[8px] pr-[14px]"
      style={shadows.chip}
    >
      <View className="h-[28px] w-[28px] items-center justify-center rounded-full bg-brand">
        <Text weight={600} className="text-[15px] text-white">
          t
        </Text>
      </View>
      <Text weight={600} className="text-[16px] tracking-[-0.3px]">
        {t('map.brand')}
      </Text>
    </View>
  );
}

/** The day filters: today, tomorrow, this weekend. */
const FILTERS = ['today', 'tomorrow', 'weekend'] as const;
type Filter = (typeof FILTERS)[number];

/**
 * The Explore tab — the app's home screen.
 *
 * The prototype had no tab bar, so its card carousel sat 30px from the bottom
 * edge. Here the carousel is lifted clear of the native tab bar instead, which
 * is the same visual relationship to the bottom of the usable area.
 */
export function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('today');
  const { data: plans } = usePlans(filter);

  const cards = plans ?? [];

  return (
    <View className="flex-1 overflow-hidden">
      <LinearGradient colors={gradients.map} className="absolute inset-0" />

      {/* Pins. Positions come from each plan's fixture coordinates. */}
      {cards.map((plan) => (
        <MapPin
          key={plan.id}
          avatarUri={plan.host.avatarUrl}
          category={plan.category}
          x={plan.pin.x}
          y={plan.pin.y}
          label={
            plan.id === cards[0]?.id
              ? {
                  title: plan.title.split(' no ')[0] ?? plan.title,
                  meta: `18:30 · ${plan.participants.length}/${plan.capacity}`,
                }
              : undefined
          }
          onPress={() => router.push(`/plan/${plan.id}`)}
        />
      ))}

      <UserDot x={196} y={340} />

      {/* Header: wordmark on the left, compose and avatar on the right. */}
      <View
        className="absolute left-[18px] right-[18px] flex-row items-center justify-between"
        style={{ top: Math.max(70, insets.top + 11) }}
      >
        <BrandPill />
        <View className="flex-row items-center gap-[8px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('create.what.title')}
            onPress={() => router.push('/create')}
            className="h-[44px] w-[44px] items-center justify-center rounded-full bg-brand"
            style={shadows.compose}
          >
            <Glyph.PlusGlyph size={22} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={VIEWER.name}
            onPress={() => router.push('/(tabs)/profile')}
            className="h-[44px] w-[44px] overflow-hidden rounded-full border-[3px] border-white bg-surface"
            style={shadows.chip}
          >
            <Avatar uri={AVATARS.viewer} size={38} />
          </Pressable>
        </View>
      </View>

      {/* Day filters. */}
      <View
        className="absolute left-[18px] flex-row gap-[8px]"
        style={{ top: Math.max(128, insets.top + 69) }}
      >
        {FILTERS.map((value) => (
          <Chip
            key={value}
            label={t(`map.${value}`)}
            size="filter"
            tone={filter === value ? 'brand' : 'raised'}
            onPress={() => setFilter(value)}
          />
        ))}
      </View>

      {/* Card carousel, lifted above the tab bar. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="absolute bottom-0 left-0 right-0"
        contentContainerStyle={{ paddingHorizontal: 18, gap: 12, paddingBottom: 30 }}
        style={{ marginBottom: insets.bottom }}
      >
        {cards.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            variant={index === 0 ? 'full' : 'peek'}
            onPress={() => router.push(`/plan/${plan.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
