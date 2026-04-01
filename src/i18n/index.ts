import { createI18n } from 'vue-i18n'
import en from './en'
import localeId from './id'
import tet from './tet'

type AppLocale = 'en' | 'id' | 'tet'

const savedLang = localStorage.getItem('lang') as AppLocale | null

const messages = {
  en,
  id: localeId,
  tet,
}

const i18n = createI18n({
  legacy: false,
  locale: savedLang || 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n