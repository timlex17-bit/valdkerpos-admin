<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminMenuGroups, type MenuGroupConfig } from '@/utils/adminMenu'
import { getVisibleMenuItems } from '@/utils/moduleVisibility'
import type { PermissionUser } from '@/utils/menuPermissions'

type Shop = {
  id: string | number
  name: string
}

type OpenGroups = Record<string, boolean>

interface Props {
  isCollapsed: boolean
  isMobileOpen: boolean
  isDark: boolean
  openGroups: OpenGroups
  stockAlertCount: number
  pendingOrderCount: number
  shops: Shop[]
  currentShop: Shop | null
  currentUser: PermissionUser | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-group', group: string): void
  (e: 'close-mobile'): void
  (e: 'toggle-collapse'): void
  (e: 'change-shop', shopId: string | number): void
}>()

const { t } = useI18n()

const {
  isCollapsed,
  isMobileOpen,
  isDark,
  openGroups,
  stockAlertCount,
  pendingOrderCount,
  shops,
  currentShop,
  currentUser,
} = toRefs(props)

const safeShops = computed<Shop[]>(() => shops.value ?? [])
const safeCurrentShop = computed<Shop | null>(() => currentShop.value ?? null)

const visibleGroups = computed<MenuGroupConfig[]>(() =>
  adminMenuGroups
    .map((group) => ({
      ...group,
      items: getVisibleMenuItems(group.items, currentUser.value),
    }))
    .filter((group) => group.items.length > 0)
)

const menuLabel = (key: string, fallback: string) => {
  const translationKey = `menu.${key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())}`
  const translated = t(translationKey)
  return translated === translationKey ? fallback : translated
}

const menuBadge = (key: string) => {
  if (key === 'orders' && pendingOrderCount.value > 0) return pendingOrderCount.value
  if (key === 'inventory_counts' && stockAlertCount.value > 0) return stockAlertCount.value
  return 0
}

const iconClass = (key: string) => key.replace(/_/g, '-')

const handleShopChange = (event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  emit('change-shop', target.value)
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: isCollapsed,
      mobileOpen: isMobileOpen,
      dark: isDark,
    }"
  >
    <div class="sidebar-top">
      <div class="brand-box">
        <div class="brand-icon">V</div>

        <div v-if="!isCollapsed" class="brand-text">
          <h2 class="logo">ValdKerPOS</h2>
          <p class="brand-subtitle">{{ t('adminPanel') }}</p>
        </div>
      </div>
    </div>

    <div v-if="!isCollapsed" class="shop-switcher">
      <label class="shop-label">{{ t('shop') }}</label>
      <select
        class="shop-select"
        :value="safeCurrentShop?.id ?? ''"
        @change="handleShopChange"
      >
        <option
          v-for="shop in safeShops"
          :key="String(shop.id)"
          :value="shop.id"
        >
          {{ shop.name }}
        </option>
      </select>
    </div>

    <nav class="menu">
      <div class="menu-section">
        <p v-if="!isCollapsed" class="menu-title">{{ t('menu.main') }}</p>

        <RouterLink to="/dashboard" class="menu-link" @click="emit('close-mobile')">
          <span class="menu-icon dashboard">D</span>
          <span>{{ t('menu.dashboard') }}</span>
        </RouterLink>
      </div>

      <div
        v-for="group in visibleGroups"
        :key="group.key"
        class="menu-section"
        :class="{ 'utility-section': group.key === 'system-tools' }"
      >
        <button class="group-toggle" type="button" @click="emit('toggle-group', group.key)">
          <span v-if="!isCollapsed">{{ menuLabel(group.key, group.label) }}</span>
          <span v-else>*</span>
          <span
            v-if="!isCollapsed"
            class="chevron"
            :class="{ open: openGroups[group.key] }"
          >
            ^
          </span>
        </button>

        <div v-show="openGroups[group.key] && !isCollapsed" class="group-items">
          <RouterLink
            v-for="item in group.items"
            :key="item.key"
            :to="item.route || '/dashboard'"
            class="menu-link"
            @click="emit('close-mobile')"
          >
            <span class="menu-icon" :class="iconClass(item.key)">
              {{ item.label.charAt(0) }}
            </span>
            <span>{{ menuLabel(item.key, item.label) }}</span>
            <span
              v-if="menuBadge(item.key) > 0"
              class="menu-badge"
              :class="item.key === 'orders' ? 'warning' : 'success'"
            >
              {{ menuBadge(item.key) }}
            </span>
          </RouterLink>
        </div>
      </div>
    </nav>
  </aside>

  <div v-if="isMobileOpen" class="sidebar-overlay" @click="emit('close-mobile')" />
</template>

<style scoped>
.sidebar {
  width: 290px;
  min-width: 290px;
  background: #ffffff;
  color: #111827;
  padding: 18px 14px;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 30;
  transition: width 0.25s ease, transform 0.25s ease;
}

.sidebar.dark {
  background: #0f172a;
  color: #f8fafc;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar.collapsed {
  width: 88px;
  min-width: 88px;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 20px;
  border-radius: 14px;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
}

.sidebar.dark .brand-box {
  background: rgba(96, 230, 108, 0.08);
  border-color: rgba(96, 230, 108, 0.18);
}

.brand-icon,
.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 800;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #60e66c, #059814);
  color: white;
  font-size: 18px;
}

.logo {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}

.brand-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: #16a34a;
}

.shop-switcher {
  margin-bottom: 18px;
}

.shop-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.shop-select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
}

.sidebar.dark .shop-select {
  background: #111827;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.1);
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.menu-title,
.group-toggle {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.menu-title {
  color: #9ca3af;
  margin: 0 0 8px;
  padding: 0 10px;
}

.group-toggle {
  width: 100%;
  background: transparent;
  border: none;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 10px;
  text-transform: uppercase;
}

.group-toggle:hover {
  background: #f0fdf4;
  color: #059814;
}

.sidebar.dark .group-toggle {
  color: #cbd5e1;
}

.group-items {
  margin-top: 8px;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #374151;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 4px;
  transition: 0.2s;
}

.menu-link:hover {
  background: #f0fdf4;
  color: #059814;
  transform: translateX(2px);
}

.menu-link.router-link-active {
  background: linear-gradient(90deg, #60e66c, #059814);
  color: white;
  box-shadow: 0 6px 14px rgba(5, 152, 20, 0.25);
}

.sidebar.dark .menu-link {
  color: #e5e7eb;
}

.menu-icon {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: #eef2ff;
  color: #2563eb;
  font-size: 11px;
}

.menu-icon.dashboard,
.menu-icon.products,
.menu-icon.inventory-counts,
.menu-icon.reports {
  background: #dcfce7;
  color: #16a34a;
}

.menu-icon.orders,
.menu-icon.stock-transfers,
.menu-icon.bookings {
  background: #fef3c7;
  color: #d97706;
}

.menu-icon.expenses,
.menu-icon.product-returns {
  background: #fee2e2;
  color: #dc2626;
}

.menu-badge {
  margin-left: auto;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.menu-badge.success {
  background: #dcfce7;
  color: #166534;
}

.menu-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.utility-section {
  margin-top: 10px;
  padding-top: 18px;
  border-top: 1px dashed #dbe4ee;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 20;
}

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  }

  .sidebar.mobileOpen {
    transform: translateX(0);
  }
}
</style>
