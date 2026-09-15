<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { loadModuleContract } from '@/services/moduleContract'

type Shop = {
  id: string | number
  name: string
}

type LoggedUser = {
  id?: string | number
  username?: string
  full_name?: string
  email?: string
  role?: string
  role_label?: string
  shop_id?: string | number
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
  effective_modules?: unknown
}

type LoggedShop = {
  id?: string | number
  name?: string
  code?: string
  slug?: string
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

const router = useRouter()
const route = useRoute()
const { t, te } = useI18n()

// Set by the router guard (an i18n key) or by a page that sends the user
// away (a sentence); shown once, on whatever page the user lands on.
const accessNotice = ref('')
watch(
  () => route.fullPath,
  () => {
    const pending = sessionStorage.getItem('module_access_message')
    if (!pending) return
    sessionStorage.removeItem('module_access_message')
    accessNotice.value = te(pending) ? t(pending) : pending
  },
  { immediate: true },
)

const openGroups = ref({
  sales: true,
  inventory: true,
  people: true,
  finance: true,
  workshop: true,
  restaurant: true,
  reports: true,
  'system-tools': true,
})

const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const isDark = ref(false)
const profileOpen = ref(false)

const stockAlertCount = ref(0)
const pendingOrderCount = ref(0)

const loggedUser = ref<LoggedUser | null>(null)
const loggedShop = ref<LoggedShop | null>(null)

const shops = ref<Shop[]>([])
const selectedShopId = ref('')

const currentShop = computed<Shop | null>(() => {
  return shops.value.find((shop) => String(shop.id) === selectedShopId.value) ?? null
})

const displayUserName = computed(() => {
  return (
    loggedUser.value?.full_name ||
    loggedUser.value?.username ||
    'Uzuáriu'
  )
})

const displayShopName = computed(() => {
  return (
    currentShop.value?.name ||
    loggedShop.value?.name ||
    loggedUser.value?.shop_name ||
    'Shop'
  )
})

const loadTheme = () => {
  const savedTheme = localStorage.getItem('valdker_theme_dark')
  isDark.value = savedTheme === 'true'
}

const loadAuthUser = () => {
  const token = localStorage.getItem('token')
  const userRaw = localStorage.getItem('user')
  const shopRaw = localStorage.getItem('shop')

  if (!token || !userRaw) {
    router.replace('/login')
    return
  }

  try {
    const parsedUser = JSON.parse(userRaw)
    loggedUser.value = parsedUser

    if (shopRaw) {
      loggedShop.value = JSON.parse(shopRaw)
    }

    const shopId = loggedShop.value?.id ?? parsedUser?.shop_id
    const shopName = loggedShop.value?.name ?? parsedUser?.shop_name

    if (shopId && shopName) {
      shops.value = [
        {
          id: String(shopId),
          name: shopName,
        },
      ]
      selectedShopId.value = String(shopId)
    } else {
      shops.value = []
      selectedShopId.value = ''
    }
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('shop')
    localStorage.removeItem('shop_code')
    router.replace('/login')
  }
}

const toggleGroup = (group: string) => {
  openGroups.value[group as keyof typeof openGroups.value] = !openGroups.value[group as keyof typeof openGroups.value]
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const toggleMobileSidebar = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}

const toggleDark = () => {
  isDark.value = !isDark.value
  localStorage.setItem('valdker_theme_dark', String(isDark.value))
}

const toggleProfile = () => {
  profileOpen.value = !profileOpen.value
}

const changeShop = (shopId: string | number) => {
  selectedShopId.value = String(shopId)
}

onMounted(() => {
  loadTheme()
  loadAuthUser()
  // Refresh the module contract on every boot so a plan or permission change
  // made by the platform admin takes effect without asking the user to log
  // out and back in.
  void loadModuleContract()
})
</script>

<template>
  <div class="admin-layout" :class="{ dark: isDark }">
    <AppSidebar
      :is-collapsed="isCollapsed"
      :is-mobile-open="isMobileOpen"
      :is-dark="isDark"
      :open-groups="openGroups"
      :stock-alert-count="stockAlertCount"
      :pending-order-count="pendingOrderCount"
      :shops="shops"
      :current-shop="currentShop"
      :current-user="loggedUser"
      @toggle-group="toggleGroup"
      @close-mobile="closeMobileSidebar"
      @toggle-collapse="toggleCollapse"
      @change-shop="changeShop"
    />

    <main class="main-content">
      <AppTopbar
        :is-dark="isDark"
        :user-name="displayUserName"
        :current-shop-name="displayShopName"
        :profile-open="profileOpen"
        @toggle-mobile-sidebar="toggleMobileSidebar"
        @toggle-dark="toggleDark"
        @toggle-profile="toggleProfile"
      />

      <section class="page-content">
        <div v-if="accessNotice" class="access-notice" role="status">
          <span class="access-notice-icon" aria-hidden="true">!</span>
          <span>{{ accessNotice }}</span>
          <button type="button" class="access-notice-close" :aria-label="t('common.close')" @click="accessNotice = ''">×</button>
        </div>
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  color: #111827;
}

.admin-layout.dark {
  background: #020617;
  color: #f8fafc;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.page-content {
  flex: 1;
  padding: 24px;
}

.access-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  color: var(--brand-900);
  font-weight: 600;
}

.access-notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--brand-600);
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.access-notice-close {
  margin-left: auto;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 20px;
  cursor: pointer;
}

.admin-layout.dark .access-notice {
  background: rgba(98, 4, 191, 0.18);
  border-color: rgba(155, 77, 232, 0.35);
  color: #ebd9fd;
}

@media (max-width: 1024px) {
  .page-content {
    padding: 18px;
  }
}
</style>
