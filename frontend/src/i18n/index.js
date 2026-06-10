// Configurazione di i18next per la gestione delle traduzioni.
// I testi dell'app non sono mai scritti direttamente nei template:
// si usa $t('chiave') che restituisce la stringa nella lingua attiva.
// Aggiungere una nuova lingua = aggiungere un file in locales/ e
// registrarlo in `resources` qui sotto.

import i18next from 'i18next'
import I18NextVue from 'i18next-vue'
import LanguageDetector from 'i18next-browser-languagedetector'
import it from './locales/it.json'
import en from './locales/en.json'

i18next
  .use(LanguageDetector)   // rileva automaticamente la lingua dal browser
  .init({
    fallbackLng: 'it',           // lingua usata se la chiave manca nella lingua attiva
    supportedLngs: ['it', 'en'],
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    interpolation: {
      escapeValue: false,   // Vue fa già il sanitize dell'HTML, non serve a i18next
    },
    detection: {
      // Prima cerca in localStorage (preferenza salvata dall'utente),
      // poi usa la lingua del browser come fallback.
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'memora_lang',   // chiave usata in localStorage
    },
  })

export { i18next }

// Usata dallo store UI per cambiare lingua a runtime senza ricaricare la pagina.
export function changeLanguage(lang) {
  return i18next.changeLanguage(lang)
}

// Funzione di installazione chiamata in main.js: registra il plugin su Vue
// così $t() è disponibile in ogni componente senza importazioni aggiuntive.
export default function installI18n(app) {
  app.use(I18NextVue, { i18next })
}
