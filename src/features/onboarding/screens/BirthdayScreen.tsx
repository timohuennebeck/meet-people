import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import {
  ageFromBirthdate,
  defaultBirthdate,
  earliestBirthdate,
  formatBirthdate,
  isoDate,
  latestBirthdate,
} from '@shared/lib/datetime';
import { STEPS } from '@shared/lib/steps';
import { colors } from '@shared/theme/tokens';
import { Button, Spacer, Text } from '@shared/ui';

import { saveProfile } from '../lib/profileWrites';

/** `height:236px;border-radius:24px` — the card the design draws the wheels in. */
const CARD_HEIGHT = 236;

/** Birthday, from which the displayed age is derived. */
export function BirthdayScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [birthdate, setBirthdate] = useState(defaultBirthdate);

  // Pinned for the life of the screen: bounds that moved mid-gesture would
  // yank the wheel out from under the finger at midnight.
  const bounds = useMemo(() => ({ earliest: earliestBirthdate(), latest: latestBirthdate() }), []);

  const commit = useCallback((event: DateTimePickerEvent, picked?: Date) => {
    // Android reports a cancelled dialog as `dismissed` with no date; iOS only
    // ever reports `set`, once per detent of the wheel.
    if (event.type !== 'set' || !picked) return;
    setBirthdate(picked);
  }, []);

  /**
   * Only iOS has an inline picker. Android puts the same wheel in a dialog, so
   * the card becomes the value plus the tap target that raises it.
   */
  const openDialog = useCallback(() => {
    DateTimePickerAndroid.open({
      value: birthdate,
      mode: 'date',
      display: 'spinner',
      minimumDate: bounds.earliest,
      maximumDate: bounds.latest,
      onChange: commit,
    });
  }, [birthdate, bounds, commit]);

  const next = () => {
    saveProfile({ birthdate: isoDate(birthdate) });
    router.push('/(onboarding)/pronouns');
  };

  return (
    <StepScaffold
      position={STEPS.birthday}
      title={t('onboarding.birthday.title')}
      subtitle={t('onboarding.birthday.subtitle')}
      footer={<Button label={t('common.continue')} onPress={next} />}
    >
      <View
        className="mt-[20px] shrink-0 overflow-hidden rounded-panel border border-hair bg-surface"
        style={{ height: CARD_HEIGHT }}
      >
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={birthdate}
            mode="date"
            display="spinner"
            locale={i18n.language}
            minimumDate={bounds.earliest}
            maximumDate={bounds.latest}
            textColor={colors.ink}
            onChange={commit}
            accessibilityLabel={t('onboarding.birthday.pick')}
            // NativeWind drops `className` on components it has not been taught
            // (see `@shared/ui/interop`), and the native picker is not one of
            // them, so it is sized with a style.
            style={{ flex: 1 }}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.birthday.pick')}
            accessibilityValue={{ text: formatBirthdate(birthdate, i18n.language) }}
            className="flex-1 items-center justify-center gap-[10px] px-[16px]"
            onPress={openDialog}
          >
            <Text weight={500} className="text-center text-[26px]">
              {formatBirthdate(birthdate, i18n.language)}
            </Text>
            <Text className="text-[15px] text-ink-dim">{t('onboarding.birthday.pick')}</Text>
          </Pressable>
        )}
      </View>

      <Text weight={500} className="mt-[14px] shrink-0 text-center text-[15.5px] text-ink-dim">
        {t('onboarding.birthday.age', { age: ageFromBirthdate(birthdate) })}
      </Text>

      <Spacer />
    </StepScaffold>
  );
}
