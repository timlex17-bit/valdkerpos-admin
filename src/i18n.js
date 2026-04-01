import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    welcome: 'Welcome',
    login: 'Login',
    logout: 'Logout',
    dashboard: 'Dashboard'
  },
  id: {
    welcome: 'Selamat Datang',
    login: 'Masuk',
    logout: 'Keluar',
    dashboard: 'Dashboard'
  },
  tet: {
    welcome: 'Bemvindu',
    login: 'Tama',
    logout: 'Sai',
    dashboard: 'Painel'
  }
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'id',
  fallbackLocale: 'en',
  messages
})

export default i18n