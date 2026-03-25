<script setup>
import { ref } from 'vue'

const openGroups = ref({
  sales: true,
  inventory: true,
  people: true,
  finance: true,
  reports: true,
})

const toggleGroup = (group) => {
  openGroups.value[group] = !openGroups.value[group]
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand-box">
        <div class="brand-icon">V</div>
        <div class="brand-text">
          <h2 class="logo">ValdKerPOS</h2>
          <p class="brand-subtitle">Admin Panel</p>
        </div>
      </div>

      <nav class="menu">
        <!-- MAIN -->
        <div class="menu-section">
          <p class="menu-title">MAIN</p>

          <RouterLink to="/dashboard" class="menu-link">
            <span class="menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v8h8V3h-8zM3 21h8v-6H3v6z"/>
              </svg>
            </span>
            <span>Dashboard</span>
          </RouterLink>
        </div>

        <!-- SALES -->
        <div class="menu-section">
          <button class="group-toggle" @click="toggleGroup('sales')">
            <span>SALES</span>
            <span class="chevron" :class="{ open: openGroups.sales }">⌄</span>
          </button>

          <div v-show="openGroups.sales" class="group-items">
            <RouterLink to="/orders" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2h12l1 7H5l1-7zM5 9h14v11H5z"/>
                </svg>
              </span>
              <span>Orders</span>
            </RouterLink>

            <RouterLink to="/product-returns" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 14l-4-4 4-4"/>
                  <path d="M5 10h10a4 4 0 1 1 0 8h-1"/>
                </svg>
              </span>
              <span>Product Returns</span>
            </RouterLink>

            <RouterLink to="/shifts" class="menu-link">
              <span class="menu-icon">
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
          <button class="group-toggle" @click="toggleGroup('inventory')">
            <span>INVENTORY</span>
            <span class="chevron" :class="{ open: openGroups.inventory }">⌄</span>
          </button>

          <div v-show="openGroups.inventory" class="group-items">
            <RouterLink to="/products" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7l9-4 9 4-9 4-9-4z"/>
                  <path d="M3 7v10l9 4 9-4V7"/>
                  <path d="M12 11v10"/>
                </svg>
              </span>
              <span>Products</span>
            </RouterLink>

            <RouterLink to="/categories" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 7h16M4 12h10M4 17h7"/>
                </svg>
              </span>
              <span>Categories</span>
            </RouterLink>

            <RouterLink to="/units" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 20h16M7 20V8m5 12V4m5 16v-9"/>
                </svg>
              </span>
              <span>Units</span>
            </RouterLink>

            <RouterLink to="/purchases" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6h15l-1.5 9h-12z"/>
                  <path d="M6 6L5 3H2"/>
                  <circle cx="9" cy="20" r="1"/>
                  <circle cx="18" cy="20" r="1"/>
                </svg>
              </span>
              <span>Purchases</span>
            </RouterLink>

            <RouterLink to="/inventory-counts" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </span>
              <span>Inventory Counts</span>
            </RouterLink>

            <RouterLink to="/stock-adjustments" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </span>
              <span>Stock Adjustments</span>
            </RouterLink>

            <RouterLink to="/stock-movements" class="menu-link">
              <span class="menu-icon">
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
          <button class="group-toggle" @click="toggleGroup('people')">
            <span>PEOPLE</span>
            <span class="chevron" :class="{ open: openGroups.people }">⌄</span>
          </button>

          <div v-show="openGroups.people" class="group-items">
            <RouterLink to="/customers" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21a8 8 0 0 0-16 0"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span>Customers</span>
            </RouterLink>

            <RouterLink to="/suppliers" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l7-4 7 4v14"/>
                  <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/>
                </svg>
              </span>
              <span>Suppliers</span>
            </RouterLink>

            <RouterLink to="/users" class="menu-link">
              <span class="menu-icon">
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
          <button class="group-toggle" @click="toggleGroup('finance')">
            <span>FINANCE</span>
            <span class="chevron" :class="{ open: openGroups.finance }">⌄</span>
          </button>

          <div v-show="openGroups.finance" class="group-items">
            <RouterLink to="/expenses" class="menu-link">
              <span class="menu-icon">
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
          <button class="group-toggle" @click="toggleGroup('reports')">
            <span>REPORTS</span>
            <span class="chevron" :class="{ open: openGroups.reports }">⌄</span>
          </button>

          <div v-show="openGroups.reports" class="group-items">
            <RouterLink to="/sales-report" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                </svg>
              </span>
              <span>Sales Report</span>
            </RouterLink>

            <RouterLink to="/expense-report" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                </svg>
              </span>
              <span>Expense Report</span>
            </RouterLink>

            <RouterLink to="/sales-chart" class="menu-link">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M7 14l4-4 3 3 5-6"/>
                </svg>
              </span>
              <span>Sales Chart</span>
            </RouterLink>

            <RouterLink to="/expense-chart" class="menu-link">
              <span class="menu-icon">
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

    <main class="main-content">
      <header class="topbar">
        <h1>Admin Panel</h1>
      </header>

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

/* SIDEBAR */

.sidebar {
  width: 290px;
  background: #ffffff;
  color: #111827;
  padding: 18px 14px;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100vh;
}

/* BRAND */

.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 20px;
  border-radius: 14px;
  background: #f0fdf4;
  border:1px solid #dcfce7;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  background: linear-gradient(
    135deg,
    #60E66C,
    #059814
  );

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
  color:#16a34a;

}

