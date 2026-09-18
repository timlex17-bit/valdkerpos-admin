<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { clearModuleContract } from '@/services/moduleContract'

type AppLocale = 'en' | 'id' | 'tet'

interface Props {
  isDark?: boolean
  userName?: string
  profileOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDark: false,
  userName: 'Owner',
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

const openSettings = () => {
  emit('toggle-profile')
  router.push('/settings')
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  localStorage.removeItem('shop')
  localStorage.removeItem('shop_code')
  // Entitlements are per user. Leaving these behind let the next person to
  // log in on this browser inherit the previous user's modules until their
  // own contract arrived.
  localStorage.removeItem('effective_modules')
  clearModuleContract()

  router.replace('/login')
}
</script>

<template>
  <header class="topbar" :class="{ dark: props.isDark }">
    <div class="topbar-left">
      <!-- The shop's name moved to the top of the sidebar, above "Admin
           panel", where it sits beside the menu it applies to. -->
      <button class="mobile-menu-btn" type="button" @click="emit('toggle-mobile-sidebar')">
        ☰
      </button>
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
          <!--
            A "Profile" item belongs here, but there is no profile page and no
            /profile route yet, so the button did nothing when clicked - which
            reads to the user as a broken app rather than a missing feature.
            Restore this line once a profile page exists:
            <button class="dropdown-item" type="button" @click="openProfile">{{ t('profile') }}</button>
          -->
          <button class="dropdown-item" type="button" @click="openSettings">{{ t('settings') }}</button>
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
  padding: 0 40px 0 12px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  outline: none;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'><path fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.language-select:focus {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(98, 4, 191, 0.15);
}

.topbar.dark .language-select {
  background-color: #111827;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.08);
}

.topbar.dark .language-select {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23cbd5e1'><path fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/></svg>");
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
  background: var(--brand-gradient);
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
    padding: 0 34px 0 10px;
    background-position: right 10px center;
    background-size: 14px;
  }
}
</style>