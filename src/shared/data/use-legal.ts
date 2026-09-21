import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { LegalDoc } from '@shared/lib/legal';

import { legalKeys } from './query-keys';
import { dataSource } from './source';

/**
 * The document in force, in the reader's language.
 *
 * Resolves to `null` with no project configured, which the screen reads as
 * "render the prose in the locale files" — the offline source has no document
 * table.
 */
export function useLegalDocument(kind: LegalDoc) {
  const { i18n } = useTranslation();

  return useQuery({
    ...legalKeys.document(kind, i18n.language),
    queryFn: () => dataSource.legal.current(kind, i18n.language),
    // Two rows that change a few times a year; re-reading them per visit is
    // a round trip spent on nothing.
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Records that the person accepted the documents they were shown.
 *
 * Fired once, when the account is created: that is the moment the copy under
 * the button says they are agreeing, so it is the moment the row has to exist.
 */
export function useAcceptLegal() {
  return useMutation({
    mutationFn: (documentIds: readonly string[]) => dataSource.legal.accept(documentIds),
  });
}