/* MENU */

.menu {

  display:flex;
  flex-direction:column;
  gap:14px;

}

.menu-section {

  padding-bottom:10px;

}

/* TITLE */

.menu-title {

  font-size:11px;
  font-weight:700;
  color:#9ca3af;

  margin:0 0 8px;

  padding:0 10px;

  letter-spacing:1.2px;

}

/* GROUP BUTTON */

.group-toggle {

  width:100%;

  background:transparent;

  border:none;

  color:#6b7280;

  display:flex;

  align-items:center;

  justify-content:space-between;

  padding:8px 10px;

  font-size:11px;

  font-weight:700;

  letter-spacing:1.2px;

  cursor:pointer;

  border-radius:10px;

}

.group-toggle:hover{

background:#f0fdf4;

color:#059814;

}

/* CHEVRON */

.chevron{

transition:0.2s;

font-size:14px;

}

.chevron.open{

transform:rotate(180deg);

}

/* ITEMS */

.group-items{

margin-top:8px;

}

/* MENU LINK */

.menu-link{

display:flex;

align-items:center;

gap:10px;

color:#374151;

text-decoration:none;

padding:10px 12px;

border-radius:12px;

margin-bottom:4px;

transition:0.2s;

}

/* HOVER */

.menu-link:hover{

background:#f0fdf4;

color:#059814;

transform:translateX(2px);

}

/* ACTIVE */

.menu-link.router-link-active{

background:linear-gradient(
90deg,
#60E66C,
#059814
);

color:white;

box-shadow:0 6px 14px rgba(5,152,20,0.25);

}

/* ICON */

.menu-icon{

width:18px;

height:18px;

display:inline-flex;

align-items:center;

justify-content:center;

flex-shrink:0;

}

.menu-icon svg{

width:18px;

height:18px;

}

/* CONTENT */

.main-content{

flex:1;

display:flex;

flex-direction:column;

min-width:0;

}

/* TOPBAR */

.topbar{

background:white;

padding:18px 24px;

border-bottom:1px solid #e5e7eb;

display:flex;

align-items:center;

justify-content:space-between;

}

.topbar h1{

margin:0;

font-size:20px;

font-weight:700;

color:#059814;

}

/* PAGE */

.page-content{

padding:24px;

}
</style>