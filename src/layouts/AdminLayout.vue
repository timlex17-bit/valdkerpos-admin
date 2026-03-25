<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

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
  shop_code?: string
  is_staff?: boolean
  is_superuser?: boolean
  is_platform_admin?: boolean
  is_shop_user?: boolean
  is_shop_owner?: boolean
  is_shop_manager?: boolean
  is_shop_cashier?: boolean
}

type LoggedShop = {
  id?: string | number
  name?: string
  code?: string
  slug?: string
  business_type?: string
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

const openGroups = ref({
  sales: true,
  inventory: true,
  people: true,
  finance: true,
  reports: true,
})

const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const isDark = ref(false)
const profileOpen = ref(false)

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
  } catch (error) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('shop')
    localStorage.removeItem('shop_code')
    router.replace('/login')
  }
}

const toggleGroup = (group: keyof typeof openGroups.value) => {
  openGroups.value[group] = !openGroups.value[group]
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
})
</script>

<template>
  <div class="admin-layout" :class="{ dark: isDark }">
    <AppSidebar
      :is-collapsed="isCollapsed"
      :is-mobile-open="isMobileOpen"
      :is-dark="isDark"
      :open-groups="openGroups"
      :stock-alert-count="7"
      :pending-order-count="3"
      :shops="shops"
      :current-shop="currentShop"
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

@media (max-width: 1024px) {
  .page-content {
    padding: 18px;
  }
}
</style>