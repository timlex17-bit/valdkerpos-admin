import api from './api'
import { ENDPOINTS } from './endpoints'

/**
 * Names for the report filters that used to ask for database IDs.
 *
 * Nobody running a shop knows that the cashier they mean is number 19, so each
 * of these filters is filled from the list the shop already has. A list the
 * user may not read (the backend answers 403) is not an error worth showing:
 * the caller falls back to the plain ID box it had before.
 */

export type FilterOptionKind =
  | 'cashier'
  | 'customer'
  | 'product'
  | 'category'
  | 'supplier'
  | 'warehouse'
  | 'waiter'

export type FilterOption = { value: string; label: string }

const SOURCES: Record<FilterOptionKind, string> = {
  cashier: ENDPOINTS.STAFF,
  customer: ENDPOINTS.CUSTOMERS,
  product: ENDPOINTS.PRODUCTS,
  category: ENDPOINTS.CATEGORIES,
  supplier: ENDPOINTS.SUPPLIERS,
  warehouse: ENDPOINTS.WAREHOUSES,
  waiter: ENDPOINTS.RESTAURANT_WAITERS,
}

/** Enough for a shop's staff, customers or products without paging. */
const PAGE_SIZE = 500

const cache = new Map<FilterOptionKind, FilterOption[]>()

function labelOf(row: Record<string, unknown>) {
  const name =
    row.full_name || row.name || row.display_name || row.title || row.username || row.code || ''
  return String(name).trim()
}

export function clearFilterOptions() {
  cache.clear()
}

/**
 * Two people called "UI Inventory" in one dropdown is a filter you cannot use:
 * whichever is picked, the owner cannot tell whose sales they are reading. Only
 * the repeated names get their username or code appended.
 */
function disambiguate(options: Array<FilterOption & { hint?: string }>): FilterOption[] {
  const seen = new Map<string, number>()
  options.forEach((option) => seen.set(option.label, (seen.get(option.label) || 0) + 1))

  return options
    .map(({ value, label, hint }) => ({
      value,
      label: (seen.get(label) || 0) > 1 && hint ? `${label} (${hint})` : label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * The options for one filter, or null when the list cannot be read. Results are
 * cached for the session: the same staff list is asked for once, not on every
 * visit to the report page.
 */
export async function loadFilterOptions(kind: FilterOptionKind): Promise<FilterOption[] | null> {
  const cached = cache.get(kind)
  if (cached) return cached

  try {
    const { data } = await api.get(SOURCES[kind], { params: { page_size: PAGE_SIZE } })
    const rows: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : []

    const options = rows
      .map((row) => ({
        value: String(row.id ?? ''),
        label: labelOf(row),
        hint: String(row.username || row.code || row.sku || '').trim(),
      }))
      .filter((option) => option.value && option.label)

    cache.set(kind, disambiguate(options))
    return cache.get(kind) as FilterOption[]
  } catch {
    return null
  }
}
