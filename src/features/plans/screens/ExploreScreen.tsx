import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useViewer } from '@shared/data/useViewer';
import { formatTime, isOnDayFilter, type DayFilter } from '@shared/lib/datetime';
import { gradients, shadows } from '@shared/theme/tokens';
import { Avatar, Chip, Glyph, GlowingMascot, Text } from '@shared/ui';

import { usePlans } from '../data/usePlans';
import { MapPin, UserDot } from '../ui/MapPin';
import { PLAN_CARD_WIDTH, PlanCard } from '../ui/PlanCard';

/** Gap between two cards in the carousel, as the design spaces them. */
const CARD_GAP = 12;

/**
 * One card plus its gutter — the distance the carousel travels between two
 * cards, and so the offset it settles on when a swipe ends.
 */
const CARD_INTERVAL = PLAN_CARD_WIDTH + CARD_GAP;

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

/**
 * The day filters: today, tomorrow, this weekend.
 *
 * They narrow what the map draws rather than what it asks for. `nearby_plans()`
 * already returns every upcoming plan inside the radius, ordered by
 * `starts_at`, so the rows a chip wants are in memory the moment the list
 * lands: a round trip per tap would be slower and no more correct. The rule
 * each chip stands for lives in `isOnDayFilter`. See `planKeys.list`.
 */
const FILTERS: readonly DayFilter[] = ['today', 'tomorrow', 'weekend'];

/** `300px` empty panel shown where the carousel would be on a day with nothing on. */
function NothingOnThisDay({ filter }: { filter: DayFilter }) {
  const { t } = useTranslation();

  return (
    <View
      className="items-center gap-[8px] rounded-card bg-surface px-[18px] py-[22px]"
      style={[{ width: PLAN_CARD_WIDTH }, shadows.planCard]}
    >
      <GlowingMascot />
      <Text weight={600} className="text-[16px]">
        {t(`map.empty.${filter}`)}
      </Text>
      <Text
        weight={500}
        className="max-w-[240px] text-center text-[13.5px] leading-[19.6px] text-ink-faint"
      >
        {t('map.empty.body')}
      </Text>
    </View>
  );
}

/**
 * The Explore tab — the app's home screen.
 *
 * The prototype had no tab bar, so its card carousel sat 30px from the bottom
 * edge. Here the carousel is lifted clear of the native tab bar instead, which
 * is the same visual relationship to the bottom of the usable area.
 */
export function ExploreScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<DayFilter>('today');
  const { data: plans } = usePlans();
  const { data: viewer } = useViewer();

  // One query, three views of it: the chips re-slice what is already here
  // rather than re-keying the list. `startsAt` is the ISO instant the row
  // carries alongside its pre-formatted label.
  const cards = useMemo(
    () => (plans ?? []).filter((plan) => isOnDayFilter(new Date(plan.startsAt), filter)),
    [plans, filter],
  );

  return (
    <View className="flex-1 overflow-hidden">
      <LinearGradient colors={gradients.map} className="absolute inset-0" />

      {/* Pins. A plan with no host — a standing meetup — has no face to wear,
          so the pin falls back to whoever is in it, and to the repeat mark when
          nobody is yet. */}
      {cards.map((plan) => (
        <MapPin
          key={plan.id}
          avatarUri={plan.host?.avatarUrl ?? plan.participants[0]?.user.avatarUrl}
          x={plan.pin.x}
          y={plan.pin.y}
          title={plan.title}
          // Only the focused plan names itself on the map.
          label={
            plan.id === cards[0]?.id && plan.pinLabel
              ? {
                  title: plan.pinLabel,
                  meta: `${formatTime(new Date(plan.startsAt), i18n.language)} · ${plan.participants.length}${plan.capacity === null ? '' : `/${plan.capacity}`}`,
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
            accessibilityLabel={viewer?.name ?? t('common.profile')}
            onPress={() => router.push('/(tabs)/profile')}
            // 44px avatar with a 3px white ring drawn outside it.
            className="h-[50px] w-[50px] overflow-hidden rounded-full border-[3px] border-white bg-surface"
            style={shadows.chip}
          >
            <Avatar uri={viewer?.avatarUrl ?? ''} size={44} />
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
        // Settle card-to-card rather than drifting: every card starts one
        // `CARD_INTERVAL` after the last, so the snap offsets are the multiples
        // of that interval. `disableIntervalMomentum` keeps a hard flick from
        // flying past several cards at once.
        snapToInterval={CARD_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        className="absolute bottom-0 left-0 right-0"
        // The design insets the carousel on the left only, so the last card can
        // scroll flush to the right edge.
        contentContainerStyle={{ paddingLeft: 18, gap: CARD_GAP, paddingBottom: 30 }}
        style={{ marginBottom: insets.bottom }}
      >
        {cards.length === 0 ? (
          <NothingOnThisDay filter={filter} />
        ) : (
          cards.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              variant={index === 0 ? 'full' : 'peek'}
              onPress={() => router.push(`/plan/${plan.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
