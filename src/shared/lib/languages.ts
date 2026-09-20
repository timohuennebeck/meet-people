/**
 * Language and country catalogues.
 *
 * Both onboarding and settings show the same flag lists, so the options live
 * here rather than in either feature. `name` is the display name in the app's
 * source locale and `endonym` is the language's own name — the design shows
 * both, one above the other.
 */

export interface LanguageOption {
  /** BCP-47 language code. */
  code: string;
  /** ISO 3166-1 alpha-2 code for the flag. */
  flag: string;
  name: string;
  endonym: string;
}

/** Languages the app interface is available in. */
export const APP_LANGUAGES: readonly LanguageOption[] = [
  { code: 'pt', flag: 'pt', name: 'Português', endonym: 'Português' },
  { code: 'en', flag: 'gb', name: 'English', endonym: 'Inglês' },
  { code: 'es', flag: 'es', name: 'Español', endonym: 'Espanhol' },
  { code: 'de', flag: 'de', name: 'Deutsch', endonym: 'Alemão' },
  { code: 'fr', flag: 'fr', name: 'Français', endonym: 'Francês' },
  { code: 'it', flag: 'it', name: 'Italiano', endonym: 'Italiano' },
];

/** Languages a user can list as one they speak. */
export const SPOKEN_LANGUAGES: readonly LanguageOption[] = [
  { code: 'de', flag: 'de', name: 'Alemão', endonym: 'Deutsch' },
  { code: 'en', flag: 'gb', name: 'Inglês', endonym: 'English' },
  { code: 'pt', flag: 'pt', name: 'Português', endonym: 'Português' },
  { code: 'tr', flag: 'tr', name: 'Turco', endonym: 'Türkçe' },
  { code: 'es', flag: 'es', name: 'Espanhol', endonym: 'Español' },
  { code: 'pl', flag: 'pl', name: 'Polonês', endonym: 'Polski' },
];

/**
 * The full catalogue the "search another language" step looks through. The
 * shortlists above are the handful each screen offers up front; this is what
 * typing reaches.
 */
export const SEARCHABLE_LANGUAGES: readonly LanguageOption[] = [
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
];

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

/** Countries a user can list as home. */
export const COUNTRIES: readonly LanguageOption[] = [
  { code: 'es', flag: 'es', name: 'Espanha', endonym: 'España' },
  { code: 'de', flag: 'de', name: 'Alemanha', endonym: 'Deutschland' },
  { code: 'tr', flag: 'tr', name: 'Turquia', endonym: 'Türkiye' },
  { code: 'br', flag: 'br', name: 'Brasil', endonym: 'Brasil' },
  { code: 'pl', flag: 'pl', name: 'Polônia', endonym: 'Polska' },
];

/** How the design labels each proficiency level in a language row's subtitle. */
export const LEVEL_LABEL = {
  native: 'Nativo',
  fluent: 'Bem',
  learning: 'Aprendendo',
} as const;

/** Looks up a language's display name, falling back to its code. */
export function languageName(code: string): string {
  return SEARCHABLE_LANGUAGES.find((language) => language.code === code)?.name ?? code;
}

/**
 * Returns the catalogue entries for the given codes, in the order asked for.
 * The onboarding step and the settings page each show a different shortlist.
 */
export function pickLanguages(codes: readonly string[]): LanguageOption[] {
  return codes
    .map((code) => SEARCHABLE_LANGUAGES.find((language) => language.code === code))
    .filter((language): language is LanguageOption => language !== undefined);
}
