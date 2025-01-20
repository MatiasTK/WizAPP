import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@resources/locales/en/translation.json'
import es from '@resources/locales/es/translation.json'

const resources = {
  en: {
    translation: en
  },
  es: {
    translation: es
  }
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    debug: false,
    resources,
    interpolation: { escapeValue: false }
  })
}

export default i18n
