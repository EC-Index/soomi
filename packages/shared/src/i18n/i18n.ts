import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import deDE from './locales/de-DE.json';
import enUS from './locales/en-US.json';

export const SUPPORTED_LOCALES = ['de-DE', 'en-US'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'de-DE';

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  'de-DE': 'Deutsch',
  'en-US': 'English',
};

const resources = {
  'de-DE': { translation: deDE },
  'en-US': { translation: enUS },
};

export const initI18n = (locale?: string) => {
  const matchedLocale =
    SUPPORTED_LOCALES.find((l) => locale?.startsWith(l.split('-')[0])) ?? DEFAULT_LOCALE;

  i18n.use(initReactI18next).init({
    resources,
    lng: matchedLocale,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

export { i18n };
export default i18n;
