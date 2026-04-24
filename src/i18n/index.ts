import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from './zh'
import en from './en'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        translation: zh,
      },
      en: {
        translation: en,
      },
    },
    fallbackLng: 'zh',
    supportedLngs: ['zh', 'en'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      lookupLocalStorage: 'ae_lang',
      lookupCookie: 'ae_lang',
      caches: ['localStorage', 'cookie'],
    },
  })

export default i18n
