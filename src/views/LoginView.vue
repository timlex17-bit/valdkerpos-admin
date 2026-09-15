<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type LoginUser = {
  id: number | string
  username: string
  full_name?: string
  email?: string
  role?: string
  businessType?: string
  plan?: string
  effectiveModules?: string[]
  menuPermissions?: unknown
  role_label?: string
  shop_id?: number | string
  shop_name?: string
  shop_business_type?: string
  shop_plan?: string
  shop_code?: string
  is_staff?: boolean
  is_superuser?: boolean
  is_platform_admin?: boolean
  is_shop_user?: boolean
  is_shop_owner?: boolean
  is_shop_admin?: boolean
  is_shop_manager?: boolean
  is_shop_cashier?: boolean
  menu_permissions?: unknown
  effective_modules?: string[]
}

type LoginShop = {
  id: number | string
  name: string
  code?: string
  slug?: string
  businessType?: string
  business_type?: string
  business_type_value?: string
  plan?: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  logo_url?: string
  all_category_icon?: string | null
  all_category_icon_url?: string
  features?: Record<string, any>
}

type LoginResponse = {
  token: string
  user: LoginUser
  shop?: LoginShop
  effective_modules?: string[]
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

const API_LOGIN_URL = ENDPOINTS.AUTH_LOGIN

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
  const shopBusinessType =
    data.user.businessType ||
    data.user.shop_business_type ||
    data.shop?.businessType ||
    data.shop?.business_type ||
    ''
  const shopPlan = data.user.plan || data.user.shop_plan || data.shop?.plan || 'BASIC'
  const effectiveModules = Array.isArray(data.effective_modules)
    ? data.effective_modules
    : Array.isArray(data.user.effectiveModules)
      ? data.user.effectiveModules
      : Array.isArray(data.user.effective_modules)
        ? data.user.effective_modules
        : []
  const userWithShopProfile: LoginUser = {
    ...data.user,
    role: data.user.role || 'cashier',
    businessType: shopBusinessType,
    plan: shopPlan,
    effectiveModules,
    menuPermissions: data.user.menuPermissions || data.user.menu_permissions || [],
    shop_id: data.user.shop_id || data.shop?.id,
    shop_name: data.user.shop_name || data.shop?.name,
    shop_business_type: shopBusinessType,
    shop_plan: shopPlan,
    menu_permissions: data.user.menu_permissions || data.user.menuPermissions || [],
    effective_modules: effectiveModules,
  }

  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(userWithShopProfile))
  localStorage.setItem('effective_modules', JSON.stringify(effectiveModules))

  if (data.shop) {
    localStorage.setItem(
      'shop',
      JSON.stringify({
        ...data.shop,
        businessType: data.shop.businessType || data.shop.business_type || shopBusinessType,
        business_type: data.shop.business_type || shopBusinessType,
        plan: data.shop.plan || shopPlan,
      })
    )
  }

  localStorage.setItem(
    'shop_code',
    userWithShopProfile.shop_code || data.shop?.code || shopCode.value.trim().toUpperCase()
  )

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
    errorMessage.value = 'Shop Code, Naran Uzuáriu, no Password tenke prenxe hotu.'
    return
  }

  try {
    isLoading.value = true

    const payload = {
      shop_code: shopCode.value.trim(),
      username: username.value.trim(),
      password: password.value,
    }

    const { data } = await api.post<LoginResponse>(API_LOGIN_URL, payload)

    if (!data?.token) {
      throw new Error('Token login la hetan husi server.')
    }

    saveAuthToStorage(data)

    router.replace('/dashboard')
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Login la konsege. Favor haree fali Shop Code, Naran Uzuáriu, no Password.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    router.replace('/dashboard')
    return
  }

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
      <div class="login-brand-panel">
        <div class="brand-top">
          <div class="brand-badge">ValoraPOS</div>

          <button class="theme-toggle" type="button" @click="toggleDark">
            {{ isDark ? '☀ Klaru' : '🌙 Lakan' }}
          </button>
        </div>

        <div class="brand-content">
          <p class="eyebrow">POS Negósiu Multi-Tipu Modernu</p>
          <h1>Solusaun kompletu ba jere ita-nia negósiu.</h1>
          <p class="brand-description">
            Jere venda, stok, no relatóriu iha sistema ida de’it.
          </p>

          <div class="brand-cards">
            <div class="mini-card">
              <span class="mini-card-label">Retail</span>
              <strong>Venda lorloron, stok, no relatóriu</strong>
            </div>

            <div class="mini-card">
              <span class="mini-card-label">Restorante</span>
              <strong>Pedido lalais, fluxo cozinha, tranzasaun</strong>
            </div>

            <div class="mini-card">
              <span class="mini-card-label">Workshop</span>
              <strong>Ordem servisu, pessa sobresalente, kliente</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="login-form-panel">
        <div class="login-card">
          <div class="login-card-header">
            <div class="logo-circle">V</div>
            <div>
              <h2>Tama</h2>
              <p>Favor halo login atu tama ba sistema.</p>
            </div>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="shopCode">Shop Code</label>
              <input
                id="shopCode"
                v-model="shopCode"
                type="text"
                placeholder="Hatama Shop Code"
                autocomplete="organization"
              />
            </div>

            <div class="form-group">
              <label for="username">Naran Uzuáriu</label>
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="Hatama Naran Uzuáriu"
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
                  placeholder="Hatama Password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="togglePassword"
                >
                  {{ showPassword ? 'Subar' : 'Haree' }}
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-box">
                <input v-model="rememberMe" type="checkbox" />
                <span>Hatudu nafatin hau-nia konta</span>
              </label>

              <a href="#" class="forgot-link">Haluha password?</a>
            </div>

            <p v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="login-button"
              :disabled="isLoading || !canSubmit"
            >
              <span v-if="!isLoading">Tama</span>
              <span v-else>Hein hela...</span>
            </button>
          </form>

          <div class="login-footer">
            <p>Asesu seguru ba Owner no Manager.</p>
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
    radial-gradient(circle at top left, rgba(98, 4, 191, 0.16), transparent 30%),
    radial-gradient(circle at bottom right, rgba(98, 4, 191, 0.14), transparent 28%),
    linear-gradient(180deg, #faf6ff 0%, #f1e8fd 100%);
  color: #0f172a;
  transition: background 0.3s ease, color 0.3s ease;
  overflow: hidden;
}

