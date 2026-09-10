import { getModuleEntry, isModuleGranted, moduleContract } from '@/services/moduleContract'

export type Plan = 'BASIC' | 'PRO' | 'ENTERPRISE' | string
export type BusinessType = 'RETAIL' | 'WORKSHOP' | 'RESTAURANT' | string
export type MenuPlan = 'BASIC' | 'PRO' | 'ENTERPRISE'
export type MenuBusinessType = 'RETAIL' | 'WORKSHOP' | 'RESTAURANT'

/**
 * A menu entry is now nothing but a key, a label fallback and where to
 * navigate. Which plan a module needs and which business types may use it are
 * the backend's to decide (`GET /api/modules/`); restating them here is what
 * made ten menus disappear for owners when the backend moved a module.
 */
export type MenuItemConfig = {
  key: string
  label: string
  route?: string
  children?: MenuItemConfig[]
}

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

export function parseStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function normalizePlan(plan?: Plan | null) {
  const value = String(plan || '').trim().toUpperCase()
  return ['BASIC', 'PRO', 'ENTERPRISE'].includes(value) ? value : 'BASIC'
}

export function normalizeBusinessType(businessType?: BusinessType | null) {
  const value = String(businessType || '').trim().toUpperCase()
  return ['RETAIL', 'WORKSHOP', 'RESTAURANT'].includes(value) ? value : 'RETAIL'
}

export function getStoredEffectiveModules() {
  const direct = parseStoredJson<unknown[]>('effective_modules', [])
  if (direct.length) return direct.map(String)
  const user = parseStoredJson<ModuleUser | null>('user', null)
  const modules = user?.effective_modules || user?.effectiveModules
  return Array.isArray(modules) ? modules.map(String) : []
}

/**
 * Shop profile, for display only. Nothing gates on these any more - the
 * backend has already applied plan and business type when it built the
 * contract. They are read from the contract first so a plan change shows up
 * without a re-login.
 */
export function getStoredBusinessType() {
  const fromContract = moduleContract.value?.shop?.business_type
  if (fromContract) return normalizeBusinessType(fromContract)

  const user = parseStoredJson<ModuleUser | null>('user', null)
  const shop = parseStoredJson<Record<string, unknown> | null>('shop', null)
  return normalizeBusinessType(
    user?.businessType ||
      user?.shop_business_type ||
      String(shop?.businessType || shop?.business_type || shop?.business_type_value || '')
  )
}

export function getStoredPlan() {
  const fromContract = moduleContract.value?.shop?.plan
  if (fromContract) return normalizePlan(fromContract)

  const user = parseStoredJson<ModuleUser | null>('user', null)
  const shop = parseStoredJson<Record<string, unknown> | null>('shop', null)
  return normalizePlan(user?.plan || user?.shop_plan || String(shop?.plan || ''))
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

/**
 * The one gate. Order matters: ask the backend contract first, fall back to
 * the `effective_modules` the login response already provided, and only if we
 * have neither (a session that predates the contract, or a first paint before
 * the fetch lands) stay out of the way and let the API be the authority.
 *
 * Note it no longer rejects a key for being absent from a list before it has
 * checked anything else - that ordering is exactly what hid Users, Backup
 * Center, Import Master Data and the report pages from owners.
 */
export function canShowModule(moduleKey: string, user?: ModuleUser | null) {
  const granted = isModuleGranted(moduleKey)
  if (granted !== null) return granted

  const userEffectiveModules = user?.effective_modules || user?.effectiveModules
  const effectiveModules = Array.isArray(userEffectiveModules)
    ? userEffectiveModules.map(String)
    : getStoredEffectiveModules()

  if (effectiveModules.length) return effectiveModules.includes(moduleKey)

  return true
}

export function isMenuItemAvailable(item: MenuItemConfig, user?: ModuleUser | null) {
  if (!item.route) return false
  return canShowModule(item.key, user)
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

/** Label the backend gave this module, when we have the contract. */
export function getModuleLabel(moduleKey: string, fallback: string) {
  return getModuleEntry(moduleKey)?.label || fallback
}
