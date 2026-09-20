import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { colors } from '@shared/theme/tokens';
import {
  Button,
  FieldLabel,
  Glyph,
  Mascot,
  NavHeader,
  NoteField,
  Screen,
  Spacer,
  Text,
  TextButton,
  TextField,
} from '@shared/ui';

/** The design rates out of five: `★★★★★`. */
const STARS = [1, 2, 3, 4, 5] as const;

/** The one-line summary the sentiment key maps onto, lowest score first. */
const SENTIMENTS = ['one', 'two', 'three', 'four', 'five'] as const;

/** The row of tappable stars, filled up to the current score. */
function StarRating({ score, onChange }: { score: number; onChange: (next: number) => void }) {
  const { t } = useTranslation();

  return (
    <View className="flex-row justify-center gap-[10px]">
      {STARS.map((star) => (
        <Pressable
          key={star}
          accessibilityRole="radio"
          accessibilityState={{ selected: score >= star }}
          accessibilityLabel={t('settings.reviewPage.starLabel', { score: star })}
          onPress={() => onChange(star)}
          className="p-[4px] active:opacity-60"
        >
          <Glyph.StarGlyph
            size={40}
            filled={score >= star}
            color={score >= star ? colors.brand : colors.hairStone}
          />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Leaving a review. A score is the only thing asked for — the headline and the
 * note are both optional — and sending it swaps the page for a thank-you rather
 * than dropping the user back in settings with nothing to show for it.
 */
export function LeaveReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [headline, setHeadline] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <Screen padding="hero">
        <View className="min-h-0 flex-1 items-center justify-center">
          <Mascot size={200} />
        </View>

        <View className="shrink-0 gap-[10px]">
          <Text weight={600} className="text-[28px] leading-[32.2px] tracking-[-0.7px]">
            {t('settings.reviewPage.thanksTitle')}
          </Text>
          <Text className="text-[15.5px] leading-[22.5px] text-ink-dim">
            {t('settings.reviewPage.thanksSubtitle')}
          </Text>
          <Button label={t('common.done')} className="mt-[14px]" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padding="form">
      <NavHeader title={t('settings.reviewPage.title')} onBack={() => router.back()} />

      <View className="mt-[20px] shrink-0 gap-[8px]">
        <Text weight={600} className="text-[24px] leading-[27.6px] tracking-[-0.5px]">
          {t('settings.reviewPage.heading')}
        </Text>
        <Text className="text-[15.5px] leading-[22.5px] text-ink-dim">
          {t('settings.reviewPage.subtitle')}
        </Text>
      </View>

      <View className="mt-[22px] shrink-0 gap-[12px] rounded-panel border border-hair bg-surface px-[16px] py-[20px]">
        <StarRating score={score} onChange={setScore} />
        <Text weight={500} className="text-center text-[15px] text-ink-dim">
          {score === 0
            ? t('settings.reviewPage.scorePrompt')
            : t(`settings.reviewPage.sentiment.${SENTIMENTS[score - 1]!}`)}
        </Text>
      </View>

      <View className="mt-[20px] shrink-0 gap-[8px]">
        <FieldLabel>{t('settings.reviewPage.headlineLabel')}</FieldLabel>
        <TextField
          value={headline}
          onChangeText={setHeadline}
          placeholder={t('settings.reviewPage.headlinePlaceholder')}
          maxLength={60}
          returnKeyType="done"
        />
      </View>

      <View className="mt-[16px] shrink-0 gap-[8px]">
        <FieldLabel>{t('settings.reviewPage.noteLabel')}</FieldLabel>
        <NoteField
          value={note}
          onChangeText={setNote}
          placeholder={t('settings.reviewPage.notePlaceholder')}
          minHeight={104}
          fontSize={16}
          lineHeight={23.2}
          padding={{ vertical: 14, horizontal: 16 }}
        />
      </View>

      <Spacer min={16} />

      <View className="shrink-0 gap-[12px]">
        <Button
          label={t('settings.reviewPage.send')}
          variant="primaryCompact"
          disabled={score === 0}
          onPress={() => setSent(true)}
        />
        <TextButton
          label={t('settings.reviewPage.later')}
          tone="bodyStrong"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