.login-page.dark {
  background:
    radial-gradient(circle at top left, rgba(98, 4, 191, 0.14), transparent 22%),
    radial-gradient(circle at 85% 85%, rgba(98, 4, 191, 0.18), transparent 26%),
    linear-gradient(180deg, #0f0520 0%, #1a0a33 100%);
  color: #f8fafc;
}

.login-shell {
  min-height: 100vh;
  max-width: 1380px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(540px, 1.1fr) minmax(420px, 0.9fr);
  align-items: center;
  gap: 52px;
  padding: 36px 40px;
  position: relative;
}

.login-brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 72px);
  position: relative;
  z-index: 2;
}

.brand-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 56px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(98, 4, 191, 0.16);
  backdrop-filter: blur(12px);
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 30px rgba(98, 4, 191, 0.08);
}

.login-page.dark .brand-badge {
  background: rgba(7, 27, 17, 0.84);
  border-color: rgba(98, 4, 191, 0.14);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.34);
}

.theme-toggle {
  border: none;
  border-radius: 999px;
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.76);
  color: inherit;
  border: 1px solid rgba(98, 4, 191, 0.16);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(98, 4, 191, 0.08);
}

.login-page.dark .theme-toggle {
  background: rgba(7, 27, 17, 0.84);
  border-color: rgba(98, 4, 191, 0.14);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.34);
}

.brand-content {
  max-width: 650px;
}

.eyebrow {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brand-600);
  margin: 0 0 18px;
}

.login-page.dark .eyebrow {
  color: var(--brand-600);
}

.brand-content h1 {
  margin: 0;
  font-size: 64px;
  line-height: 1.02;
  font-weight: 800;
  max-width: 650px;
  letter-spacing: -0.03em;
}

.brand-description {
  margin-top: 22px;
  font-size: 17px;
  line-height: 1.8;
  color: #3d4b42;
  max-width: 520px;
}

