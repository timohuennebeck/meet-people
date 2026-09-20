import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { ptBR, type Translation } from './locales/pt-BR';

export const SUPPORTED_LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

const resources = {
  'pt-BR': { translation: ptBR },
  en: { translation: en },
} as const;

/**
 * Picks the closest supported locale for the device. Any Portuguese variant
 * maps to pt-BR; everything else falls back to English.
 */
function resolveDeviceLocale(): Locale {
  const tags = Localization.getLocales();
  for (const { languageTag, languageCode } of tags) {
    if (SUPPORTED_LOCALES.includes(languageTag as Locale)) return languageTag as Locale;
    if (languageCode === 'pt') return 'pt-BR';
    if (languageCode === 'en') return 'en';
  }
  return DEFAULT_LOCALE;
}

// eslint-disable-next-line import/no-named-as-default-member -- `i18n.use` is the instance method, not i18next's `use` export.
void i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  // React already escapes rendered values, so i18next must not escape again.
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
export type { Translation };
