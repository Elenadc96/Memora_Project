import i18next from 'i18next'
import I18NextVue from 'i18next-vue'
import LanguageDetector from 'i18next-browser-languagedetector'
import it from './locales/it.json'
import en from './locales/en.json'

i18next
  .use(LanguageDetector)
  .init({
    fallbackLng: 'it',
    supportedLngs: ['it', 'en'],
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'memora_lang',
    },
  })

export { i18next }

export function changeLanguage(lang) {
  return i18next.changeLanguage(lang)
}

export default function installI18n(app) {
  app.use(I18NextVue, { i18next })
}
