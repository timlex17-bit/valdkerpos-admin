export type Plan = 'BASIC' | 'PRO' | 'ENTERPRISE' | string
export type BusinessType = 'RETAIL' | 'WORKSHOP' | 'RESTAURANT' | string
export type MenuPlan = 'BASIC' | 'PRO' | 'ENTERPRISE'
export type MenuBusinessType = 'RETAIL' | 'WORKSHOP' | 'RESTAURANT'

export type MenuItemConfig = {
  key: string
  label: string
  route?: string
  plan?: MenuPlan
  businessTypes?: MenuBusinessType[]
  implemented?: boolean
  children?: MenuItemConfig[]
}

const PLAN_LEVELS: Record<string, number> = {
  BASIC: 1,
  PRO: 2,
  ENTERPRISE: 3,
}

const MODULE_PLAN: Record<string, string> = {
  inventory_counts: 'PRO',
  stock_adjustments: 'PRO',
  product_returns: 'PRO',
  purchase_returns: 'PRO',
  bank_accounts: 'PRO',
  bank_ledgers: 'PRO',
  vehicles: 'PRO',
  mechanics: 'PRO',
  work_orders: 'PRO',
  service_history: 'PRO',
  service_packages: 'PRO',
  bookings: 'PRO',
  warehouses: 'ENTERPRISE',
  warehouse_stocks: 'ENTERPRISE',
  stock_transfers: 'ENTERPRISE',
  stock_movements: 'ENTERPRISE',
}

const WORKSHOP_ONLY = new Set([
  'vehicles',
  'mechanics',
  'work_orders',
  'service_history',
  'service_packages',
  'bookings',
])

const RESTAURANT_ONLY = new Set([
  'tables',
  'kitchen_display',
  'waiters',
  'shifts',
  'recipe_bom',
  'delivery_orders',
  'reservations',
])

const RESTAURANT_BLOCKED = new Set(['product_returns'])

export type ModuleUser = {
  role?: string
  businessType?: string
  plan?: string
  effectiveModules?: unknown
  menuPermissions?: unknown
  is_superuser?: boolean
  is_platform_admin?: boolean
  is_shop_owner?: boolean
  is_shop_admin?: boolean
  menu_permissions?: unknown
  effective_modules?: unknown
  shop_business_type?: string
  shop_plan?: string
}

export function normalizePlan(plan?: Plan | null) {
  const value = String(plan || 'BASIC').trim().toUpperCase()
  return PLAN_LEVELS[value] ? value : 'BASIC'
}

export function normalizeBusinessType(businessType?: BusinessType | null) {
  const value = String(businessType || 'RETAIL').trim().toUpperCase()
  return ['RETAIL', 'WORKSHOP', 'RESTAURANT'].includes(value) ? value : 'RETAIL'
}

export function isModuleInPlan(moduleKey: string, plan?: Plan | null) {
  const requiredPlan = MODULE_PLAN[moduleKey] || 'BASIC'
  return PLAN_LEVELS[normalizePlan(plan)] >= PLAN_LEVELS[requiredPlan]
}

export function isModuleAllowedForBusinessType(moduleKey: string, businessType?: BusinessType | null) {
  const normalized = normalizeBusinessType(businessType)
  if (WORKSHOP_ONLY.has(moduleKey)) return normalized === 'WORKSHOP'
  if (RESTAURANT_ONLY.has(moduleKey)) return normalized === 'RESTAURANT'
  if (normalized === 'RESTAURANT' && RESTAURANT_BLOCKED.has(moduleKey)) return false
  if (normalized !== 'WORKSHOP' && WORKSHOP_ONLY.has(moduleKey)) return false
  if (normalized !== 'RESTAURANT' && RESTAURANT_ONLY.has(moduleKey)) return false
  return true
}

export function parseStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getStoredEffectiveModules() {
  const direct = parseStoredJson<unknown[]>('effective_modules', [])
  if (direct.length) return direct
  const user = parseStoredJson<ModuleUser | null>('user', null)
  const modules = user?.effective_modules || user?.effectiveModules
  return Array.isArray(modules) ? modules.map(String) : []
}

export function getStoredBusinessType() {
  const user = parseStoredJson<ModuleUser | null>('user', null)
  const shop = parseStoredJson<Record<string, unknown> | null>('shop', null)
  return normalizeBusinessType(
    user?.businessType ||
      user?.shop_business_type ||
      String(shop?.businessType || shop?.business_type || shop?.business_type_value || '')
  )
}

export function getStoredPlan() {
  const user = parseStoredJson<ModuleUser | null>('user', null)
  const shop = parseStoredJson<Record<string, unknown> | null>('shop', null)
  return normalizePlan(user?.plan || user?.shop_plan || String(shop?.plan || ''))
}

export function hasPermission(moduleKey: string, user?: ModuleUser | null) {
  const permissions = user?.menu_permissions || user?.menuPermissions
  if (!permissions || typeof permissions !== 'object') return true
  if (Array.isArray(permissions)) {
    return permissions.some((item: any) => {
      const key = String(item?.menu_key || item?.key || '')
      return key === moduleKey && Boolean(item?.can_access ?? item?.canAccess)
    })
  }
  return Boolean((permissions as Record<string, unknown>)[moduleKey])
}

export function isPrivilegedRole(user?: ModuleUser | null) {
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

export function canShowModule(moduleKey: string, user?: ModuleUser | null, routeExists = true) {
  if (!routeExists) return false

  const userEffectiveModules = user?.effective_modules || user?.effectiveModules
  const effectiveModules = Array.isArray(userEffectiveModules)
    ? userEffectiveModules.map(String)
    : getStoredEffectiveModules()

  const plan = normalizePlan(user?.plan || user?.shop_plan || getStoredPlan())
  const businessType = normalizeBusinessType(user?.businessType || user?.shop_business_type || getStoredBusinessType())
  const moduleEnabled = effectiveModules.length
    ? effectiveModules.includes(moduleKey)
    : isModuleInPlan(moduleKey, plan) && isModuleAllowedForBusinessType(moduleKey, businessType)

  return (
    moduleEnabled &&
    isModuleInPlan(moduleKey, plan) &&
    isModuleAllowedForBusinessType(moduleKey, businessType) &&
    (isPrivilegedRole(user) || hasPermission(moduleKey, user))
  )
}

export function isMenuItemAvailable(item: MenuItemConfig, user?: ModuleUser | null) {
  const plan = normalizePlan(user?.plan || user?.shop_plan || getStoredPlan())
  const businessType = normalizeBusinessType(user?.businessType || user?.shop_business_type || getStoredBusinessType())
  const routeExists = Boolean(item.route)

  return (
    item.implemented !== false &&
    routeExists &&
    isModuleInPlan(item.key, item.plan || plan) &&
    (!item.plan || PLAN_LEVELS[plan] >= PLAN_LEVELS[item.plan]) &&
    isModuleAllowedForBusinessType(item.key, businessType) &&
    (!item.businessTypes || item.businessTypes.includes(businessType as MenuBusinessType)) &&
    canShowModule(item.key, user, routeExists)
  )
}

export function getVisibleMenuItems<T extends MenuItemConfig>(menuItems: T[], user?: ModuleUser | null): T[] {
  return menuItems
    .map((item) => {
      const children = item.children ? getVisibleMenuItems(item.children, user) : undefined
      return {
        ...item,
        children,
      }
    })
    .filter((item) => {
      if (item.children?.length) return true
      return isMenuItemAvailable(item, user)
    }) as T[]
}
