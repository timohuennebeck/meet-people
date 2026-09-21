import { Share } from 'react-native';

import { i18n } from '@shared/i18n';

/**
 * The public link to a plan.
 *
 * Short ids are what somebody can read out loud, so the uuid's first segment
 * stands in until there is a slug.
 */
export function planLink(planId: string): string {
  return `https://treff.app/p/${planId.split('-')[0]}`;
}

/**
 * Hands the plan to the phone's own share sheet.
 *
 * "Convidar amigos" is an invitation to a plan, and the phone already knows
 * every way this person talks to their friends — building a picker inside the
 * app would offer fewer of them. A dismissed sheet is not a failure, so
 * nothing is reported either way.
 */
export async function sharePlan(planId: string, title: string): Promise<void> {
  const url = planLink(planId);
  try {
    await Share.share({
      message: i18n.t('plan.shareMessage', { title, url }),
      url,
      title,
    });
  } catch (error: unknown) {
    console.warn('[plans] Could not open the share sheet:', error);
  }
}
