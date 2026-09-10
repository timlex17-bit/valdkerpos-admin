import axios, { type InternalAxiosRequestConfig } from 'axios'

const clearAuthStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('shop')
  localStorage.removeItem('shop_code')
  localStorage.removeItem('effective_modules')
  localStorage.removeItem('module_contract')
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.valdker.web.id',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (import.meta.env.DEV) {
      const baseURL = config.baseURL || api.defaults.baseURL || window.location.origin
      const requestUrl = new URL(String(config.url || ''), baseURL).toString()
      console.info('[API request]', String(config.method || 'GET').toUpperCase(), requestUrl)
    }

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Token ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only 401 (no/expired credentials) ends the session. A 403 means the
    // session is fine and this particular action is not allowed - logging the
    // user out on that would throw them to /login for merely opening a module
    // their role does not cover. It is left for the calling view to report.
    if (error?.response?.status === 401) {
      clearAuthStorage()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  }
)

export default api
