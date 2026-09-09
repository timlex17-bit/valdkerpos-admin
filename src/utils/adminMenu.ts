import type { MenuItemConfig } from './moduleVisibility'

export type MenuGroupConfig = {
  key: string
  label: string
  items: MenuItemConfig[]
}

export const adminMenuGroups: MenuGroupConfig[] = [
  {
    key: 'sales',
    label: 'Sales',
    items: [
      { key: 'orders', label: 'Orders', route: '/orders', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'purchases', label: 'Purchases', route: '/purchases', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'product_returns', label: 'Product Returns', route: '/product-returns', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP'] },
      { key: 'shifts', label: 'Shifts', route: '/shifts', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    items: [
      { key: 'products', label: 'Products', route: '/products', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'categories', label: 'Categories', route: '/categories', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'units', label: 'Units', route: '/units', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'inventory_counts', label: 'Inventory Counts', route: '/inventory-counts', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'stock_adjustments', label: 'Stock Adjustments', route: '/stock-adjustments', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'stock_movements', label: 'Stock Movements', route: '/stock-movements', plan: 'ENTERPRISE', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'warehouses', label: 'Warehouses', route: '/warehouses', plan: 'ENTERPRISE', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'warehouse_stocks', label: 'Warehouse Stocks', route: '/warehouse-stocks', plan: 'ENTERPRISE', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'stock_transfers', label: 'Stock Transfers', route: '/transfer-stocks', plan: 'ENTERPRISE', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
    ],
  },
  {
    key: 'workshop',
    label: 'Workshop',
    items: [
      { key: 'vehicles', label: 'Vehicles', route: '/vehicles', plan: 'PRO', businessTypes: ['WORKSHOP'] },
      { key: 'mechanics', label: 'Mechanics', route: '/mechanics', plan: 'PRO', businessTypes: ['WORKSHOP'] },
      { key: 'work_orders', label: 'Work Orders', route: '/work-orders', plan: 'PRO', businessTypes: ['WORKSHOP'] },
      { key: 'service_history', label: 'Service History', route: '/service-history', plan: 'PRO', businessTypes: ['WORKSHOP'] },
      { key: 'service_packages', label: 'Service Packages', route: '/service-packages', plan: 'PRO', businessTypes: ['WORKSHOP'] },
      { key: 'bookings', label: 'Bookings', route: '/bookings', plan: 'PRO', businessTypes: ['WORKSHOP'] },
    ],
  },
  {
    key: 'people',
    label: 'People',
    items: [
      { key: 'customers', label: 'Customers', route: '/customers', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'suppliers', label: 'Suppliers', route: '/suppliers', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'staff', label: 'Users', route: '/users', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { key: 'expenses', label: 'Expenses', route: '/expenses', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'bank_accounts', label: 'Bank Accounts', route: '/bank-accounts', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'bank_ledgers', label: 'Bank Ledgers', route: '/bank-ledgers', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    items: [
      { key: 'reports', label: 'Dashboard Summary', route: '/reports/dashboard-summary', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'sales_report', label: 'Sales Report', route: '/reports/sales', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'sales_items_report', label: 'Sales Items', route: '/reports/sales-items', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'payment_report', label: 'Payment Report', route: '/reports/payments', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'expense_report', label: 'Expense Report', route: '/reports/expenses', plan: 'BASIC', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'stock_report', label: 'Stock Report', route: '/reports/stock', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'low_stock_report', label: 'Low Stock Report', route: '/reports/low-stock', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'shift_report', label: 'Shift Report', route: '/reports/shifts', plan: 'PRO', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
    ],
  },
  {
    key: 'system-tools',
    label: 'System Tools',
    items: [
      { key: 'backup_center', label: 'Backup & Restore', route: '/backup-center', plan: 'ENTERPRISE', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
      { key: 'import_master_data', label: 'Import Master Data', route: '/import-master-data', plan: 'ENTERPRISE', businessTypes: ['RETAIL', 'WORKSHOP', 'RESTAURANT'] },
    ],
  },
]

export const allAdminMenuItems = adminMenuGroups.flatMap((group) => group.items)
