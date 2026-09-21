import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { pickLanguages } from '@shared/lib/languages';
import { Button, Spacer } from '@shared/ui/button';
import { SelectableCard, SelectionDot } from '@shared/ui/card';
import { Flag } from '@shared/ui/flag';
import { Text } from '@shared/ui/text';

import { useCreatePlan } from '../../lib/create-plan-provider';
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

  /**
   * The design also puts "falado por 8 de 10 por perto" under each language.
   * Nothing answers it: `nearby_plans()` finds plans within the radius and
   * nothing finds *people* within it, so the line was reading a transcribed
   * copy of the design's cast and calling it the neighbourhood. It comes back
   * when a `nearby_language_reach` function exists to stand behind it.
   */
  const detailFor = (code: string): string | undefined =>
    code === ownLanguage ? t('create.language.yours') : undefined;

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
