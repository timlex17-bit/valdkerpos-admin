import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import LoginView from '@/views/LoginView.vue'

import DashboardView from '@/views/dashboard/DashboardView.vue'
import ProductsView from '@/views/products/ProductsView.vue'
import OrdersView from '@/views/orders/OrdersView.vue'
import CustomersView from '@/views/customers/CustomersView.vue'
import SuppliersView from '@/views/suppliers/SuppliersView.vue'
import ExpensesView from '@/views/expenses/ExpensesView.vue'
import CategoriesView from '@/views/categories/CategoriesView.vue'
import UnitsView from '@/views/units/UnitsView.vue'
import UsersView from '@/views/users/UsersView.vue'
import InventoryCountsView from '@/views/inventory/InventoryCountsView.vue'
import ProductReturnsView from '@/views/returns/ProductReturnsView.vue'
import PurchasesView from '@/views/purchases/PurchasesView.vue'
import ShiftsView from '@/views/shifts/ShiftsView.vue'
import StockAdjustmentsView from '@/views/stock/StockAdjustmentsView.vue'
import StockMovementsView from '@/views/stock/StockMovementsView.vue'

import SalesReportView from '@/views/reports/SalesReportView.vue'
import ExpenseReportView from '@/views/reports/ExpenseReportView.vue'
import SalesChartView from '@/views/reports/SalesChartView.vue'
import ExpenseChartView from '@/views/reports/ExpenseChartView.vue'

import SettingsView from '@/views/settings/SettingsView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'dashboard', component: DashboardView },
      { path: 'customers', name: 'customers', component: CustomersView },
      { path: 'suppliers', name: 'suppliers', component: SuppliersView },
      { path: 'products', name: 'products', component: ProductsView },
      { path: 'orders', name: 'orders', component: OrdersView },
      { path: 'expenses', name: 'expenses', component: ExpensesView },
      { path: 'categories', name: 'categories', component: CategoriesView },
      { path: 'units', name: 'units', component: UnitsView },
      { path: 'users', name: 'users', component: UsersView },
      { path: 'inventory-counts', name: 'inventory-counts', component: InventoryCountsView },
      { path: 'product-returns', name: 'product-returns', component: ProductReturnsView },
      { path: 'purchases', name: 'purchases', component: PurchasesView },
      { path: 'shifts', name: 'shifts', component: ShiftsView },
      { path: 'stock-adjustments', name: 'stock-adjustments', component: StockAdjustmentsView },
      { path: 'stock-movements', name: 'stock-movements', component: StockMovementsView },
      { path: 'sales-report', name: 'sales-report', component: SalesReportView },
      { path: 'expense-report', name: 'expense-report', component: ExpenseReportView },
      { path: 'sales-chart', name: 'sales-chart', component: SalesChartView },
      { path: 'expense-chart', name: 'expense-chart', component: ExpenseChartView },
      { path: 'settings', name: 'settings', component: SettingsView },

      { 
        path: 'backup-center', 
        name: 'backup-center', 
        component: () => import('@/views/backup/BackupCenterView.vue'),
      },
      { 
        path: 'import-master-data', 
        name: 'import-master-data', 
        component: () => import('@/views/import/ImportMasterDataView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return '/login'
  }

  if (to.meta.guestOnly && token) {
    return '/dashboard'
  }

  return true
})

export default router