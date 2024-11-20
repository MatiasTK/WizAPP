import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@assets/locales/en/translation.json';
import es from '@assets/locales/es/translation.json';

const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
};

// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    debug: false,
    resources,
    interpolation: { escapeValue: false },
  });

export default i18n;
