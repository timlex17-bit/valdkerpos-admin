<script setup lang="ts">
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

const props = defineProps<{
  isCollapsed: boolean
  isMobileOpen: boolean
  isDark: boolean
  openGroups: OpenGroups
  stockAlertCount: number
  pendingOrderCount: number
  shops: Shop[]
  currentShop: Shop | null
}>()

const emit = defineEmits<{
  (e: 'toggle-group', group: keyof OpenGroups): void
  (e: 'close-mobile'): void
  (e: 'toggle-collapse'): void
  (e: 'change-shop', shopId: string): void
}>()

const handleShopChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('change-shop', target.value)
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: isCollapsed,
      mobileOpen: isMobileOpen,
      dark: isDark
    }"
  >
    <div class="sidebar-top">
      <div class="brand-box">
        <div class="brand-icon">V</div>

        <div v-if="!isCollapsed" class="brand-text">
          <h2 class="logo">ValdKerPOS</h2>
          <p class="brand-subtitle">Admin Panel</p>
        </div>
      </div>

      <button class="collapse-btn" @click="$emit('toggle-collapse')">
        {{ isCollapsed ? '→' : '←' }}
      </button>
    </div>

    <div v-if="!isCollapsed" class="shop-switcher">
      <label class="shop-label">Shop</label>
      <select class="shop-select" :value="currentShop?.id" @change="handleShopChange">
        <option v-for="shop in shops" :key="shop.id" :value="shop.id">
          {{ shop.name }}
        </option>
      </select>
    </div>

    <nav class="menu">
      <!-- MAIN -->
      <div class="menu-section">
        <p v-if="!isCollapsed" class="menu-title">MAIN</p>

        <RouterLink to="/dashboard" class="menu-link" @click="$emit('close-mobile')">
          <span class="menu-icon dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v8h8V3h-8zM3 21h8v-6H3v6z"/>
            </svg>
          </span>
          <span v-if="!isCollapsed">Dashboard</span>
        </RouterLink>
      </div>

      <!-- SALES -->
      <div class="menu-section">
        <button class="group-toggle" @click="$emit('toggle-group', 'sales')">
          <span v-if="!isCollapsed">SALES</span>
          <span v-else>•</span>
          <span v-if="!isCollapsed" class="chevron" :class="{ open: openGroups.sales }">⌄</span>
        </button>

        <div v-show="openGroups.sales && !isCollapsed" class="group-items">
          <RouterLink to="/orders" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon orders">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2h12l1 7H5l1-7zM5 9h14v11H5z"/>
              </svg>
            </span>
            <span>Orders</span>
            <span v-if="pendingOrderCount > 0" class="menu-badge warning">
              {{ pendingOrderCount }}
            </span>
          </RouterLink>

          <RouterLink to="/purchases" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon purchases">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 6h15l-1.5 9h-12z"/>
                <path d="M6 6L5 3H2"/>
                <circle cx="9" cy="20" r="1"/>
                <circle cx="18" cy="20" r="1"/>
              </svg>
            </span>
            <span>Purchases</span>
          </RouterLink>

          <RouterLink to="/product-returns" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon returns">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 14l-4-4 4-4"/>
                <path d="M5 10h10a4 4 0 1 1 0 8h-1"/>
              </svg>
            </span>
            <span>Product Returns</span>
          </RouterLink>

          <RouterLink to="/shifts" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon shifts">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7v5l3 3"/>
              </svg>
            </span>
            <span>Shifts</span>
          </RouterLink>
        </div>
      </div>

      <!-- INVENTORY -->
      <div class="menu-section">
        <button class="group-toggle" @click="$emit('toggle-group', 'inventory')">
          <span v-if="!isCollapsed">INVENTORY</span>
          <span v-else>•</span>
          <span v-if="!isCollapsed" class="chevron" :class="{ open: openGroups.inventory }">⌄</span>
        </button>

        <div v-show="openGroups.inventory && !isCollapsed" class="group-items">
          <RouterLink to="/products" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon products">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7l9-4 9 4-9 4-9-4z"/>
                <path d="M3 7v10l9 4 9-4V7"/>
                <path d="M12 11v10"/>
              </svg>
            </span>
            <span>Products</span>
          </RouterLink>

          <RouterLink to="/categories" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon categories">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7h16M4 12h10M4 17h7"/>
              </svg>
            </span>
            <span>Categories</span>
          </RouterLink>

          <RouterLink to="/units" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon units">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 20h16M7 20V8m5 12V4m5 16v-9"/>
              </svg>
            </span>
            <span>Units</span>
          </RouterLink>

          <RouterLink to="/inventory-counts" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon inventory">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </span>
            <span>Inventory Counts</span>
            <span v-if="stockAlertCount > 0" class="menu-badge success">
              {{ stockAlertCount }}
            </span>
          </RouterLink>

          <RouterLink to="/stock-adjustments" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon adjustments">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </span>
            <span>Stock Adjustments</span>
          </RouterLink>

          <RouterLink to="/stock-movements" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon movements">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 7h11v11"/>
                <path d="M7 17L18 6"/>
              </svg>
            </span>
            <span>Stock Movements</span>
          </RouterLink>
        </div>
      </div>

      <!-- PEOPLE -->
      <div class="menu-section">
        <button class="group-toggle" @click="$emit('toggle-group', 'people')">
          <span v-if="!isCollapsed">PEOPLE</span>
          <span v-else>•</span>
          <span v-if="!isCollapsed" class="chevron" :class="{ open: openGroups.people }">⌄</span>
        </button>

        <div v-show="openGroups.people && !isCollapsed" class="group-items">
          <RouterLink to="/customers" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon customers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21a8 8 0 0 0-16 0"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span>Customers</span>
          </RouterLink>

          <RouterLink to="/suppliers" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon suppliers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18"/>
                <path d="M5 21V7l7-4 7 4v14"/>
                <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/>
              </svg>
            </span>
            <span>Suppliers</span>
          </RouterLink>

          <RouterLink to="/users" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <span>Users</span>
          </RouterLink>
        </div>
      </div>

      <!-- FINANCE -->
      <div class="menu-section">
        <button class="group-toggle" @click="$emit('toggle-group', 'finance')">
          <span v-if="!isCollapsed">FINANCE</span>
          <span v-else>•</span>
          <span v-if="!isCollapsed" class="chevron" :class="{ open: openGroups.finance }">⌄</span>
        </button>

        <div v-show="openGroups.finance && !isCollapsed" class="group-items">
          <RouterLink to="/expenses" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon expenses">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="6" width="18" height="12" rx="2"/>
                <path d="M3 10h18"/>
              </svg>
            </span>
            <span>Expenses</span>
          </RouterLink>
        </div>
      </div>

      <!-- REPORTS -->
      <div class="menu-section">
        <button class="group-toggle" @click="$emit('toggle-group', 'reports')">
          <span v-if="!isCollapsed">REPORTS</span>
          <span v-else>•</span>
          <span v-if="!isCollapsed" class="chevron" :class="{ open: openGroups.reports }">⌄</span>
        </button>

        <div v-show="openGroups.reports && !isCollapsed" class="group-items">
          <RouterLink to="/sales-report" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon reports">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
              </svg>
            </span>
            <span>Sales Report</span>
          </RouterLink>

          <RouterLink to="/expense-report" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon expense-report">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
            </span>
            <span>Expense Report</span>
          </RouterLink>

          <RouterLink to="/sales-chart" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon sales-chart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"/>
                <path d="M7 14l4-4 3 3 5-6"/>
              </svg>
            </span>
            <span>Sales Chart</span>
          </RouterLink>

          <RouterLink to="/expense-chart" class="menu-link" @click="$emit('close-mobile')">
            <span class="menu-icon expense-chart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19V5M10 19V9M16 19V12M22 19V7"/>
              </svg>
            </span>
            <span>Expense Chart</span>
          </RouterLink>
        </div>
      </div>
    </nav>
  </aside>

  <div
    v-if="isMobileOpen"
    class="sidebar-overlay"
    @click="$emit('close-mobile')"
  />
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
  border-right: 1px solid rgba(255,255,255,0.08);
}

