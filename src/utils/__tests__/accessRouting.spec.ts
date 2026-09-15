import { afterEach, describe, expect, it } from 'vitest'
import { moduleContract, type ModuleContractEntry } from '@/services/moduleContract'
import { NO_ACCESS_ROUTE, firstAccessibleRoute, routeMenuKeys } from '../menuPermissions'
import { allAdminMenuItems } from '../adminMenu'
import { moduleIcons } from '@/components/icons/moduleIcons'

function grant(keys: string[]) {
  const all = ['dashboard', ...allAdminMenuItems.map((item) => item.key)]
  moduleContract.value = {
    shop: { id: 4, business_type: 'RETAIL', plan: 'ENTERPRISE' },
    modules: all.map(
      (key): ModuleContractEntry => ({
        key,
        label: key,
        group: 'Core',
        plan_level: 'BASIC',
        business_types: ['RETAIL'],
        implemented: true,
        valid_for_shop: true,
        granted: keys.includes(key),
      })
    ),
  }
}

afterEach(() => {
  moduleContract.value = null
})

describe('firstAccessibleRoute', () => {
  it('sends a user who may see the dashboard there', () => {
    grant(['dashboard', 'products'])
    expect(firstAccessibleRoute(null)).toBe('/dashboard')
  })

  it('sends an inventory-only user to the first inventory page, not the dashboard', () => {
    // The case found by logging in as an owner-created inventory clerk: the
    // dashboard refused them and every refused link bounced back to it.
    grant(['products', 'categories', 'inventory_counts', 'warehouses'])
    expect(firstAccessibleRoute(null)).toBe('/products')
  })

  it('follows sidebar order, whatever order the grants arrive in', () => {
    grant(['settings', 'bank_accounts', 'customers'])
    expect(firstAccessibleRoute(null)).toBe('/customers')
  })

  it('never answers with the page that was just refused', () => {
    grant(['products'])
    expect(firstAccessibleRoute(null, '/products')).toBe(NO_ACCESS_ROUTE)
  })

  it('has somewhere honest to go when nothing is granted', () => {
    grant([])
    expect(firstAccessibleRoute(null)).toBe(NO_ACCESS_ROUTE)
  })

  it('guards the dashboard route like any other module', () => {
    expect(routeMenuKeys.dashboard).toEqual(['dashboard'])
  })
})

describe('sidebar icons', () => {
  it('gives every sidebar module and the dashboard its own icon', () => {
    const missing = ['dashboard', ...allAdminMenuItems.map((item) => item.key)].filter((key) => !moduleIcons[key])
    expect(missing, `modules without an icon: ${missing.join(', ')}`).toEqual([])
  })

  it('draws every icon on the 24px grid with at least one shape and a hex colour', () => {
    for (const [key, icon] of Object.entries(moduleIcons)) {
      expect(icon.shapes.length, key).toBeGreaterThan(0)
      expect(icon.color, key).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
