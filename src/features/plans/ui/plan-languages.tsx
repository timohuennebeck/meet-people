import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { pickLanguages } from '@shared/lib/languages';
import { Flag } from '@shared/ui/flag';
import { Text } from '@shared/ui/text';

/**
 * `radius:999px · padding:5px 12px 5px 5px · 24px flag · 13px/600` — one
 * language a plan is held in.
 *
 * The ring is a hairline the pill draws itself rather than a state that comes
 * and goes, so nothing has to be compensated for it: the 5px gutter around the
 * flag is what is left of the padding once the border has taken its pixel.
 */
function LanguageChip({ flag, name }: { flag: string; name: string }) {
  return (
    <View className="flex-row items-center gap-[7px] rounded-pill border border-hair bg-surface-chip py-[5px] pl-[5px] pr-[12px]">
      <Flag code={flag} size={24} />
      <Text weight={600} className="text-[13px] text-ink-body">
        {name}
      </Text>
    </View>
  );
}

export interface PlanLanguagesProps {
  /** The plan's `languages`, as codes from `@shared/lib/languages`. */
  codes: readonly string[];
  className?: string;
}

/**
 * The row of languages a plan will be held in — the same chips on the card and
 * on the detail sheet, so the answer to "is this in Portuguese or English?"
 * survives the tap.
 *
 * They wrap rather than scroll: a plan in three languages is exactly the case
 * where the third one must not be the one that falls off the edge.
 */
export function PlanLanguages({ codes, className }: PlanLanguagesProps) {
  const languages = pickLanguages(codes);
  if (languages.length === 0) return null;

  return (
    <View className={cn('flex-row flex-wrap items-center gap-[8px]', className)}>
      {languages.map((language) => (
        <LanguageChip key={language.code} flag={language.flag} name={language.name} />
      ))}
    </View>
  );
}
