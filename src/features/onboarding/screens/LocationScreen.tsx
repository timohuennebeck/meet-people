import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { EyeSlash, MapPinSimple } from 'phosphor-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { colors } from '@shared/theme/tokens';
import { Button, Mascot, Text, TextButton } from '@shared/ui';

import { saveLocation } from '../lib/profileWrites';

/**
 * `Balanced` is accurate to about a hundred metres. The tightest radius the
 * next step offers is 1 mi, so a finer fix would only cost battery and seconds
 * without moving a single plan in or out of range.
 */
const FIX = { accuracy: Location.Accuracy.Balanced } satisfies Location.LocationOptions;

/**
 * Whether the ask has already been answered with a no in this run of the app.
 *
 * Module-level rather than component state because the step is pushed: walking
 * back and forward again re-mounts the screen, and someone who has declined
 * once should not be asked twice. iOS would not show the system dialog a second
 * time anyway — the request resolves straight to denied — so re-asking would
 * only grey the button out for nothing.
 */
let refused = false;

/** `30px brand-tinted bubble · 15.5px body` — one reassurance line. */
function Benefit({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View className="flex-row items-start gap-[13px]">
      <View className="h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-tintAlt">
        {icon}
      </View>
      <Text className="flex-1 text-[15.5px] leading-[22.5px] text-ink-body">{children}</Text>
    </View>
  );
}

/** The location permission ask. */
export function LocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(refused);
  /**
   * Set when someone gives up on a slow fix and skips instead. The request
   * behind them still resolves, into a screen they have already left, and an
   * answer they walked away from is not one to write.
   */
  const abandoned = useRef(false);

  const next = () => router.push('/(onboarding)/radius');

  const skip = () => {
    abandoned.current = true;
    next();
  };

  /**
   * A no — refused outright, or a fix that never arrived. Neither is an error
   * and neither blocks the flow: the screen keeps them here just long enough to
   * say what the app loses without a home point, and the button turns into a
   * plain "continue".
   */
  const giveUp = () => {
    refused = true;
    setDeclined(true);
  };

  const allow = async () => {
    // The button is already disabled while a request is out; this is the guard
    // for the tap that lands in the same frame as the first.
    if (busy) return;
    setBusy(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        giveUp();
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync(FIX);
      const { latitude, longitude } = coords;

      // Nobody types their neighbourhood — it is read back off the fix.
      // `district` is the field that holds "Copacabana", but a geocoder that
      // has nothing that fine for the spot leaves it null, so the coarser two
      // stand in rather than the profile going without a neighbourhood at all.
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const neighbourhood = address?.district ?? address?.subregion ?? address?.city ?? null;

      if (abandoned.current) return;
      saveLocation({ latitude, longitude }, neighbourhood);
      next();
    } catch (error) {
      // No fix, no geocoder, or no native module behind either. A sign-up must
      // never dead-end on a GPS fix, so a grant that goes nowhere lands exactly
      // where a refusal does.
      console.warn('Could not read the location', error);
      giveUp();
    } finally {
      // The pushed screen stays mounted underneath the next step, so the button
      // has to come back to life for anyone who walks back to it.
      setBusy(false);
    }
  };

  return (
    <StepScaffold
      position={STEPS.location}
      padding="stepWide"
      title={t('onboarding.location.title')}
      subtitle={t('onboarding.location.subtitle')}
      footer={
        <>
          {declined ? (
            <Text className="mb-[14px] text-center text-[13.5px] leading-[19px] text-ink-dim">
              {t('onboarding.location.unavailable')}
            </Text>
          ) : null}
          <Button
            label={
              busy
                ? t('onboarding.location.locating')
                : declined
                  ? t('common.continue')
                  : t('onboarding.location.allow')
            }
            disabled={busy}
            onPress={declined ? next : () => void allow()}
          />
          <TextButton
            label={t('onboarding.location.chooseNeighbourhood')}
            className="mt-[15px]"
            onPress={skip}
          />
        </>
      }
    >
      <View className="min-h-0 flex-1 items-center justify-center">
        <Mascot size={160} />
      </View>

      <View className="mb-[22px] shrink-0 gap-[14px]">
        <Benefit icon={<MapPinSimple size={16} color={colors.brand} />}>
          {t('onboarding.location.benefitDistance')}
        </Benefit>
        <Benefit icon={<EyeSlash size={16} color={colors.brand} />}>
          {t('onboarding.location.benefitPrivacy')}
        </Benefit>
      </View>
    </StepScaffold>
  );
}
