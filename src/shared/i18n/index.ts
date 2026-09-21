import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { ptBR, type Translation } from './locales/pt-br';

export const SUPPORTED_LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt-BR';

const resources = {
  'pt-BR': { translation: ptBR },
  en: { translation: en },
} as const;

/**
 * Maps a language code or BCP-47 tag onto a locale the app ships.
 *
 * The language picker offers six languages, as the design draws it, but only
 * pt-BR and en are translated — the rest land on the source locale rather than
 * on half-translated screens.
 */
export function resolveLocale(tag: string): Locale {
  if (SUPPORTED_LOCALES.includes(tag as Locale)) return tag as Locale;
  const language = tag.split('-')[0];
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en';
  return DEFAULT_LOCALE;
}

/**
 * Picks the closest supported locale for the device.
 *
 * The device lists its languages in preference order, so this takes the first
 * one the app can actually speak rather than the first one at all —
 * `resolveLocale` would answer `pt-BR` for a German tag, which is the right
 * fallback for a chosen language but the wrong reading of a device that also
 * lists English further down.
 */
function resolveDeviceLocale(): Locale {
  for (const { languageTag } of Localization.getLocales()) {
    const language = languageTag.split('-')[0];
    if (language === 'pt' || language === 'en') return resolveLocale(languageTag);
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

/**
 * Switches the interface language. Everything rendered through `useTranslation`
 * re-renders, so this is the single write that makes the picker take effect.
 */
export function setLocale(tag: string): void {
  const locale = resolveLocale(tag);
  // eslint-disable-next-line import/no-named-as-default-member -- instance method, not i18next's export.
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
}

export { i18n };
export type { Translation };
