import type { Translation } from './locales/pt-BR';

/**
 * Makes `t('settings.radius')` type-checked and auto-completed, and turns a
 * typo into a compile error rather than a key echoed on screen.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translation };
  }
}
