import { createI18n } from 'vue-i18n'
import en from './en.json'
import id from './id.json'
import tet from './tet.json'

type MessageSchema = typeof en
type AppLocale = 'en' | 'id' | 'tet'

const messages: Record<AppLocale, MessageSchema> = {
  en,
  id,
  tet,
}

const savedLang = localStorage.getItem('lang') as AppLocale | null

const i18n = createI18n<[MessageSchema], AppLocale>({
  legacy: false,
  locale: savedLang || 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n