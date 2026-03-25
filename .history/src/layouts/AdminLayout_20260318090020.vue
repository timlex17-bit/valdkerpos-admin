<script setup lang="ts">
import { ref, computed } from 'vue'

const shops = ref<Shop[]>([])
const selectedShopId = ref<string>('')

const currentShop = computed<Shop | null>(() => {
  return shops.value.find((shop) => String(shop.id) === selectedShopId.value) ?? null
})

type Shop = {
  id: string | number
  name: string
}

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

const shops = ref<Shop[]>([
  { id: '1', name: 'Wfour Mart' },
  { id: '2', name: 'Valdker Cafe' },
  { id: '3', name: 'Main Outlet' },
])

const selectedShopId = ref('1')

const currentShop = computed<Shop | null>(() => {
  return shops.value.find((shop) => shop.id === selectedShopId.value) || null
})

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
}

const toggleProfile = () => {
  profileOpen.value = !profileOpen.value
}

const changeShop = (shopId: string) => {
  selectedShopId.value = shopId
}
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
        :user-name="'Rivaldo'"
        :current-shop-name="currentShop?.name || 'Main Shop'"
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