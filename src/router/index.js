import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import LoginView from '@/views/LoginView.vue'
import { canAccessMenu, routeMenuKeys } from '@/utils/menuPermissions'

const DashboardView = () => import('@/views/dashboard/DashboardView.vue')
const ProductsView = () => import('@/views/products/ProductsView.vue')
const OrdersView = () => import('@/views/orders/OrdersView.vue')
const CustomersView = () => import('@/views/customers/CustomersView.vue')
const SuppliersView = () => import('@/views/suppliers/SuppliersView.vue')
const ExpensesView = () => import('@/views/expenses/ExpensesView.vue')
const BankAccountsView = () => import('@/views/finance/BankAccountsView.vue')
const BankLedgersView = () => import('@/views/finance/BankLedgersView.vue')
const CategoriesView = () => import('@/views/categories/CategoriesView.vue')
const UnitsView = () => import('@/views/units/UnitsView.vue')
const UsersView = () => import('@/views/users/UsersView.vue')
const InventoryCountsView = () => import('@/views/inventory/InventoryCountsView.vue')
const ProductReturnsView = () => import('@/views/returns/ProductReturnsView.vue')
const TransferStocksView = () => import('@/views/transfers/TransferStocksView.vue')
const WarehouseStocksView = () => import('@/views/warehouses/WarehouseStocksView.vue')
const PurchasesView = () => import('@/views/purchases/PurchasesView.vue')
const ShiftsView = () => import('@/views/shifts/ShiftsView.vue')
const StockAdjustmentsView = () => import('@/views/stock/StockAdjustmentsView.vue')
const StockMovementsView = () => import('@/views/stock/StockMovementsView.vue')
const ReportsView = () => import('@/views/reports/ReportsView.vue')
const SettingsView = () => import('@/views/settings/SettingsView.vue')
const VehiclesView = () => import('@/views/workshop/VehiclesView.vue')
const MechanicsView = () => import('@/views/workshop/MechanicsView.vue')
const WorkOrdersView = () => import('@/views/workshop/WorkOrdersView.vue')
const ServiceHistoryView = () => import('@/views/workshop/ServiceHistoryView.vue')
const ServicePackagesView = () => import('@/views/workshop/ServicePackagesView.vue')
const BookingsView = () => import('@/views/workshop/BookingsView.vue')

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
        path: 'warehouses',
        name: 'warehouses',
        component: () => import('@/views/warehouses/WarehousesView.vue'),
        meta: { title: 'Warehouses', section: 'inventory' },
      },
      {
        path: 'transfer-stocks',
        name: 'transfer-stocks',
        component: TransferStocksView,
        meta: { title: 'Transfer Stocks', section: 'inventory' },
      },
      {
        path: 'warehouse-stocks',
        name: 'warehouse-stocks',
        component: WarehouseStocksView,
        meta: { title: 'Warehouse Stocks', section: 'inventory' },
      },
      {
        path: 'vehicles',
        name: 'vehicles',
        component: VehiclesView,
        meta: { title: 'Vehicles', section: 'workshop' },
      },
      {
        path: 'mechanics',
        name: 'mechanics',
        component: MechanicsView,
        meta: { title: 'Mechanics', section: 'workshop' },
      },
      {
        path: 'work-orders',
        name: 'work-orders',
        component: WorkOrdersView,
        meta: { title: 'Work Orders', section: 'workshop' },
      },
      {
        path: 'service-history',
        name: 'service-history',
        component: ServiceHistoryView,
        meta: { title: 'Service History', section: 'workshop' },
      },
      {
        path: 'service-packages',
        name: 'service-packages',
        component: ServicePackagesView,
        meta: { title: 'Service Packages', section: 'workshop' },
      },
      {
        path: 'bookings',
        name: 'bookings',
        component: BookingsView,
        meta: { title: 'Bookings', section: 'workshop' },
      },
      {
        path: 'reports',
        name: 'reports',
        component: ReportsView,
        meta: { title: 'Reports', section: 'reports' },
      },
      {
        path: 'reports/dashboard-summary',
        name: 'reports-dashboard-summary',
        component: ReportsView,
        meta: { title: 'Dashboard Summary', section: 'reports' },
      },
      {
        path: 'reports/sales',
        name: 'reports-sales',
        component: ReportsView,
        meta: { title: 'Sales Report', section: 'reports' },
      },
      {
        path: 'reports/sales-items',
        name: 'reports-sales-items',
        component: ReportsView,
        meta: { title: 'Sales Items Report', section: 'reports' },
      },
      {
        path: 'reports/payments',
        name: 'reports-payments',
        component: ReportsView,
        meta: { title: 'Payment Report', section: 'reports' },
      },
      {
        path: 'reports/expenses',
        name: 'reports-expenses',
        component: ReportsView,
        meta: { title: 'Expense Report', section: 'reports' },
      },
      {
        path: 'reports/stock',
        name: 'reports-stock',
        component: ReportsView,
        meta: { title: 'Stock Report', section: 'reports' },
      },
      {
        path: 'reports/low-stock',
        name: 'reports-low-stock',
        component: ReportsView,
        meta: { title: 'Low Stock Report', section: 'reports' },
      },
      {
        path: 'reports/shifts',
        name: 'reports-shifts',
        component: ReportsView,
        meta: { title: 'Shift Report', section: 'reports' },
      },
      {
        path: 'sales-report',
        name: 'sales-report',
        component: ReportsView,
        meta: { title: 'Sales Report', section: 'reports' },
      },
      {
        path: 'expense-report',
        name: 'expense-report',
        component: ReportsView,
        meta: { title: 'Expense Report', section: 'reports' },
      },
      {
        path: 'sales-chart',
        name: 'sales-chart',
        component: ReportsView,
        meta: { title: 'Sales Chart', section: 'reports' },
      },
      {
        path: 'expense-chart',
        name: 'expense-chart',
        component: ReportsView,
        meta: { title: 'Expense Chart', section: 'reports' },
      },
      {
        path: 'bank-accounts',
        name: 'bank-accounts',
        component: BankAccountsView,
        meta: { title: 'Bank Accounts', section: 'finance' },
      },
      {
        path: 'bank-ledgers',
        name: 'bank-ledgers',
        component: BankLedgersView,
        meta: { title: 'Bank Ledgers', section: 'finance' },
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

  if (to.meta.requiresAuth || to.matched.some((record) => record.meta.requiresAuth)) {
    const routeName = String(to.name || '')
    const menuKeys = routeMenuKeys[routeName]

    if (menuKeys) {
      const userRaw = localStorage.getItem('user')
      let user = null

      try {
        user = userRaw ? JSON.parse(userRaw) : null
      } catch {
        user = null
      }

      if (!canAccessMenu(user, menuKeys)) {
        sessionStorage.setItem(
          'module_access_message',
          'This module is not available for your business type, plan, or role.'
        )
        return '/dashboard'
      }
    }
  }

  const pageTitle = to.meta?.title
    ? `${to.meta.title} | ValdKerPOS Admin`
    : 'ValdKerPOS Admin'

  document.title = pageTitle

  return true
})

export default router
