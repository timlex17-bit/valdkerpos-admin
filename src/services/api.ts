import axios, { type InternalAxiosRequestConfig } from 'axios'

const clearAuthStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('shop')
  localStorage.removeItem('shop_code')
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
