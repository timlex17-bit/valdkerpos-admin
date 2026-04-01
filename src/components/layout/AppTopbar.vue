<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

type AppLocale = 'en' | 'id' | 'tet'

interface Props {
  isDark?: boolean
  userName?: string
  currentShopName?: string
  profileOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDark: false,
  userName: 'Owner',
  currentShopName: 'Main Shop',
  profileOpen: false,
})

const emit = defineEmits<{
  (e: 'toggle-mobile-sidebar'): void
  (e: 'toggle-dark'): void
  (e: 'toggle-profile'): void
}>()

const router = useRouter()
const { locale, t } = useI18n()

const userInitial = computed(() => {
  return (props.userName || 'U').trim().charAt(0).toUpperCase()
})

const currentLanguage = computed<AppLocale>({
  get: () => (locale.value as AppLocale) || 'en',
  set: (value) => {
    locale.value = value
    localStorage.setItem('lang', value)
  },
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  localStorage.removeItem('shop')
  localStorage.removeItem('shop_code')

  router.replace('/login')
}
</script>

<template>
  <header class="topbar" :class="{ dark: props.isDark }">
    <div class="topbar-left">
      <button class="mobile-menu-btn" type="button" @click="emit('toggle-mobile-sidebar')">
        ☰
      </button>

      <div class="topbar-title-wrap">
        <h1>{{ t('adminPanel') }}</h1>
        <p>{{ props.currentShopName }}</p>
      </div>
    </div>

    <div class="topbar-right">
      <div class="language-switcher">
        <select v-model="currentLanguage" class="language-select">
          <option value="en">English</option>
          <option value="id">Indonesia</option>
          <option value="tet">Tetun</option>
        </select>
      </div>

      <button class="icon-btn" type="button" @click="emit('toggle-dark')">
        {{ props.isDark ? '☀' : '🌙' }}
      </button>

      <div class="profile-wrap">
        <button class="profile-btn" type="button" @click="emit('toggle-profile')">
          <span class="avatar">{{ userInitial }}</span>
          <span class="profile-name">{{ props.userName }}</span>
        </button>

        <div v-if="props.profileOpen" class="profile-dropdown">
          <button class="dropdown-item" type="button">{{ t('profile') }}</button>
          <button class="dropdown-item" type="button">{{ t('settings') }}</button>
          <button class="dropdown-item danger" type="button" @click="logout">
            {{ t('logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  background: #ffffff;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar.dark {
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-title-wrap h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #059814;
}

.topbar-title-wrap p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.topbar.dark .topbar-title-wrap p {
  color: #cbd5e1;
}

.mobile-menu-btn,
.icon-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 10px;
  cursor: pointer;
}

.topbar.dark .mobile-menu-btn,
.topbar.dark .icon-btn {
  background: #111827;
  color: white;
  border-color: rgba(255, 255, 255, 0.08);
}

.mobile-menu-btn {
  display: none;
}

.language-switcher {
  display: flex;
  align-items: center;
}

.language-select {
  min-width: 120px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  outline: none;
}

.language-select:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

.topbar.dark .language-select {
  background: #111827;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.08);
}

.profile-wrap {
  position: relative;
}

.profile-btn {
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.topbar.dark .profile-btn {
  background: #111827;
  color: white;
  border-color: rgba(255, 255, 255, 0.08);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(135deg, #60e66c, #059814);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.08);
  padding: 8px;
  z-index: 40;
}

.topbar.dark .profile-dropdown {
  background: #111827;
  border-color: rgba(255, 255, 255, 0.08);
}

.dropdown-item {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: inherit;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.topbar.dark .dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.dropdown-item.danger {
  color: #dc2626;
}

@media (max-width: 1024px) {
  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .profile-name {
    display: none;
  }

  .language-select {
    min-width: 96px;
    font-size: 13px;
    padding: 0 10px;
  }
}
</style>