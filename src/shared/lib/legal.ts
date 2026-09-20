/**
 * The two legal documents the app ships, and the route that renders them.
 *
 * Both the onboarding screens (welcome, account) and settings link here, so the
 * kind and the href live in `shared` rather than inside the legal feature.
 */
export const LEGAL_DOCS = ['terms', 'privacy'] as const;

export type LegalDoc = (typeof LEGAL_DOCS)[number];

/** Narrows a `?doc=` search param onto a document, defaulting to the terms. */
export function resolveLegalDoc(value: string | undefined): LegalDoc {
  return value === 'privacy' ? 'privacy' : 'terms';
}

/** The `app/legal` route for a document. Terms are the default, so carry no param. */
export function legalHref(doc: LegalDoc): '/legal' | '/legal?doc=privacy' {
  return doc === 'privacy' ? '/legal?doc=privacy' : '/legal';
}
