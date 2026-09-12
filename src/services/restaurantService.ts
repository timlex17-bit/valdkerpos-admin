import api from './api'
import { normalizeApiList } from '@/utils/apiData'
import { ENDPOINTS } from './endpoints'

/**
 * Dine-in restaurant modules: tables and waiters.
 *
 * Every shape here comes from the backend contract in
 * `docs/api/RESTAURANT_API.md` (branch
 * feature/restaurant-core-tables-waiters-kitchen), whose examples are captured
 * from the backend's own test suite. Nothing here is inferred from the
 * workshop modules, which have a different payload shape entirely.
 */

/**
 * `status` is derived live by the server on every read - it is not stored, and
 * there is no way to set it through the API. It is therefore read-only here
 * too: never written, never recomputed on the client. To refresh it, re-read
 * the list.
 */
export type TableStatus = 'occupied' | 'empty'

export type RestaurantTable = {
  id: number
  name: string
  capacity: number
  area: string
  is_active: boolean
  status: TableStatus
  created_at: string
  updated_at: string
}

/** Only the writable fields. `status` is deliberately absent. */
export type TablePayload = {
  name: string
  capacity: number
  area: string
  is_active: boolean
}

export type Waiter = {
  id: number
  name: string
  username: string
  role: string
  active_orders_count: number
  active_tables: string[]
}

/**
 * `total_sales` and `avg_order_value` arrive as two-decimal strings, already
 * rounded server-side with ROUND_HALF_EVEN. They stay strings all the way to
 * the formatter - parsing them to a float and re-rounding would undo that.
 */
export type WaiterPerformanceRow = {
  waiter_id: number | null
  waiter_name: string
  orders_count: number
  total_sales: string
  avg_order_value: string
  items_served: number
  tables_served: number
}

export type WaiterPerformanceReport = {
  shop: { id: number; name: string; business_type: string } | null
  date_from: string | null
  date_to: string | null
  results: WaiterPerformanceRow[]
}

function normalizeTable(item: any): RestaurantTable {
  return {
    id: Number(item?.id ?? 0),
    name: String(item?.name ?? ''),
    capacity: Number(item?.capacity ?? 0),
    area: String(item?.area ?? ''),
    is_active: item?.is_active !== false,
    status: item?.status === 'occupied' ? 'occupied' : 'empty',
    created_at: String(item?.created_at ?? ''),
    updated_at: String(item?.updated_at ?? ''),
  }
}

export async function listTables(): Promise<RestaurantTable[]> {
  const response = await api.get(ENDPOINTS.TABLES)
  return normalizeApiList(response.data).map(normalizeTable)
}

export async function createTable(payload: TablePayload): Promise<RestaurantTable> {
  const response = await api.post(ENDPOINTS.TABLES, payload)
  return normalizeTable(response.data)
}

export async function updateTable(
  id: number,
  payload: Partial<TablePayload>
): Promise<RestaurantTable> {
  const response = await api.patch(ENDPOINTS.tableDetail(id), payload)
  return normalizeTable(response.data)
}

export async function deleteTable(id: number): Promise<void> {
  await api.delete(ENDPOINTS.tableDetail(id))
}

function normalizeWaiter(item: any): Waiter {
  return {
    id: Number(item?.id ?? 0),
    name: String(item?.name ?? ''),
    username: String(item?.username ?? ''),
    role: String(item?.role ?? ''),
    active_orders_count: Number(item?.active_orders_count ?? 0),
    active_tables: Array.isArray(item?.active_tables) ? item.active_tables.map(String) : [],
  }
}

/**
 * Every active staff member in the shop, with live aggregates. There is no
 * "waiter" role and no flag marking someone as one - the backend is explicit
 * that any active staff member is a candidate - so nothing here promotes,
 * demotes or filters by role.
 */
export async function listWaiters(): Promise<Waiter[]> {
  const response = await api.get(ENDPOINTS.RESTAURANT_WAITERS)
  return normalizeApiList(response.data).map(normalizeWaiter)
}

export async function getWaiterPerformance(params: {
  date_from?: string
  date_to?: string
}): Promise<WaiterPerformanceReport> {
  const query: Record<string, string> = {}
  if (params.date_from) query.date_from = params.date_from
  if (params.date_to) query.date_to = params.date_to

  const response = await api.get(ENDPOINTS.REPORT_WAITER_PERFORMANCE, { params: query })
  const data = response.data || {}

  return {
    shop: data.shop ?? null,
    date_from: data.date_from ?? null,
    date_to: data.date_to ?? null,
    results: Array.isArray(data.results)
      ? data.results.map((row: any) => ({
          // null is meaningful: it is the "no waiter recorded" bucket, and it
          // is never dropped. Number(null) would turn it into 0 and collide
          // with a real staff id.
          waiter_id: row?.waiter_id === null || row?.waiter_id === undefined ? null : Number(row.waiter_id),
          waiter_name: String(row?.waiter_name ?? ''),
          orders_count: Number(row?.orders_count ?? 0),
          // Kept as sent: two-decimal strings the server already rounded.
          total_sales: String(row?.total_sales ?? '0.00'),
          avg_order_value: String(row?.avg_order_value ?? '0.00'),
          items_served: Number(row?.items_served ?? 0),
          tables_served: Number(row?.tables_served ?? 0),
        }))
      : [],
  }
}

/**
 * Field errors as the API sent them, e.g. a duplicate table name comes back as
 * `{"name": ["A table with this name already exists."]}`. Returned per field so
 * a view can print the message against the input that caused it instead of
 * flattening it into one generic banner.
 */
export function extractFieldErrors(error: any): Record<string, string> {
  const data = error?.response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}

  const fields: Record<string, string> = {}
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    if (key === 'detail') return
    if (Array.isArray(value) && value.length) fields[key] = String(value[0])
    else if (typeof value === 'string' && value.trim()) fields[key] = value
  })

  return fields
}

/** Non-field message, for errors that are not about one input. */
export function extractDetailMessage(error: any, fallback: string): string {
  const data = error?.response?.data
  if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) return data.trim()
  if (data?.detail) return String(data.detail)
  return fallback
}
