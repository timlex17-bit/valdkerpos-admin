/**
 * Snapshot of the backend module matrix (`pos/module_registry.py`), 48
 * modules, regenerated from a live `GET /api/modules/` on 2026-09-12.
 *
 * This is NOT a rule the dashboard applies - nothing in `src/` reads it at
 * runtime. It exists so `moduleContract.spec.ts` can check that every module
 * key the dashboard navigates to or guards on is a key the backend actually
 * defines, without needing a live server.
 *
 * When a live backend is reachable, the same spec fetches `GET /api/modules/`
 * and fails if this snapshot no longer matches it. Set VALORA_API_URL and
 * VALORA_API_TOKEN to enable that check:
 *
 *   VALORA_API_URL=http://127.0.0.1:8000 VALORA_API_TOKEN=<token> npm test
 */
export type BackendModule = {
  key: string
  plan_level: string
  business_types: string[]
  implemented: boolean
}

export const BACKEND_MODULE_MATRIX: BackendModule[] = [
  { key: 'dashboard', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'pos', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'orders', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'customers', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'products', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'categories', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'units', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'suppliers', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'purchases', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'expenses', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'reports', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'settings', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'staff', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'backup_center', plan_level: 'ENTERPRISE', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'import_master_data', plan_level: 'ENTERPRISE', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'sales_report', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'sales_items_report', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'payment_report', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'expense_report', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'stock_report', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'low_stock_report', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'shift_report', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'sales_chart', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'expense_chart', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'offline_orders', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'shifts', plan_level: 'BASIC', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'inventory_counts', plan_level: 'PRO', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'stock_adjustments', plan_level: 'PRO', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'product_returns', plan_level: 'PRO', business_types: ['RETAIL', 'WORKSHOP'], implemented: true },
  { key: 'purchase_returns', plan_level: 'PRO', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: false },
  { key: 'bank_accounts', plan_level: 'PRO', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'bank_ledgers', plan_level: 'PRO', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'warehouses', plan_level: 'ENTERPRISE', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'warehouse_stocks', plan_level: 'ENTERPRISE', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'stock_transfers', plan_level: 'ENTERPRISE', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'stock_movements', plan_level: 'ENTERPRISE', business_types: ['RETAIL', 'WORKSHOP', 'RESTAURANT'], implemented: true },
  { key: 'vehicles', plan_level: 'BASIC', business_types: ['WORKSHOP'], implemented: true },
  { key: 'mechanics', plan_level: 'BASIC', business_types: ['WORKSHOP'], implemented: true },
  { key: 'work_orders', plan_level: 'BASIC', business_types: ['WORKSHOP'], implemented: true },
  { key: 'service_history', plan_level: 'BASIC', business_types: ['WORKSHOP'], implemented: true },
  { key: 'service_packages', plan_level: 'BASIC', business_types: ['WORKSHOP'], implemented: true },
  { key: 'bookings', plan_level: 'BASIC', business_types: ['WORKSHOP'], implemented: true },
  { key: 'tables', plan_level: 'BASIC', business_types: ['RESTAURANT'], implemented: true },
  { key: 'kitchen_display', plan_level: 'BASIC', business_types: ['RESTAURANT'], implemented: true },
  { key: 'waiters', plan_level: 'BASIC', business_types: ['RESTAURANT'], implemented: true },
  { key: 'recipe_bom', plan_level: 'BASIC', business_types: ['RESTAURANT'], implemented: false },
  { key: 'delivery_orders', plan_level: 'BASIC', business_types: ['RESTAURANT'], implemented: false },
  { key: 'reservations', plan_level: 'BASIC', business_types: ['RESTAURANT'], implemented: false },
]

export const BACKEND_MODULE_KEYS = BACKEND_MODULE_MATRIX.map((item) => item.key)
