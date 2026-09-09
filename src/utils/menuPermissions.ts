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
  reports: ['reports'],
  'reports-dashboard-summary': ['reports'],
  'reports-sales': ['reports', 'sales_report'],
  'reports-sales-items': ['reports', 'sales_items_report'],
  'reports-payments': ['reports', 'payment_report'],
  'reports-expenses': ['reports', 'expense_report'],
  'reports-stock': ['reports', 'stock_report'],
  'reports-low-stock': ['reports', 'low_stock_report'],
  'reports-shifts': ['reports', 'shift_report'],
  'sales-report': ['reports', 'sales_report'],
  'expense-report': ['reports', 'expense_report'],
  'sales-chart': ['reports', 'sales_chart'],
  'expense-chart': ['reports', 'expense_chart'],
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

export function canAccessMenu(user: PermissionUser | null | undefined, keys: string | string[]) {
  const menuKeys = Array.isArray(keys) ? keys : [keys]
  const moduleAllowed = menuKeys.some((key) => canShowModule(key, user))
  if (!moduleAllowed) return false

  if (hasFullMenuAccess(user)) return true

  const permissions = normalizeMenuPermissions(user?.menu_permissions)
  const hasPermissionData = Object.keys(permissions).length > 0

  if (!hasPermissionData) return true

  return menuKeys.some((key) => permissions[key] === true)
}