.login-page.dark .brand-description {
  color: #cfe6d4;
}

.brand-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, 1fr));
  gap: 14px;
  margin-top: 34px;
  max-width: 600px;
}

.mini-card {
  padding: 18px 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(98, 4, 191, 0.14);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 36px rgba(98, 4, 191, 0.08);
  min-height: 108px;
}

.login-page.dark .mini-card {
  background: rgba(7, 27, 17, 0.76);
  border-color: rgba(98, 4, 191, 0.12);
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.mini-card-label {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--brand-600);
}

.login-page.dark .mini-card-label {
  color: var(--brand-600);
}

.mini-card strong {
  display: block;
  font-size: 14px;
  line-height: 1.55;
}

.login-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-form-panel::before {
  content: '';
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(98, 4, 191, 0.14), transparent 70%);
  filter: blur(18px);
  z-index: 0;
}

.login-page.dark .login-form-panel::before {
  background: radial-gradient(circle, rgba(98, 4, 191, 0.12), transparent 72%);
}

.login-card {
  width: 100%;
  max-width: 470px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(98, 4, 191, 0.14);
  backdrop-filter: blur(16px);
  box-shadow: 0 32px 70px rgba(98, 4, 191, 0.12);
  padding: 32px;
  position: relative;
  z-index: 1;
}

.login-page.dark .login-card {
  background: rgba(7, 27, 17, 0.84);
  border-color: rgba(98, 4, 191, 0.12);
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.4),
    0 0 80px rgba(98, 4, 191, 0.1);
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
  background: var(--brand-gradient);
  box-shadow: 0 16px 30px rgba(98, 4, 191, 0.35);
}

.login-card-header h2 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.login-card-header p {
  margin: 6px 0 0;
  font-size: 14px;
  color: #5f6f65;
}

.login-page.dark .login-card-header p {
  color: #b7ccc0;
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
  height: 54px;
  border-radius: 16px;
  border: 1px solid #d6ead9;
  background: rgba(255, 255, 255, 0.92);
  padding: 0 16px;
  font-size: 15px;
  color: #0f172a;
  outline: none;
  transition: 0.2s ease;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: #7a897f;
}

.form-group input:focus {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 4px rgba(98, 4, 191, 0.14);
}

.login-page.dark .form-group input {
  background: rgba(2, 16, 10, 0.62);
  border-color: rgba(98, 4, 191, 0.16);
  color: #f8fafc;
}

.login-page.dark .form-group input::placeholder {
  color: #8ea194;
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
  color: var(--brand-600);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.login-page.dark .password-toggle {
  color: var(--brand-600);
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
  color: var(--brand-600);
  text-decoration: none;
}

.login-page.dark .forgot-link {
  color: var(--brand-600);
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.16);
  color: #dc2626;
  font-size: 14px;
}

.login-button {
  height: 56px;
  border: none;
  border-radius: 16px;
  background: var(--brand-gradient);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 18px 30px rgba(98, 4, 191, 0.28);
  transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 22px 36px rgba(98, 4, 191, 0.34);
}

.login-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
}

.login-footer p {
  margin: 0;
  font-size: 13px;
  color: #5f6f65;
}

.login-page.dark .login-footer p {
  color: #b7ccc0;
}

@media (max-width: 1280px) {
  .login-shell {
    grid-template-columns: minmax(480px, 1fr) minmax(400px, 460px);
    gap: 40px;
  }

  .brand-content h1 {
    font-size: 54px;
  }
}

@media (max-width: 1100px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 34px;
    padding: 28px;
  }

  .login-brand-panel {
    min-height: auto;
  }

  .brand-top {
    margin-bottom: 42px;
  }

  .brand-content h1 {
    font-size: 44px;
    max-width: 720px;
  }

  .brand-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-width: 100%;
  }

  .login-form-panel {
    justify-content: flex-start;
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
    max-width: 100%;
    padding: 24px;
    border-radius: 24px;
  }
}

@media (max-width: 640px) {
  .login-shell {
    padding: 20px;
  }

  .brand-top {
    margin-bottom: 32px;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-content h1 {
    font-size: 30px;
  }

  .login-card-header h2 {
    font-size: 26px;
  }
}
</style>
