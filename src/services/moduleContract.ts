import { shallowRef } from 'vue'
import api from './api'
import { ENDPOINTS } from './endpoints'

/**
 * The dashboard's single source of truth for "which modules exist, which ones
 * this shop may have, and which ones this user actually got".
 *
 * Everything here comes from `GET /api/modules/` (backend
 * `pos/module_registry.py::MODULE_DEFINITIONS`). Nothing in the dashboard is
 * allowed to restate a plan tier or a business-type restriction of its own -
 * that duplication is what silently hid ten menus from owners before.
 */

export type ModuleContractEntry = {
  key: string
  label: string
  group: string
  plan_level: string
  business_types: string[]
  implemented: boolean
  /** business_type + plan of this shop allow the module (independent of role). */
  valid_for_shop: boolean | null
  /** this user really has it now (role defaults + UserMenuPermission applied). */
  granted: boolean | null
}

export type ModuleContract = {
  shop: { id: number; business_type: string; plan: string } | null
  modules: ModuleContractEntry[]
}

const STORAGE_KEY = 'module_contract'

/**
 * Cached so the synchronous router guard and the first sidebar render have an
 * answer before the network call returns. This is a cache of the backend's own
 * response, never a second copy of its rules, so it cannot drift into
 * disagreeing with the backend - it can only be stale, and it is refreshed on
 * every app boot.
 */
export const moduleContract = shallowRef<ModuleContract | null>(readCachedContract())

let inflight: Promise<ModuleContract | null> | null = null

function readCachedContract(): ModuleContract | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ModuleContract
    return Array.isArray(parsed?.modules) ? parsed : null
  } catch {
    return null
  }
}

function writeCachedContract(contract: ModuleContract) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contract))
  } catch {
    // Storage full or blocked: the in-memory ref still serves this session.
  }
}

export function clearModuleContract() {
  moduleContract.value = null
  inflight = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Fetch the contract. Concurrent callers share one request. On failure the
 * previously cached contract is kept rather than being replaced by a guess.
 */
export function loadModuleContract(): Promise<ModuleContract | null> {
  if (!inflight) {
    inflight = fetchContract().finally(() => {
      inflight = null
    })
  }

  return inflight
}

async function fetchContract(): Promise<ModuleContract | null> {
  try {
    const { data } = await api.get<ModuleContract>(ENDPOINTS.MODULES)
    if (!Array.isArray(data?.modules)) return moduleContract.value

    const contract: ModuleContract = {
      shop: data.shop ?? null,
      modules: data.modules.map((item) => ({
        key: String(item.key),
        label: String(item.label ?? item.key),
        group: String(item.group ?? 'System'),
        plan_level: String(item.plan_level ?? 'BASIC'),
        business_types: Array.isArray(item.business_types) ? item.business_types.map(String) : [],
        implemented: item.implemented !== false,
        valid_for_shop: item.valid_for_shop ?? null,
        granted: item.granted ?? null,
      })),
    }

    moduleContract.value = contract
    writeCachedContract(contract)
    return contract
  } catch {
    // Keep whatever we had. A failed refresh must not widen or narrow access.
    return moduleContract.value
  }
}

export function getModuleEntry(key: string): ModuleContractEntry | null {
  return moduleContract.value?.modules.find((item) => item.key === key) ?? null
}

/** Keys the backend actually knows about, in backend order. */
export function getContractKeys(): string[] {
  return moduleContract.value?.modules.map((item) => item.key) ?? []
}

/**
 * Tri-state on purpose:
 *  - `true` / `false` when the backend has told us,
 *  - `null` when we have no contract yet, so callers can fall back to the
 *    `effective_modules` the login response already gave us instead of
 *    inventing an answer.
 */
export function isModuleGranted(key: string): boolean | null {
  const entry = getModuleEntry(key)
  if (!entry) return moduleContract.value ? false : null
  if (entry.granted === null) return null
  return entry.granted && entry.implemented
}
