/**
 * Language and country catalogues.
 *
 * Both onboarding and settings show the same flag lists, so the options live
 * here rather than in either feature. `name` is the display name in the app's
 * source locale and `endonym` is the language's own name — the design shows
 * both, one above the other.
 *
 * The language lists are `as const` so their codes stay literals rather than
 * widening to `string`; `LanguageCatalogueCode` below is what that buys, and
 * the guard beside it is what keeps the catalogue and the database's
 * `language_code` enum from drifting apart.
 */

import type { LanguageCode } from '@shared/lib/supabase/mapping';

/** The shape of a row in any of the catalogues: a code, a flag and two names. */
export interface FlagOption {
  /** BCP-47 language code, or ISO 3166-1 alpha-2 where the row is a country. */
  code: string;
  /** ISO 3166-1 alpha-2 code for the flag. */
  flag: string;
  name: string;
  endonym: string;
}

/** Languages the app interface is available in. */
export const APP_LANGUAGES = [
  { code: 'pt', flag: 'pt', name: 'Português', endonym: 'Português' },
  { code: 'en', flag: 'gb', name: 'English', endonym: 'Inglês' },
  { code: 'es', flag: 'es', name: 'Español', endonym: 'Espanhol' },
  { code: 'de', flag: 'de', name: 'Deutsch', endonym: 'Alemão' },
  { code: 'fr', flag: 'fr', name: 'Français', endonym: 'Francês' },
  { code: 'it', flag: 'it', name: 'Italiano', endonym: 'Italiano' },
] as const satisfies readonly FlagOption[];

/**
 * The full catalogue the "search another language" step looks through. The
 * shortlist above is the handful each screen offers up front; this is what
 * typing reaches.
 */
export const SEARCHABLE_LANGUAGES = [
  { code: 'de', flag: 'de', name: 'Alemão', endonym: 'Deutsch' },
  { code: 'ar', flag: 'sa', name: 'Árabe', endonym: 'العربية' },
  { code: 'zh', flag: 'cn', name: 'Chinês', endonym: '中文' },
  { code: 'ko', flag: 'kr', name: 'Coreano', endonym: '한국어' },
  { code: 'da', flag: 'dk', name: 'Dinamarquês', endonym: 'Dansk' },
  { code: 'es', flag: 'es', name: 'Espanhol', endonym: 'Español' },
  { code: 'fr', flag: 'fr', name: 'Francês', endonym: 'Français' },
  { code: 'el', flag: 'gr', name: 'Grego', endonym: 'Ελληνικά' },
  { code: 'he', flag: 'il', name: 'Hebraico', endonym: 'עברית' },
  { code: 'hi', flag: 'in', name: 'Híndi', endonym: 'हिन्दी' },
  { code: 'nl', flag: 'nl', name: 'Holandês', endonym: 'Nederlands' },
  { code: 'en', flag: 'gb', name: 'Inglês', endonym: 'English' },
  { code: 'it', flag: 'it', name: 'Italiano', endonym: 'Italiano' },
  { code: 'ja', flag: 'jp', name: 'Japonês', endonym: '日本語' },
  { code: 'pl', flag: 'pl', name: 'Polonês', endonym: 'Polski' },
  { code: 'pt', flag: 'pt', name: 'Português', endonym: 'Português' },
  { code: 'pt-BR', flag: 'br', name: 'Português (Brasil)', endonym: 'Português do Brasil' },
  { code: 'ru', flag: 'ru', name: 'Russo', endonym: 'Русский' },
  { code: 'sv', flag: 'se', name: 'Sueco', endonym: 'Svenska' },
  { code: 'tr', flag: 'tr', name: 'Turco', endonym: 'Türkçe' },
  { code: 'uk', flag: 'ua', name: 'Ucraniano', endonym: 'Українська' },
] as const satisfies readonly FlagOption[];

/** Every code the two language catalogues above hold, as literals. */
type CatalogueCode =
  (typeof APP_LANGUAGES)[number]['code'] | (typeof SEARCHABLE_LANGUAGES)[number]['code'];

/**
 * Passes a code through unchanged, but only if the `language_code` Postgres
 * enum admits it. The constraint is the whole point: it is where the catalogue
 * is checked against the database, at compile time.
 */
type EnumMember<T extends LanguageCode> = T;

/**
 * The catalogue's codes, proven to be values the `languages` column will take.
 *
 * **Adding a language above means adding its value to the `language_code` enum
 * in a migration too.** Skip that and this alias stops satisfying
 * `EnumMember`'s constraint, so `npm run typecheck` fails here — instead of
 * Postgres raising `22P02` the first time somebody saves that language, which
 * is exactly how `pt-BR` got in once.
 */
export type LanguageCatalogueCode = EnumMember<CatalogueCode>;

/** A row in one of the language catalogues. */
export interface LanguageOption extends FlagOption {
  code: LanguageCatalogueCode;
}

/**
 * Catalogue entries whose name or endonym contains the query, prefix matches
 * first so typing "por" puts "Português" above "Português (Brasil)" rather than
 * above whatever happens to sort first.
 */
export function searchLanguages(query: string): LanguageOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const matches = SEARCHABLE_LANGUAGES.filter((language) =>
    `${language.name} ${language.endonym}`.toLowerCase().includes(needle),
  );

  return matches.sort((a, b) => {
    const aPrefix = a.name.toLowerCase().startsWith(needle);
    const bPrefix = b.name.toLowerCase().startsWith(needle);
    if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Countries a user can list as home — `code` is a country, not a language. */
export const COUNTRIES: readonly FlagOption[] = [
  { code: 'es', flag: 'es', name: 'Espanha', endonym: 'España' },
  { code: 'de', flag: 'de', name: 'Alemanha', endonym: 'Deutschland' },
  { code: 'tr', flag: 'tr', name: 'Turquia', endonym: 'Türkiye' },
  { code: 'br', flag: 'br', name: 'Brasil', endonym: 'Brasil' },
  { code: 'pl', flag: 'pl', name: 'Polônia', endonym: 'Polska' },
];

/** Looks up a language's display name, falling back to its code. */
export function languageName(code: string): string {
  return SEARCHABLE_LANGUAGES.find((language) => language.code === code)?.name ?? code;
}

/**
 * Returns the catalogue entries for the given codes, in the order asked for.
 * The onboarding step and the settings page each show a different shortlist.
 */
export function pickLanguages(codes: readonly string[]): LanguageOption[] {
  // The predicate is inferred rather than written out: spelling it as
  // `language is LanguageOption` would widen each row back to the interface,
  // and the literal element types are the whole point of the `as const` above.
  return codes
    .map((code) => SEARCHABLE_LANGUAGES.find((language) => language.code === code))
    .filter((language) => language !== undefined);
}
