<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

type LoginUser = {
  id: number | string
  username: string
  full_name?: string
  email?: string
  role?: string
  role_label?: string
  shop_id?: number | string
  shop_name?: string
  shop_code?: string
}

type LoginResponse = {
  token: string
  user: LoginUser
}

const router = useRouter()

const shopCode = ref('')
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const isDark = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const API_LOGIN_URL = 'https://api.valdker.web.id/api/auth/login/'

const canSubmit = computed(() => {
  return (
    shopCode.value.trim() !== '' &&
    username.value.trim() !== '' &&
    password.value.trim() !== ''
  )
})

const toggleDark = () => {
  isDark.value = !isDark.value
  localStorage.setItem('valdker_theme_dark', String(isDark.value))
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const saveAuthToStorage = (data: LoginResponse) => {
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  localStorage.setItem('shop_code', data.user.shop_code || shopCode.value.trim().toUpperCase())

  if (rememberMe.value) {
    localStorage.setItem('remember_shop_code', shopCode.value)
    localStorage.setItem('remember_username', username.value)
    localStorage.setItem('remember_me', 'true')
  } else {
    localStorage.removeItem('remember_shop_code')
    localStorage.removeItem('remember_username')
    localStorage.removeItem('remember_me')
  }
}

const handleLogin = async () => {
  errorMessage.value = ''

  if (!canSubmit.value) {
    errorMessage.value = 'Shop Code, Username, dan Password wajib diisi.'
    return
  }

  try {
    isLoading.value = true

    const payload = {
      shop_code: shopCode.value.trim(),
      username: username.value.trim(),
      password: password.value,
    }

    const { data } = await axios.post<LoginResponse>(API_LOGIN_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!data?.token) {
      throw new Error('Token login tidak ditemukan dari server.')
    }

    saveAuthToStorage(data)

    router.push('/dashboard')
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Login gagal. Periksa Shop Code, Username, dan Password.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('valdker_theme_dark')
  isDark.value = savedTheme === 'true'

  const savedRemember = localStorage.getItem('remember_me') === 'true'
  rememberMe.value = savedRemember

  if (savedRemember) {
    shopCode.value = localStorage.getItem('remember_shop_code') || ''
    username.value = localStorage.getItem('remember_username') || ''
  }
})
</script>

<template>
  <div class="login-page" :class="{ dark: isDark }">
    <div class="login-shell">
      <!-- Left / Branding -->
      <div class="login-brand-panel">
        <div class="brand-top">
          <div class="brand-badge">ValdKerPOS</div>

          <button class="theme-toggle" type="button" @click="toggleDark">
            {{ isDark ? '☀ Light' : '🌙 Dark' }}
          </button>
        </div>

        <div class="brand-content">
          <p class="eyebrow">Modern Multi-Business POS</p>
          <h1>Kelola toko dengan login yang aman dan sederhana.</h1>
          <p class="brand-description">
            Masukkan Shop Code, Username, dan Password untuk masuk ke dashboard
            toko Anda.
          </p>

          <div class="brand-cards">
            <div class="mini-card">
              <span class="mini-card-label">Retail</span>
              <strong>Penjualan harian, stok, laporan</strong>
            </div>

            <div class="mini-card">
              <span class="mini-card-label">Restaurant</span>
              <strong>Order cepat, kitchen flow, transaksi</strong>
            </div>

            <div class="mini-card">
              <span class="mini-card-label">Workshop</span>
              <strong>Service order, sparepart, customer</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Right / Login Form -->
      <div class="login-form-panel">
        <div class="login-card">
          <div class="login-card-header">
            <div class="logo-circle">V</div>
            <div>
              <h2>Sign In</h2>
              <p>Silakan login untuk masuk ke sistem.</p>
            </div>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="shopCode">Shop Code</label>
              <input
                id="shopCode"
                v-model="shopCode"
                type="text"
                placeholder="Contoh: WFOURMART"
                autocomplete="organization"
              />
            </div>

            <div class="form-group">
              <label for="username">Username</label>
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="Masukkan username"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>

              <div class="password-wrap">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="togglePassword"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-box">
                <input v-model="rememberMe" type="checkbox" />
                <span>Remember me</span>
              </label>

              <a href="#" class="forgot-link">Lupa password?</a>
            </div>

            <p v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="login-button"
              :disabled="isLoading || !canSubmit"
            >
              <span v-if="!isLoading">Login</span>
              <span v-else>Memproses...</span>
            </button>
          </form>

          <div class="login-footer">
            <p>Secure access for Owner, Manager, dan Cashier.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 30%),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.14), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  color: #0f172a;
  transition: background 0.3s ease, color 0.3s ease;
}

