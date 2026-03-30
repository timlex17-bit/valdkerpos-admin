import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import LoginView from '@/views/LoginView.vue'

import DashboardView from '@/views/dashboard/DashboardView.vue'
import ProductsView from '@/views/products/ProductsView.vue'
import OrdersView from '@/views/orders/OrdersView.vue'
import CustomersView from '@/views/customers/CustomersView.vue'
import SuppliersView from '@/views/suppliers/SuppliersView.vue'
import ExpensesView from '@/views/expenses/ExpensesView.vue'
import BankAccountsView from '@/views/finance/BankAccountsView.vue'
import BankLedgersView from '@/views/finance/BankLedgersView.vue'
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
    meta: {
      guestOnly: true,
      title: 'Login',
    },
  },

  {
    path: '/',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },

      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard', section: 'main' },
      },
      {
        path: 'customers',
        name: 'customers',
        component: CustomersView,
        meta: { title: 'Customers', section: 'people' },
      },
      {
        path: 'suppliers',
        name: 'suppliers',
        component: SuppliersView,
        meta: { title: 'Suppliers', section: 'people' },
      },
      {
        path: 'products',
        name: 'products',
        component: ProductsView,
        meta: { title: 'Products', section: 'inventory' },
      },
      {
        path: 'orders',
        name: 'orders',
        component: OrdersView,
        meta: { title: 'Orders', section: 'sales' },
      },
      {
        path: 'expenses',
        name: 'expenses',
        component: ExpensesView,
        meta: { title: 'Expenses', section: 'finance' },
      },


      
      {
        path: 'categories',
        name: 'categories',
        component: CategoriesView,
        meta: { title: 'Categories', section: 'inventory' },
      },
      {
        path: 'units',
        name: 'units',
        component: UnitsView,
        meta: { title: 'Units', section: 'inventory' },
      },
      {
        path: 'users',
        name: 'users',
        component: UsersView,
        meta: { title: 'Users', section: 'people' },
      },
      {
        path: 'inventory-counts',
        name: 'inventory-counts',
        component: InventoryCountsView,
        meta: { title: 'Inventory Counts', section: 'inventory' },
      },
      {
        path: 'product-returns',
        name: 'product-returns',
        component: ProductReturnsView,
        meta: { title: 'Product Returns', section: 'sales' },
      },
      {
        path: 'purchases',
        name: 'purchases',
        component: PurchasesView,
        meta: { title: 'Purchases', section: 'sales' },
      },
      {
        path: 'shifts',
        name: 'shifts',
        component: ShiftsView,
        meta: { title: 'Shifts', section: 'sales' },
      },
      {
        path: 'stock-adjustments',
        name: 'stock-adjustments',
        component: StockAdjustmentsView,
        meta: { title: 'Stock Adjustments', section: 'inventory' },
      },
      {
        path: 'stock-movements',
        name: 'stock-movements',
        component: StockMovementsView,
        meta: { title: 'Stock Movements', section: 'inventory' },
      },
      {
        path: 'sales-report',
        name: 'sales-report',
        component: SalesReportView,
        meta: { title: 'Sales Report', section: 'reports' },
      },
      {
        path: 'expense-report',
        name: 'expense-report',
        component: ExpenseReportView,
        meta: { title: 'Expense Report', section: 'reports' },
      },
      {
        path: 'sales-chart',
        name: 'sales-chart',
        component: SalesChartView,
        meta: { title: 'Sales Chart', section: 'reports' },
      },
      {
        path: 'expense-chart',
        name: 'expense-chart',
        component: ExpenseChartView,
        meta: { title: 'Expense Chart', section: 'reports' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
        meta: { title: 'Settings', section: 'settings' },
      },

      {
        path: 'backup-center',
        name: 'backup-center',
        component: () => import('@/views/backup/BackupCenterView.vue'),
        meta: { title: 'Backup Center', section: 'system-tools' },
      },
      {
        path: 'import-master-data',
        name: 'import-master-data',
        component: () => import('@/views/import/ImportMasterDataView.vue'),
        meta: { title: 'Import Master Data', section: 'system-tools' },
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return {
      path: '/login',
      query: to.fullPath !== '/login' ? { redirect: to.fullPath } : {},
    }
  }

  if (to.meta.guestOnly && token) {
    return '/dashboard'
  }

  const pageTitle = to.meta?.title
    ? `${to.meta.title} | ValdKerPOS Admin`
    : 'ValdKerPOS Admin'

  document.title = pageTitle

  return true
})

export default router