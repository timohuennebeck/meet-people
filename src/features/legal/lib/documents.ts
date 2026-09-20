import type { LegalDoc } from '@shared/lib/legal';

/** A section of a legal document: a heading and one paragraph, both i18n keys. */
interface LegalSection {
  heading: string;
  body: string;
}

interface LegalDocumentContent {
  /** Key for the document's own title, shown as the page heading. */
  titleKey: string;
  sections: readonly LegalSection[];
}

/**
 * Which i18n keys make up each document, in reading order.
 *
 * The prose itself lives in the locale files because the app runs on fixtures.
 * In production it comes from `legal_documents.content_md`, picked by kind and
 * locale (see `docs/database.md`) — this map is the seam that fetch replaces,
 * so the screen above it never learns where the text came from.
 */
export const LEGAL_DOCUMENTS = {
  terms: {
    titleKey: 'legal.terms.title',
    sections: [
      { heading: 'legal.terms.s1Heading', body: 'legal.terms.s1Body' },
      { heading: 'legal.terms.s2Heading', body: 'legal.terms.s2Body' },
      { heading: 'legal.terms.s3Heading', body: 'legal.terms.s3Body' },
      { heading: 'legal.terms.s4Heading', body: 'legal.terms.s4Body' },
      { heading: 'legal.terms.s5Heading', body: 'legal.terms.s5Body' },
      { heading: 'legal.terms.s6Heading', body: 'legal.terms.s6Body' },
      { heading: 'legal.terms.s7Heading', body: 'legal.terms.s7Body' },
      { heading: 'legal.terms.s8Heading', body: 'legal.terms.s8Body' },
    ],
  },
  privacy: {
    titleKey: 'legal.privacy.title',
    sections: [
      { heading: 'legal.privacy.s1Heading', body: 'legal.privacy.s1Body' },
      { heading: 'legal.privacy.s2Heading', body: 'legal.privacy.s2Body' },
      { heading: 'legal.privacy.s3Heading', body: 'legal.privacy.s3Body' },
      { heading: 'legal.privacy.s4Heading', body: 'legal.privacy.s4Body' },
      { heading: 'legal.privacy.s5Heading', body: 'legal.privacy.s5Body' },
      { heading: 'legal.privacy.s6Heading', body: 'legal.privacy.s6Body' },
      { heading: 'legal.privacy.s7Heading', body: 'legal.privacy.s7Body' },
      { heading: 'legal.privacy.s8Heading', body: 'legal.privacy.s8Body' },
    ],
  },
  // `as const` keeps the keys as literals, so `t()` still type-checks them;
  // `satisfies` keeps both documents the same shape.
} as const satisfies Record<LegalDoc, LegalDocumentContent>;
