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

/** Looks up a spoken language's display name, falling back to its code. */
export function languageName(code: string): string {
  return SPOKEN_LANGUAGES.find((language) => language.code === code)?.name ?? code;
}

/**
 * Returns the catalogue entries for the given codes, in the order asked for.
 * The onboarding step and the settings page each show a different shortlist.
 */
export function pickLanguages(codes: readonly string[]): LanguageOption[] {
  return codes
    .map((code) => SPOKEN_LANGUAGES.find((language) => language.code === code))
    .filter((language): language is LanguageOption => language !== undefined);
}
