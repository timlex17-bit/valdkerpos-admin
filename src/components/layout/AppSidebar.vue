<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminMenuGroups, type MenuGroupConfig } from '@/utils/adminMenu'
import { canShowModule, getVisibleMenuItems } from '@/utils/moduleVisibility'
import type { PermissionUser } from '@/utils/menuPermissions'
import ModuleIcon from '@/components/icons/ModuleIcon.vue'
import { translatedGroupLabel, translatedModuleLabel } from '@/utils/menuLabels'

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
  /** Name shown above "Admin panel"; the layout resolves it from the session. */
  shopName?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-group', group: string): void
  (e: 'close-mobile'): void
  (e: 'toggle-collapse'): void
  (e: 'change-shop', shopId: string | number): void
}>()

const { t, te } = useI18n()

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

/**
 * The shop this session is working in, shown at the top of the menu. The
 * layout's name wins because it also covers a session whose shop list never
 * arrived; the product name is only the last resort.
 */
const displayShopName = computed(
  () => props.shopName?.trim() || safeCurrentShop.value?.name?.trim() || 'Valora'
)

/** One shop is not a choice: the name above already says which one it is. */
const showShopSwitcher = computed(() => safeShops.value.length > 1)

// The dashboard is gated like every other module: a user the owner limited
// to, say, inventory does not get a Dashboard link that only answers
// "owner, admin, manager only".
const showDashboard = computed(() => canShowModule('dashboard', currentUser.value))

const visibleGroups = computed<MenuGroupConfig[]>(() =>
  adminMenuGroups
    .map((group) => ({
      ...group,
      items: getVisibleMenuItems(group.items, currentUser.value),
    }))
    .filter((group) => group.items.length > 0)
)

const menuLabel = (key: string, fallback: string) => translatedGroupLabel({ t, te }, key, fallback)
const itemLabel = (key: string, fallback: string) => translatedModuleLabel({ t, te }, key, fallback)

const menuBadge = (key: string) => {
  if (key === 'orders' && pendingOrderCount.value > 0) return pendingOrderCount.value
  if (key === 'inventory_counts' && stockAlertCount.value > 0) return stockAlertCount.value
  return 0
}

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
    :aria-label="t('menu.navigation')"
  >
    <div class="brand-box">
      <div class="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M4.2,5.2 L12,19.4 L19.8,5.2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- The shop's own name, where the product name used to be: an owner
           knows they are using Valora, but needs to see which shop they are
           in, next to the menu it applies to rather than up in the top bar. -->
      <div v-if="!isCollapsed" class="brand-text">
        <h2 class="logo" :title="displayShopName">{{ displayShopName }}</h2>
        <p class="brand-subtitle">{{ t('adminPanel') }}</p>
      </div>
    </div>

    <div v-if="!isCollapsed && showShopSwitcher" class="shop-switcher">
      <label class="shop-label" for="sidebar-shop">{{ t('shop') }}</label>
      <select
        id="sidebar-shop"
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
      <RouterLink
        v-if="showDashboard"
        to="/dashboard"
        class="menu-link dashboard-link"
        :title="isCollapsed ? t('menu.dashboard') : undefined"
        @click="emit('close-mobile')"
      >
        <ModuleIcon module="dashboard" :size="34" />
        <span v-if="!isCollapsed" class="menu-text">{{ t('menu.dashboard') }}</span>
      </RouterLink>

      <div
        v-for="group in visibleGroups"
        :key="group.key"
        class="menu-section"
      >
        <button
          v-if="!isCollapsed"
          class="group-toggle"
          type="button"
          :aria-expanded="openGroups[group.key] ? 'true' : 'false'"
          @click="emit('toggle-group', group.key)"
        >
          <span>{{ menuLabel(group.key, group.label) }}</span>
          <svg class="chevron" :class="{ open: openGroups[group.key] }" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M6,9 L12,15 L18,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div v-else class="group-divider" aria-hidden="true"></div>

        <div v-show="openGroups[group.key] || isCollapsed" class="group-items">
          <RouterLink
            v-for="item in group.items"
            :key="item.key"
            :to="item.route || '/dashboard'"
            class="menu-link"
            :title="isCollapsed ? itemLabel(item.key, item.label) : undefined"
            @click="emit('close-mobile')"
          >
            <ModuleIcon :module="item.key" :size="30" />
            <span v-if="!isCollapsed" class="menu-text">{{ itemLabel(item.key, item.label) }}</span>
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

    <button
      type="button"
      class="collapse-toggle"
      :aria-label="isCollapsed ? t('menu.expandSidebar') : t('menu.collapseSidebar')"
      :title="isCollapsed ? t('menu.expandSidebar') : t('menu.collapseSidebar')"
      @click="emit('toggle-collapse')"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" :class="{ flipped: isCollapsed }">
        <path d="M15,6 L9,12 L15,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span v-if="!isCollapsed">{{ t('menu.collapseSidebar') }}</span>
    </button>
  </aside>

  <div v-if="isMobileOpen" class="sidebar-overlay" @click="emit('close-mobile')" />