.login-page.dark {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.12), transparent 24%),
    linear-gradient(180deg, #020617 0%, #0f172a 100%);
  color: #f8fafc;
}

.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(540px, 1fr) minmax(420px, 500px);
  align-items: center;
  gap: 56px;
  padding: 32px 40px;
}

.login-brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 64px);
}

.brand-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 72px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(12px);
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.login-page.dark .brand-badge {
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.4);
}

.theme-toggle {
  border: none;
  border-radius: 999px;
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.72);
  color: inherit;
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.login-page.dark .theme-toggle {
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.4);
}

.brand-content {
  max-width: 620px;
}

.eyebrow {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2563eb;
  margin: 0 0 16px;
}

.login-page.dark .eyebrow {
  color: #60a5fa;
}

.brand-content h1 {
  margin: 0;
  font-size: 60px;
  line-height: 1.05;
  font-weight: 800;
  max-width: 620px;
}

.brand-description {
  margin-top: 20px;
  font-size: 17px;
  line-height: 1.75;
  color: #475569;
  max-width: 520px;
}

.login-page.dark .brand-description {
  color: #cbd5e1;
}

.brand-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, 1fr));
  gap: 14px;
  margin-top: 34px;
  max-width: 560px;
}

.mini-card {
  padding: 18px 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.login-page.dark .mini-card {
  background: rgba(15, 23, 42, 0.74);
  border-color: rgba(148, 163, 184, 0.12);
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.35);
}

.mini-card-label {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
}

.login-page.dark .mini-card-label {
  color: #60a5fa;
}

.mini-card strong {
  display: block;
  font-size: 14px;
  line-height: 1.6;
}

.login-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 480px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(16px);
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
  padding: 32px;
}

.login-page.dark .login-card {
  background: rgba(15, 23, 42, 0.82);
  border-color: rgba(148, 163, 184, 0.12);
  box-shadow: 0 30px 60px rgba(2, 6, 23, 0.45);
}

.login-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.logo-circle {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.35);
}

.login-card-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.login-card-header p {
  margin: 6px 0 0;
  font-size: 14px;
  color: #64748b;
}

.login-page.dark .login-card-header p {
  color: #94a3b8;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border: 1px solid #dbe3ef;
  background: rgba(255, 255, 255, 0.88);
  padding: 0 16px;
  font-size: 15px;
  color: #0f172a;
  outline: none;
  transition: 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.16);
}

.login-page.dark .form-group input {
  background: rgba(2, 6, 23, 0.5);
  border-color: rgba(148, 163, 184, 0.18);
  color: #f8fafc;
}

.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 84px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.login-page.dark .password-toggle {
  color: #60a5fa;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.remember-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #475569;
}

.login-page.dark .remember-box {
  color: #cbd5e1;
}

.forgot-link {
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
}

.login-page.dark .forgot-link {
  color: #60a5fa;
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.16);
  color: #dc2626;
  font-size: 14px;
}

.login-button {
  height: 54px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 18px 30px rgba(37, 99, 235, 0.28);
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 22px;
  text-align: center;
}

.login-footer p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.login-page.dark .login-footer p {
  color: #94a3b8;
}

@media (max-width: 1200px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 36px;
    padding: 28px;
  }

  .login-brand-panel {
    min-height: auto;
  }

  .brand-top {
    margin-bottom: 48px;
  }

  .brand-content h1 {
    font-size: 44px;
  }

  .brand-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .brand-content h1 {
    font-size: 34px;
  }

  .brand-description {
    font-size: 15px;
  }

  .brand-cards {
    grid-template-columns: 1fr;
  }

  .login-card {
    padding: 24px;
    border-radius: 24px;
  }
}

@media (max-width: 640px) {
  .login-shell {
    padding: 20px;
  }

  .brand-top {
    margin-bottom: 36px;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>