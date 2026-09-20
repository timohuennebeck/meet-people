import { useRouter } from 'expo-router';
import { Star } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import {
  Button,
  CircleButton,
  FieldLabel,
  Glyph,
  Mascot,
  NoteField,
  Screen,
  Spacer,
  Text,
  TextButton,
} from '@shared/ui';

/** The design rates out of five. */
const STARS = [1, 2, 3, 4, 5] as const;

/** Longest review the card accepts, as the counter under it states. */
const NOTE_MAX = 240;

/**
 * The row of tappable stars, filled up to the current score.
 *
 * Phosphor's star is the one drawn here rather than `Glyph.StarGlyph`: the
 * glyph in `icons.tsx` is the design's `★` traced as a path, with sharp points
 * and a stroke that has to stay on the empty half to keep its outline — at this
 * size it reads spiky and the stroked halves sit lighter than the solid ones.
 * Phosphor's has the rounded points, and both halves use `weight="fill"` so the
 * silhouette never changes: only the colour moves, brand to pale grey.
 */
function StarRating({ score, onChange }: { score: number; onChange: (next: number) => void }) {
  const { t } = useTranslation();

  return (
    <View className="shrink-0 flex-row justify-center gap-[6px]">
      {STARS.map((star) => (
        <Pressable
          key={star}
          accessibilityRole="radio"
          accessibilityState={{ selected: score >= star }}
          accessibilityLabel={t('settings.reviewPage.starLabel', { score: star })}
          onPress={() => onChange(star)}
          className="p-[4px] active:opacity-60"
        >
          <Star size={28} weight="fill" color={score >= star ? colors.brand : colors.hairStone} />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Leaving a review. One screen, not a flow: a score, an optional written note,
 * and both actions leave. The copy under the card says the stars and the text
 * go straight to the App Store, so there is nothing to thank anyone for here —
 * the store's own sheet is what appears next.
 */
export function LeaveReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [note, setNote] = useState('');
  const [focused, setFocused] = useState(false);

  // A real build hands off to `StoreReview.requestReview()` (or opens the App
  // Store listing with `?action=write-review` where the in-app prompt has been
  // spent), carrying the score and the note. Until then every exit is the same:
  // leave the page.
  const dismiss = () => router.back();

  return (
    <Screen padding="form">
      {/* No nav-bar title: an × in the corner, drawn like the paywall's. */}
      <View className="h-[40px] shrink-0 flex-row items-center">
        <CircleButton size={40} accessibilityLabel={t('common.close')} onPress={dismiss}>
          <Glyph.CloseHeader size={13} />
        </CircleButton>
      </View>

      <View className="mt-[6px] shrink-0 items-center">
        <Mascot size={132} />
      </View>

      <Text
        weight={600}
        className="mt-[14px] shrink-0 text-center text-[23px] leading-[27.6px] tracking-[-0.46px]"
      >
        {t('settings.reviewPage.heading')}
      </Text>

      <Text className="mt-[8px] shrink-0 text-center text-[15.5px] leading-[22.5px] text-ink-dim">
        {t('settings.reviewPage.subtitle')}
      </Text>

      <View className="mt-[18px] shrink-0">
        <StarRating score={score} onChange={setScore} />
      </View>

      {/* The card draws the ring the note would otherwise draw for itself, so
          the label and the counter sit inside one box instead of beside a box
          within a box. `NoteField` still compensates its own padding by the
          border width it believes it has — the same 1 → 2 swap the card makes
          on focus — so the two cancel: the card's padding stays uncompensated
          and the text keeps a constant 16px inset in both states. */}
      <View
        className={cn(
          'mt-[18px] shrink-0 rounded-panel bg-surface p-[14px]',
          focused ? 'border-2 border-brand' : 'border border-hair',
        )}
      >
        <FieldLabel>{t('settings.reviewPage.noteLabel')}</FieldLabel>

        <NoteField
          className="mt-[8px] border-0 bg-transparent"
          value={note}
          onChangeText={setNote}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t('settings.reviewPage.notePlaceholder')}
          padding={{ vertical: 2, horizontal: 2 }}
          minHeight={104}
          fontSize={16}
          lineHeight={23.2}
          maxLength={NOTE_MAX}
        />

        <Text className="mt-[6px] text-right text-[13px] text-ink-ghost">
          {t('settings.reviewPage.counter', { used: String(note.length), max: String(NOTE_MAX) })}
        </Text>
      </View>

      <Text className="mt-[12px] shrink-0 text-center text-[13.5px] leading-[19.6px] text-ink-ghost">
        {t('settings.reviewPage.caption')}
      </Text>

      <Spacer min={16} />

      <View className="shrink-0 gap-[12px]">
        <Button
          label={t('settings.reviewPage.send')}
          variant="primaryCompact"
          disabled={score === 0}
          onPress={dismiss}
        />
        <TextButton label={t('settings.reviewPage.later')} tone="bodyStrong" onPress={dismiss} />
      </View>
    </Screen>
  );
}
