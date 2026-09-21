import DateTimePicker, {
  DateTimePickerAndroid,
  type AndroidNativeProps,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

import {
  DEFAULT_START_HOUR,
  formatPlanDate,
  formatTime,
  inAnHour,
  isToday,
  todayAtHour,
} from '@shared/lib/datetime';
import { colors } from '@shared/theme/tokens';
import { Button, Chip, Glyph, SectionLabel, Spacer, Text } from '@shared/ui';

import { useCreatePlan } from '../../data/create-plan-provider';
import { CreateStepLayout } from '../../ui/create-step-layout';

/** `height:262px;border-radius:28px` — the card the design draws the wheels in. */
const CARD_HEIGHT = 262;

type Duration = 60 | 120 | 180 | null;

/**
 * Which quick chip is lit. Dialling a time in by hand lights neither, since the
 * start no longer is what either chip offers.
 */
type Preset = 'inAnHour' | 'todayEvening' | 'exact';

/** Create step 3 — start time and how long it runs. */
export function CreateWhenScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { draft, set } = useCreatePlan();
  const duration = draft.durationMinutes as Duration;
  const setDuration = (next: Duration) => set({ durationMinutes: next });

  // The evening chip's own time. Fixed for the life of the screen so its label
  // and the value it sets can never drift apart.
  const evening = useMemo(() => todayAtHour(DEFAULT_START_HOUR), []);
  // A plan cannot start in the past. Pinned at mount rather than recomputed per
  // render, so the native picker is not handed a new floor on every keystroke.
  const earliest = useMemo(() => new Date(), []);
  const startsAt = draft.startsAt;
  const setStartsAt = useCallback((next: Date) => set({ startsAt: next }), [set]);
  const [preset, setPreset] = useState<Preset>('exact');

  const commit = useCallback(
    (event: DateTimePickerEvent, picked?: Date) => {
      // Android reports a cancelled dialog as `dismissed` with no date; iOS only
      // ever reports `set`, once per detent of the wheel.
      if (event.type !== 'set' || !picked) return;
      setStartsAt(picked);
      setPreset('exact');
    },
    [setStartsAt],
  );

  /**
   * Android has no inline picker, and splits date and time into two dialogs.
   * Each is seeded with the current start, so the half it does not ask about
   * survives untouched.
   */
  const openDialog = useCallback(
    (mode: AndroidNativeProps['mode']) => {
      DateTimePickerAndroid.open({
        value: startsAt,
        mode,
        display: 'spinner',
        // Freshly computed: the dialog opens long after the screen mounted.
        minimumDate: new Date(),
        onChange: commit,
      });
    },
    [startsAt, commit],
  );

  const durations: { value: Duration; label: string }[] = [
    { value: 60, label: t('create.when.oneHour') },
    { value: 120, label: t('create.when.twoHours') },
    { value: 180, label: t('create.when.threeHours') },
    { value: null, label: t('create.when.openEnded') },
  ];

  return (
    <CreateStepLayout
      step={3}
      title={t('create.when.title')}
      subtitle={t('create.when.subtitle', { place: draft.place?.name ?? '' })}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/create/join-mode')} />
      }
    >
      <View className="mt-[16px] shrink-0 flex-row flex-wrap gap-[8px]">
        <Chip
          label={t('create.when.inAnHour')}
          size="time"
          tone={preset === 'inAnHour' ? 'brand' : 'chip'}
          onPress={() => {
            setStartsAt(inAnHour());
            setPreset('inAnHour');
          }}
        />
        <Chip
          label={t(isToday(evening) ? 'create.when.todayAt' : 'create.when.tomorrowAt', {
            time: formatTime(evening, i18n.language),
          })}
          size="time"
          tone={preset === 'todayEvening' ? 'brand' : 'chip'}
          onPress={() => {
            setStartsAt(evening);
            setPreset('todayEvening');
          }}
        />
      </View>

      <View
        className="mt-[14px] shrink-0 overflow-hidden rounded-[28px] border border-hair bg-surface"
        style={{ height: CARD_HEIGHT }}
      >
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={startsAt}
            mode="datetime"
            display="spinner"
            locale={i18n.language}
            minimumDate={earliest}
            textColor={colors.ink}
            onChange={commit}
            accessibilityLabel={t('create.when.exact')}
            // NativeWind drops `className` on components it has not been taught
            // (see `@shared/ui/interop`), and the native picker is not one of
            // them, so it is sized with a style.
            style={{ flex: 1 }}
          />
        ) : (
          <View className="flex-1 justify-center gap-[12px] px-[16px]">
            <ExactRow
              label={t('create.when.dayLabel')}
              value={formatPlanDate(startsAt, i18n.language)}
              onPress={() => openDialog('date')}
            />
            <ExactRow
              label={t('create.when.timeLabel')}
              value={formatTime(startsAt, i18n.language)}
              onPress={() => openDialog('time')}
            />
          </View>
        )}
      </View>

      <SectionLabel className="mt-[20px] shrink-0">{t('create.when.durationLabel')}</SectionLabel>

      <View className="mt-[10px] shrink-0 flex-row flex-wrap gap-[8px]">
        {durations.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            size="time"
            tone={option.value === duration ? 'brand' : 'outline'}
            onPress={() => setDuration(option.value)}
          />
        ))}
      </View>

      <Spacer min={16} />
    </CreateStepLayout>
  );
}

interface ExactRowProps {
  label: string;
  value: string;
  onPress: () => void;
}

/** One half of the Android start time — a labelled value that opens a dialog. */
function ExactRow({ label, value, onPress }: ExactRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      className="flex-row items-center justify-between rounded-well bg-surface-chip px-[16px] py-[16px]"
      onPress={onPress}
    >
      <Text className="text-[14.5px] text-ink-dim">{label}</Text>
      <View className="flex-row items-center gap-[10px]">
        <Text weight={500} className="text-[19px]">
          {value}
        </Text>
        <Glyph.ChevronRight size={13} />
      </View>
    </Pressable>
  );
}