</template>

<style scoped>
.sidebar {
  width: 276px;
  min-width: 276px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: var(--text-primary);
  padding: 16px 12px 12px;
  border-right: 1px solid var(--stroke-soft);
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 30;
  transition: width 0.25s ease, min-width 0.25s ease, transform 0.25s ease;
  scrollbar-width: thin;
}

.sidebar.dark {
  background: #0f0a1a;
  color: #f4f0fb;
  border-right-color: rgba(255, 255, 255, 0.06);
}

.sidebar.collapsed {
  width: 78px;
  min-width: 78px;
}

/* ---------- brand */
.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 14px;
  border-radius: 16px;
  background: var(--brand-gradient);
  color: #fff;
  box-shadow: var(--brand-shadow);
}

.sidebar.collapsed .brand-box {
  justify-content: center;
  padding: 10px 0;
}

.brand-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

/* Without this the name cannot shrink inside the flex row, so a long one
   pushes the box wider instead of being cut short. */
.brand-text {
  min-width: 0;
}

.logo {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.2px;
  /* Shop names are written by their owners and can be long; the full name is
     on the element's title attribute. */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-subtitle {
  margin: 1px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* ---------- shop */
.shop-switcher {
  margin: 0 4px 14px;
}

.shop-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.shop-select {
  width: 100%;
  border: 1px solid var(--stroke);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 14px;
  outline: none;
  background: var(--surface-subtle);
  color: var(--text-primary);
}

.shop-select:focus {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(98, 4, 191, 0.12);
}

.sidebar.dark .shop-select {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.1);
}

/* ---------- menu */
.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.menu-section {
  display: flex;
  flex-direction: column;
}

.group-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
}

.group-toggle:hover {
  color: var(--brand-600);
  background: var(--brand-25);
}

.sidebar.dark .group-toggle {
  color: #8f86a3;
}

.sidebar.dark .group-toggle:hover {
  color: #d7b3fa;
  background: rgba(98, 4, 191, 0.14);
}

.chevron {
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
}

.chevron.open {
  transform: rotate(0deg);
}

.group-divider {
  height: 1px;
  margin: 8px 14px;
  background: var(--stroke-soft);
}

.sidebar.dark .group-divider {
  background: rgba(255, 255, 255, 0.08);
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 10px;
  border-radius: 12px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar.collapsed .menu-link {
  justify-content: center;
  padding: 7px 0;
}

.menu-link:hover {
  background: var(--surface-subtle);
  color: var(--text-primary);
}

.menu-link:hover :deep(.module-icon) {
  transform: scale(1.06);
}

.menu-link.router-link-active {
  background: var(--brand-50);
  color: var(--brand-700);
}

.menu-link.router-link-active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 8px;
  bottom: 8px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: var(--brand-600);
}

.sidebar.dark .menu-link {
  color: #d9d3e6;
}

.sidebar.dark .menu-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.sidebar.dark .menu-link.router-link-active {
  background: rgba(98, 4, 191, 0.24);
  color: #fff;
}

.dashboard-link {
  margin-bottom: 2px;
}

.menu-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-badge {
  margin-left: auto;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.sidebar.collapsed .menu-badge {
  position: absolute;
  top: 2px;
  right: 10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
}

.menu-badge.success {
  background: #dcfce7;
  color: #166534;
}

.menu-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

/* ---------- collapse */
.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  border: 1px solid var(--stroke-soft);
  border-radius: 12px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.collapse-toggle:hover {
  color: var(--brand-600);
  border-color: var(--brand-100);
  background: var(--brand-25);
}

.collapse-toggle svg {
  transition: transform 0.2s ease;
}

.collapse-toggle svg.flipped {
  transform: rotate(180deg);
}

.sidebar.dark .collapse-toggle {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: #b9b0cc;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 10, 26, 0.45);
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

  .collapse-toggle {
    display: none;
  }
}
</style>
