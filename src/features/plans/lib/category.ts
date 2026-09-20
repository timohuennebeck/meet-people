import type { TFunction } from 'i18next';

import type { PlanCategory } from '@shared/data/schemas';

/** The i18n key for each category's badge label. */
const CATEGORY_KEY = {
  sport: 'plan.categorySport',
  games: 'plan.categoryGames',
  walk: 'plan.categoryWalk',
  coffee: 'plan.categoryCoffee',
} as const satisfies Record<PlanCategory, string>;

/** The badge label for a plan's category, e.g. "ESPORTE". */
export function categoryLabel(t: TFunction, category: PlanCategory): string {
  return t(CATEGORY_KEY[category]);
}
