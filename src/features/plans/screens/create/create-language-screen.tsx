import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { pickLanguages } from '@shared/lib/languages';
import { Button, Flag, SelectableCard, SelectionDot, Spacer, Text } from '@shared/ui';

import { useCreatePlan } from '../../data/create-plan-provider';
import { nearbyLanguageReach } from '../../lib/languages';
import { CreateStepLayout } from '../../ui/create-step-layout';

/** The shortlist this step offers, Lisbon's own language first. */
const OPTIONS = ['pt', 'en', 'es', 'de', 'fr'];

interface LanguageRowProps {
  name: string;
  /** ISO 3166-1 alpha-2 code for the circular flag. */
  flag: string;
  /** "Seu idioma", or how many people nearby speak it. Absent when neither. */
  detail?: string;
  selected: boolean;
  onPress: () => void;
}

/** `radius:18px · padding:14px 16px · 40px flag` — one language on this step. */
function LanguageRow({ name, flag, detail, selected, onPress }: LanguageRowProps) {
  return (
    // Several languages can be chosen at once, so these are checkboxes. The
    // card defaults to `radio`, which would have a screen reader promise that
    // picking English un-picks Portuguese.
    <SelectableCard
      selected={selected}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      padding={{ vertical: 14, horizontal: 16 }}
      className="flex-row items-center gap-[12px] rounded-field"
    >
      <Flag code={flag} size={40} />

      <View className="min-w-0 flex-1 gap-[2px]">
        <Text weight={600} numberOfLines={1} className="text-[16px]">
          {name}
        </Text>
        {detail ? (
          <Text numberOfLines={1} className="text-[14px] text-ink-dim">
            {detail}
          </Text>
        ) : null}
      </View>

      {/* The dot is drawn in both states here, but the slot is still fixed:
          it is what stops the name and the detail line re-truncating as rows
          are picked and dropped. See `PlaceRow`. */}
      <View className="w-[24px] shrink-0">
        <SelectionDot selected={selected} />
      </View>
    </SelectableCard>
  );
}

/**
 * Create step 5 — which languages the plan will be held in.
 *
 * Multi-select: a plan that runs in Portuguese *and* English is the common case
 * in a city this full of newcomers, and it is a different promise from either
 * one alone.
 */
export function CreateLanguageScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { draft, set } = useCreatePlan();
  const selected = draft.languages;

  // The viewer's own language is the one the app is running in — `pt-BR` and
  // `pt` are the same answer to "do you already speak this?".
  const ownLanguage = i18n.language.split('-')[0];

  const toggle = (code: string) =>
    set({
      languages: selected.includes(code)
        ? selected.filter((entry) => entry !== code)
        : [...selected, code],
    });

  const detailFor = (code: string): string | undefined => {
    if (code === ownLanguage) return t('create.language.yours');
    const reach = nearbyLanguageReach(code);
    // A language nobody around here speaks has nothing to report; "falado por
    // 0 de 7" reads as a warning the host has not earned. Neither has a count
    // that no query stands behind.
    if (!reach || reach.speakers === 0) return undefined;
    return t('create.language.spokenNearby', {
      speakers: String(reach.speakers),
      total: String(reach.total),
    });
  };

  return (
    <CreateStepLayout
      step={5}
      title={t('create.language.title')}
      subtitle={t('create.language.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          // "Escolha um ou mais" — a plan is held in at least one language.
          disabled={selected.length === 0}
          onPress={() => router.push('/create/seats')}
        />
      }
    >
      <View className="mt-[22px] shrink-0 gap-[10px]">
        {pickLanguages(OPTIONS).map((language) => (
          <LanguageRow
            key={language.code}
            name={language.name}
            flag={language.flag}
            detail={detailFor(language.code)}
            selected={selected.includes(language.code)}
            onPress={() => toggle(language.code)}
          />
        ))}
      </View>

      <Spacer />
    </CreateStepLayout>
  );
}
