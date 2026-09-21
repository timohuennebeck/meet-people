import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { parseLegalMarkdown, type LegalDoc } from '@shared/lib/legal';

import type { LegalDocument } from '../schemas';
import { client, unwrap, viewerId } from './shared';

/** The terms and the privacy policy, and the record that somebody accepted them. */

export const legal = {
  /**
   * The document in force for a kind, in the closest locale it exists in.
   * Readable signed out: the welcome screen links to both before anybody has
   * an account.
   */
  current: async (kind: LegalDoc, locale: string): Promise<LegalDocument | null> => {
    // The function picks the closest locale it has and falls back to the
    // source one, so the client never has to know which translations exist.
    const row = unwrap(
      await client().rpc('current_legal_document', { doc_kind: kind, want_locale: locale }),
    );
    if (!row) return null;

    const { title, sections } = parseLegalMarkdown(row.content_md);
    return {
      id: row.id,
      version: row.version,
      effectiveAt: row.effective_at,
      title,
      sections,
    };
  },

  /**
   * One row per document. `on conflict do nothing` is not available — the
   * table has no unique key on (profile, document) because accepting the
   * same version twice on two devices is a fact rather than a mistake, and
   * the audit trail keeps both.
   */
  accept: async (documentIds: readonly string[]): Promise<void> => {
    if (documentIds.length === 0) return;
    const db = client();
    const uid = await viewerId();

    unwrap(
      await db.from('legal_acceptances').insert(
        documentIds.map((documentId) => ({
          profile_id: uid,
          document_id: documentId,
          app_version: Constants.expoConfig?.version ?? null,
          platform: Platform.OS === 'ios' ? ('ios' as const) : ('android' as const),
        })),
      ),
    );
  },
};
