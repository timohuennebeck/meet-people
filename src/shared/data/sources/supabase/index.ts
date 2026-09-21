import type { DataSource } from '../types';
import { accountSource } from './account';
import { chatsSource } from './chats';
import { legalSource } from './legal';
import { placesSource } from './places';
import { plansSource } from './plans';
import { preferencesSource } from './preferences';
import { safetySource } from './safety';
import { usersSource } from './users';

/**
 * The Supabase source.
 *
 * One rule runs through it: the server decides, the client renders. Membership,
 * distance, the block exclusion and the pending queue all come back from
 * `nearby_plans()` already resolved, so no screen recomputes them and the list
 * and the sheet cannot disagree. What is left is the translation into the
 * domain types, which lives in `@shared/lib/supabase/mapping`.
 *
 * It is split by the groups `DataSource` already declares rather than by table:
 * a group is what a feature imports, while a single screen's read can touch
 * four tables. `shared.ts` holds the plumbing they have in common.
 */
export const supabaseSource: DataSource = {
  plans: plansSource,
  users: usersSource,
  chats: chatsSource,
  legal: legalSource,
  account: accountSource,
  safety: safetySource,
  places: placesSource,
  preferences: preferencesSource,
};

export { flushDeferredPreferences } from './preferences';