.sidebar.collapsed {
  width: 88px;
  min-width: 88px;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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
  flex: 1;
}

.sidebar.dark .brand-box {
  background: rgba(96, 230, 108, 0.08);
  border-color: rgba(96, 230, 108, 0.18);
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #60E66C, #059814);
  color: white;
  font-weight: 800;
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

.sidebar.dark .brand-subtitle {
  color: #86efac;
}

.collapse-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}

.sidebar.dark .collapse-btn {
  background: #111827;
  color: #fff;
  border-color: rgba(255,255,255,0.1);
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

.sidebar.dark .shop-label {
  color: #cbd5e1;
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
  border-color: rgba(255,255,255,0.1);
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
}

.group-toggle:hover {
  background: #f0fdf4;
  color: #059814;
}

.sidebar.dark .group-toggle {
  color: #cbd5e1;
}

.sidebar.dark .group-toggle:hover {
  background: rgba(96, 230, 108, 0.08);
  color: #60E66C;
}

.chevron {
  transition: transform 0.2s ease;
  font-size: 14px;
}

.chevron.open {
  transform: rotate(180deg);
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
  background: linear-gradient(90deg, #60E66C, #059814);
  color: white;
  box-shadow: 0 6px 14px rgba(5, 152, 20, 0.25);
}

.sidebar.dark .menu-link {
  color: #e5e7eb;
}

.sidebar.dark .menu-link:hover {
  background: rgba(96, 230, 108, 0.08);
  color: #60E66C;
}

.menu-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon svg {
  width: 18px;
  height: 18px;
}

.menu-icon.dashboard { color: #059814; }
.menu-icon.orders { color: #f59e0b; }
.menu-icon.purchases { color: #0ea5e9; }
.menu-icon.returns { color: #ef4444; }
.menu-icon.shifts { color: #8b5cf6; }
.menu-icon.products { color: #059814; }
.menu-icon.categories { color: #14b8a6; }
.menu-icon.units { color: #6366f1; }
.menu-icon.inventory { color: #16a34a; }
.menu-icon.adjustments { color: #f97316; }
.menu-icon.movements { color: #06b6d4; }
.menu-icon.customers { color: #ec4899; }
.menu-icon.suppliers { color: #3b82f6; }
.menu-icon.users { color: #64748b; }
.menu-icon.expenses { color: #dc2626; }
.menu-icon.reports { color: #22c55e; }
.menu-icon.expense-report { color: #ef4444; }
.menu-icon.sales-chart { color: #10b981; }
.menu-icon.expense-chart { color: #f97316; }

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

.sidebar.dark .menu-badge.success {
  background: rgba(34, 197, 94, 0.16);
  color: #bbf7d0;
}

.sidebar.dark .menu-badge.warning {
  background: rgba(245, 158, 11, 0.18);
  color: #fde68a;
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
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
  }

  .sidebar.mobileOpen {
    transform: translateX(0);
  }
}
</style>