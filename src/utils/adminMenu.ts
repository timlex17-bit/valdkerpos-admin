import type { MenuItemConfig } from './moduleVisibility'

export type MenuGroupConfig = {
  key: string
  label: string
  items: MenuItemConfig[]
}

/**
 * Navigation only: which backend module key lands on which dashboard route,
 * plus an English label used when the contract and the i18n bundle have
 * nothing better.
 *
 * Deliberately carries no `plan` and no `businessTypes`. Those used to live
 * here as a second copy of the backend's rules and drifted - workshop modules
 * were listed as PRO while the backend has always had them at BASIC, so every
 * BASIC workshop shop lost its entire Workshop menu. Gating now comes from
 * `GET /api/modules/` alone.
 */
export const adminMenuGroups: MenuGroupConfig[] = [
  {
    key: 'sales',
    label: 'Sales',
    items: [
      { key: 'orders', label: 'Orders', route: '/orders' },
      { key: 'purchases', label: 'Purchases', route: '/purchases' },
      { key: 'product_returns', label: 'Product Returns', route: '/product-returns' },
      { key: 'shifts', label: 'Shifts', route: '/shifts' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    items: [
      { key: 'products', label: 'Products', route: '/products' },
      { key: 'categories', label: 'Categories', route: '/categories' },
      { key: 'units', label: 'Units', route: '/units' },
      { key: 'inventory_counts', label: 'Inventory Counts', route: '/inventory-counts' },
      { key: 'stock_adjustments', label: 'Stock Adjustments', route: '/stock-adjustments' },
      { key: 'stock_movements', label: 'Stock Movements', route: '/stock-movements' },
      { key: 'warehouses', label: 'Warehouses', route: '/warehouses' },
      { key: 'warehouse_stocks', label: 'Warehouse Stocks', route: '/warehouse-stocks' },
      { key: 'stock_transfers', label: 'Stock Transfers', route: '/transfer-stocks' },
    ],
  },
  {
    key: 'workshop',
    label: 'Workshop',
    items: [
      { key: 'vehicles', label: 'Vehicles', route: '/vehicles' },
      { key: 'mechanics', label: 'Mechanics', route: '/mechanics' },
      { key: 'work_orders', label: 'Work Orders', route: '/work-orders' },
      { key: 'service_history', label: 'Service History', route: '/service-history' },
      { key: 'service_packages', label: 'Service Packages', route: '/service-packages' },
      { key: 'bookings', label: 'Bookings', route: '/bookings' },
    ],
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    items: [
      { key: 'tables', label: 'Tables', route: '/tables' },
      { key: 'waiters', label: 'Waiters', route: '/waiters' },
      { key: 'kitchen_display', label: 'Kitchen Display', route: '/kitchen-display' },
    ],
  },
  {
    key: 'people',
    label: 'People',
    items: [
      { key: 'customers', label: 'Customers', route: '/customers' },
      { key: 'suppliers', label: 'Suppliers', route: '/suppliers' },
      { key: 'staff', label: 'Users', route: '/users' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { key: 'expenses', label: 'Expenses', route: '/expenses' },
      { key: 'bank_accounts', label: 'Bank Accounts', route: '/bank-accounts' },
      { key: 'bank_ledgers', label: 'Bank Ledgers', route: '/bank-ledgers' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    items: [
      // Three ways in, not ten. The rest are tabs and links on the overview
      // page itself, so they are marked secondary: the sidebar hides them for
      // anyone who can open that page, and still lists them for a user the
      // owner granted one single report and nothing else.
      { key: 'reports', label: 'Overview', route: '/reports/dashboard-summary' },
      { key: 'sales_report', label: 'Sales Report', route: '/reports/sales' },
      { key: 'stock_report', label: 'Stock Report', route: '/reports/stock' },
      { key: 'sales_items_report', label: 'Sales Items', route: '/reports/sales-items', secondary: true },
      { key: 'payment_report', label: 'Payment Report', route: '/reports/payments', secondary: true },
      { key: 'expense_report', label: 'Expense Report', route: '/reports/expenses', secondary: true },
      { key: 'low_stock_report', label: 'Low Stock Report', route: '/reports/low-stock', secondary: true },
      { key: 'shift_report', label: 'Shift Report', route: '/reports/shifts', secondary: true },
      { key: 'sales_chart', label: 'Sales Chart', route: '/sales-chart', secondary: true },
      { key: 'expense_chart', label: 'Expense Chart', route: '/expense-chart', secondary: true },
    ],
  },
  {
    key: 'system-tools',
    label: 'System Tools',
    items: [
      { key: 'backup_center', label: 'Backup & Restore', route: '/backup-center' },
      { key: 'import_master_data', label: 'Import Master Data', route: '/import-master-data' },
      { key: 'settings', label: 'Settings', route: '/settings' },
    ],
  },
]

export const allAdminMenuItems = adminMenuGroups.flatMap((group) => group.items)

/** Every module key the dashboard can actually navigate to. */
export const routableModuleKeys = allAdminMenuItems
  .filter((item) => Boolean(item.route))
  .map((item) => item.key)
