import type { LegalDocument } from '@shared/data/schemas';

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

/**
 * Splits `legal_documents.content_md` into the title and sections the screen
 * draws.
 *
 * Deliberately not a markdown renderer. Both documents are written by us in
 * one shape — `#` once, then `##` and a paragraph per section — and a parser
 * that understands exactly that shape is a dozen lines, where a library would
 * be a dependency and a licence to put arbitrary formatting in front of
 * somebody at the moment they agree to something. Anything it does not
 * recognise is kept as body text rather than dropped.
 */
export function parseLegalMarkdown(markdown: string): {
  title: string;
  sections: LegalDocument['sections'];
} {
  let title = '';
  const sections: { heading: string; body: string[] }[] = [];

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      sections.push({ heading: trimmed.slice(3).trim(), body: [] });
    } else if (trimmed.startsWith('# ') && !title) {
      title = trimmed.slice(2).trim();
    } else if (trimmed.length > 0) {
      // Before the first `##` there is nothing to attach a stray line to, so it
      // becomes the title rather than disappearing.
      const current = sections[sections.length - 1];
      if (current) current.body.push(trimmed);
      else if (!title) title = trimmed;
    }
  }

  return {
    title,
    sections: sections.map((section) => ({
      heading: section.heading,
      body: section.body.join('\n\n'),
    })),
  };
}
