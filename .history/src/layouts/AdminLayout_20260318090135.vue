<script setup lang="ts">
import { computed } from 'vue'

type Shop = {
  id: string | number
  name: string
}

type OpenGroups = {
  sales: boolean
  inventory: boolean
  people: boolean
  finance: boolean
  reports: boolean
}

type Props = {
  isCollapsed: boolean
  isMobileOpen: boolean
  isDark: boolean
  openGroups: OpenGroups
  stockAlertCount: number
  pendingOrderCount: number
  shops: Shop[]
  currentShop: Shop | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-group', group: keyof OpenGroups): void
  (e: 'close-mobile'): void
  (e: 'toggle-collapse'): void
  (e: 'change-shop', shopId: string | number): void
}>()

const typedShops = computed<Shop[]>(() => props.shops ?? [])
const typedCurrentShop = computed<Shop | null>(() => props.currentShop ?? null)

const handleShopChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('change-shop', target.value)
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