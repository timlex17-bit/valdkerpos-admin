import { canShowModule } from './moduleVisibility'

export type PermissionUser = {
  role?: string
  is_superuser?: boolean
  is_platform_admin?: boolean
  is_shop_owner?: boolean
  is_shop_admin?: boolean
  menu_permissions?: unknown
  effective_modules?: unknown
  shop_business_type?: string
  shop_plan?: string
}

type PermissionItem = {
  key?: unknown
  menu_key?: unknown
  can_access?: unknown
  canAccess?: unknown
}

/**
 * Route name -> backend module key. This mapping is genuinely the dashboard's
 * own business (the backend has no idea what a Vue route is named), but every
 * value here must be a key the backend actually defines in
 * `pos/module_registry.py`. `src/utils/__tests__/moduleContract.spec.ts`
 * fails the build if one is not.
 */
export const routeMenuKeys: Record<string, string[]> = {
  customers: ['customers'],
  suppliers: ['suppliers'],
  products: ['products'],
  categories: ['categories'],
  units: ['units'],
  orders: ['orders'],
  purchases: ['purchases'],
  expenses: ['expenses'],
  users: ['staff'],
  'inventory-counts': ['inventory_counts'],
  'product-returns': ['product_returns'],
  shifts: ['shifts'],
  'stock-adjustments': ['stock_adjustments'],
  'stock-movements': ['stock_movements'],
  warehouses: ['warehouses'],
  'transfer-stocks': ['stock_transfers'],
  'warehouse-stocks': ['warehouse_stocks'],
  vehicles: ['vehicles'],
  mechanics: ['mechanics'],
  'work-orders': ['work_orders'],
  'service-history': ['service_history'],
  'service-packages': ['service_packages'],
  bookings: ['bookings'],
  tables: ['tables'],
  waiters: ['waiters'],
  'kitchen-display': ['kitchen_display'],
  reports: ['reports'],
  'reports-dashboard-summary': ['reports'],
  'reports-sales': ['sales_report'],
  'reports-sales-items': ['sales_items_report'],
  'reports-payments': ['payment_report'],
  'reports-expenses': ['expense_report'],
  'reports-stock': ['stock_report'],
  'reports-low-stock': ['low_stock_report'],
  'reports-shifts': ['shift_report'],
  // Legacy flat aliases for the /reports/* routes above. They render the same
  // component, so they gate on the same backend key.
  'sales-report': ['sales_report'],
  'expense-report': ['expense_report'],

  // The two chart pages are modules in their own right now that the backend
  // registers them. They were guarded on sales_report/expense_report while
  // the keys did not exist yet.
  'sales-chart': ['sales_chart'],
  'expense-chart': ['expense_chart'],
  'bank-accounts': ['bank_accounts'],
  'bank-ledgers': ['bank_ledgers'],
  settings: ['settings'],
  'backup-center': ['backup_center'],
  'import-master-data': ['import_master_data'],
}

export function hasFullMenuAccess(user?: PermissionUser | null) {
  const role = String(user?.role || '').toLowerCase()

  return Boolean(
    user?.is_superuser ||
      user?.is_platform_admin ||
      user?.is_shop_owner ||
      user?.is_shop_admin ||
      role === 'owner' ||
      role === 'admin' ||
      role === 'superuser'
  )
}

/**
 * Turns whatever shape the API used for menu permissions into `{key: boolean}`.
 * It maps only what it is given - it must never add keys of its own, or the
 * permission matrix starts offering modules the shop does not have.
 */
export function normalizeMenuPermissions(input: unknown) {
  const permissions: Record<string, boolean> = {}

  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (!item || typeof item !== 'object') return

      const permission = item as PermissionItem
      const key = String(permission.menu_key || permission.key || '').trim()
      if (!key) return

      permissions[key] = Boolean(permission.can_access ?? permission.canAccess)
    })

    return permissions
  }

  if (input && typeof input === 'object') {
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      permissions[key] = Boolean(value)
    })
  }

  return permissions
}

/**
 * `canShowModule` already reflects role defaults and per-user overrides,
 * because the backend applied both before it answered. The local
 * `menu_permissions` blob is only consulted as a fallback for a session that
 * has no contract yet.
 */
export function canAccessMenu(user: PermissionUser | null | undefined, keys: string | string[]) {
  const menuKeys = Array.isArray(keys) ? keys : [keys]
  return menuKeys.some((key) => canShowModule(key, user))
}
