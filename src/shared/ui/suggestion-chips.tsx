import { View } from 'react-native';

import { cn } from '@shared/lib/cn';
import { Chip } from '@shared/ui/chip';

export interface SuggestionChipsProps {
  /** What is already on the list; a suggestion matching one is not offered. */
  chosen: readonly string[];
  suggestions: readonly string[];
  /** How many `chosen` may hold before there is nothing left to offer. */
  max: number;
  onAdd: (suggestion: string) => void;
  className?: string;
}

/**
 * The "+ Café" chips under a tag field.
 *
 * Two rules, and both are why this is one component rather than a `map` at
 * each call site: a suggestion already on the list is not offered again —
 * adding it twice would put two chips under the same key, and removing either
 * would take both — and nothing is offered once the cap is reached, because a
 * chip that fails silently is worse than no chip.
 */
export function SuggestionChips({
  chosen,
  suggestions,
  max,
  onAdd,
  className,
}: SuggestionChipsProps) {
  const offered =
    chosen.length >= max
      ? []
      : suggestions.filter(
          (suggestion) => !chosen.some((entry) => entry.toLowerCase() === suggestion.toLowerCase()),
        );

  return (
    <View className={cn('shrink-0 flex-row flex-wrap gap-[8px]', className)}>
      {offered.map((suggestion) => (
        <Chip
          key={suggestion}
          label={`+ ${suggestion}`}
          size="suggestion"
          tone="outline"
          onPress={() => onAdd(suggestion)}
        />
      ))}
    </View>
  );
}
