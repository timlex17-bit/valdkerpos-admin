import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { adminMenuGroups, allAdminMenuItems } from '../adminMenu'
import { routeMenuKeys } from '../menuPermissions'
import { BACKEND_MODULE_KEYS, BACKEND_MODULE_MATRIX } from './backendModuleMatrix'

const srcDir = resolve(__dirname, '../..')
const read = (relative: string) => readFileSync(resolve(srcDir, relative), 'utf8')

describe('module keys the dashboard uses', () => {
  it('every sidebar entry names a module the backend defines', () => {
    const unknown = allAdminMenuItems.map((item) => item.key).filter((key) => !BACKEND_MODULE_KEYS.includes(key))

    expect(unknown, `sidebar keys absent from the backend registry: ${unknown.join(', ')}`).toEqual([])
  })

  it('every route guard names a module the backend defines', () => {
    const unknown = [...new Set(Object.values(routeMenuKeys).flat())].filter(
      (key) => !BACKEND_MODULE_KEYS.includes(key)
    )

    // This is the check that would have caught `users`, `backup_center`,
    // `import_master_data` and the seven report keys being asked for before
    // the backend had ever defined them.
    expect(unknown, `guard keys absent from the backend registry: ${unknown.join(', ')}`).toEqual([])
  })

  it('does not offer a module with no page behind it', () => {
    const unimplemented = BACKEND_MODULE_MATRIX.filter((item) => !item.implemented).map((item) => item.key)
    const offered = allAdminMenuItems.map((item) => item.key).filter((key) => unimplemented.includes(key))

    expect(offered, `sidebar offers unimplemented modules: ${offered.join(', ')}`).toEqual([])
  })

  it('gives every sidebar entry a route', () => {
    const routeless = allAdminMenuItems.filter((item) => !item.route).map((item) => item.key)

    expect(routeless).toEqual([])
  })

  it('does not point two sidebar entries at the same key', () => {
    const keys = allAdminMenuItems.map((item) => item.key)

    expect(keys.length).toBe(new Set(keys).size)
  })
})

describe('the dashboard keeps no copy of the backend rules', () => {
  // The regression these guard against: plan tiers and business-type
  // restrictions living in the dashboard, drifting from the backend, and
  // silently hiding modules from the people entitled to them.
  it('adminMenu.ts carries navigation only, no plan or business-type', () => {
    const source = read('utils/adminMenu.ts')

    expect(source).not.toMatch(/\bplan:\s*'(BASIC|PRO|ENTERPRISE)'/)
    expect(source).not.toMatch(/businessTypes:\s*\[/)
  })

  it('moduleVisibility.ts declares no plan tiers or business-type sets', () => {
    const source = read('utils/moduleVisibility.ts')

    expect(source).not.toMatch(/MODULE_PLAN|WORKSHOP_ONLY|RESTAURANT_ONLY|RESTAURANT_BLOCKED/)
    expect(source).not.toMatch(/PLAN_LEVELS\s*[:=]/)
  })

  it('UsersView.vue does not rebuild the permission list from a local catalog', () => {
    const source = read('views/users/UsersView.vue')

    expect(source).not.toMatch(/permissionCatalog|finalMenuKeys|getFinalMenuOptions/)
  })

  it('SettingsView.vue does not write effective_modules', () => {
    const source = read('views/settings/SettingsView.vue')

    // The browser must never be the authority on its own entitlements.
    expect(source).not.toMatch(/setItem\(\s*'effective_modules'/)
  })

  it('groups every sidebar item under a named group', () => {
    for (const group of adminMenuGroups) {
      expect(group.key).toBeTruthy()
      expect(group.items.length).toBeGreaterThan(0)
    }
  })
})

/**
 * The live check. Skipped unless a backend is reachable, so the suite still
 * runs offline and in CI, but when it does run it is the real contract - if
 * the backend adds, removes or moves a module, the snapshot above stops
 * matching and this fails.
 */
const apiUrl = process.env.VALORA_API_URL
const apiToken = process.env.VALORA_API_TOKEN

describe.runIf(apiUrl && apiToken)('GET /api/modules/ still matches the snapshot', () => {
  it('returns the same keys, plans, business types and implemented flags', async () => {
    const response = await fetch(`${apiUrl}/api/modules/`, {
      headers: { Authorization: `Token ${apiToken}` },
    })

    expect(response.ok, `GET /api/modules/ returned ${response.status}`).toBe(true)

    const body = (await response.json()) as { modules: typeof BACKEND_MODULE_MATRIX }
    const live = body.modules
      .map((item) => ({
        key: item.key,
        plan_level: item.plan_level,
        business_types: [...item.business_types].sort(),
        implemented: item.implemented,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))

    const snapshot = BACKEND_MODULE_MATRIX.map((item) => ({
      key: item.key,
      plan_level: item.plan_level,
      business_types: [...item.business_types].sort(),
      implemented: item.implemented,
    })).sort((a, b) => a.key.localeCompare(b.key))

    expect(live).toEqual(snapshot)
  })
})
