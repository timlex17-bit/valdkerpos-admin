import { androidIcons, androidModuleColors, type IconShape } from './androidIcons.generated'

/**
 * Icon and accent colour for every module the dashboard navigates to.
 *
 * Wherever the Android app has the module, its own icon and colour are used
 * (see androidIcons.generated.ts), so a user moving between the POS and the
 * dashboard recognises the same tile. The few modules that only exist here
 * (shifts, staff, tables, waiters, charts, import, report pages) get icons
 * drawn on the same 24px grid in the stroked style of Android's nav icons.
 */

const stroke = (d: string, width = 1.8): IconShape => ({ d, stroke: width, cap: 'round' })

const webIcons: Record<string, IconShape[]> = {
  clock: [
    stroke('M12,3.6 A8.4,8.4 0 1 1 11.99,3.6 Z'),
    stroke('M12,7.4 V12 L15.2,14.1'),
  ],
  users: [
    stroke('M9,4.3 A3.3,3.3 0 1 1 8.99,4.3 Z'),
    stroke('M2.9,19.6 C3.5,16 5.9,14.1 9,14.1 C12.1,14.1 14.5,16 15.1,19.6'),
    stroke('M15.5,4.7 A3,3 0 0 1 15.5,10.5'),
    stroke('M17.3,14.4 C19.3,15 20.7,16.8 21.1,19.4'),
  ],
  table: [
    stroke('M3.4,7.2 H20.6'),
    stroke('M5,7.2 L3.8,19.4'),
    stroke('M19,7.2 L20.2,19.4'),
    stroke('M6.2,12.4 H17.8'),
  ],
  waiter: [
    stroke('M3.2,18.8 H20.8'),
    stroke('M5.2,16.2 A6.8,6.8 0 0 1 18.8,16.2 Z'),
    stroke('M12,9.4 V7.2'),
    stroke('M10.3,6.4 H13.7'),
  ],
  trendUp: [
    stroke('M3.6,17.4 L9,12 L12.8,15.2 L20.4,7.6'),
    stroke('M15.4,7.6 H20.4 V12.6'),
  ],
  trendDown: [
    stroke('M3.6,7.6 L9,13 L12.8,9.8 L20.4,17.4'),
    stroke('M15.4,17.4 H20.4 V12.4'),
  ],
  upload: [
    stroke('M4,14.4 V18.4 A1.6,1.6 0 0 0 5.6,20 H18.4 A1.6,1.6 0 0 0 20,18.4 V14.4'),
    stroke('M12,15.4 V4.4'),
    stroke('M7.6,8.6 L12,4.2 L16.4,8.6'),
  ],
  alert: [
    stroke('M12,3.9 L21.1,19.6 H2.9 Z'),
    stroke('M12,9.6 V13.8'),
    stroke('M12,16.7 V16.8', 2.4),
  ],
  card: [
    stroke('M4.6,5.8 H19.4 A1.6,1.6 0 0 1 21,7.4 V16.6 A1.6,1.6 0 0 1 19.4,18.2 H4.6 A1.6,1.6 0 0 1 3,16.6 V7.4 A1.6,1.6 0 0 1 4.6,5.8 Z'),
    stroke('M3,10 H21'),
    stroke('M6.6,14.4 H10.2'),
  ],
  tag: [
    stroke('M3.8,12.6 L11.6,4.8 H19.2 V12.4 L11.4,20.2 Z'),
    stroke('M15.4,8.5 V8.6', 2.6),
  ],
}

export type ModuleIcon = { shapes: IconShape[]; color: string }

const icon = (shapes: IconShape[] | undefined, color: string | undefined, fallbackColor: string): ModuleIcon => ({
  shapes: shapes || webIcons.tag,
  color: color || fallbackColor,
})

const a = androidIcons
const c = androidModuleColors

export const moduleIcons: Record<string, ModuleIcon> = {
  dashboard: icon(a.home, undefined, '#6204bf'),
  // Android-only modules, shown on the Users page permission switches.
  pos: icon(a.pos, c.pos, '#4f46e5'),
  offline_orders: icon(a.offline_orders, c.offline_orders, '#3b82f6'),

  orders: icon(a.orders, c.orders, '#2563eb'),
  purchases: icon(a.purchases, c.purchases, '#d97706'),
  product_returns: icon(a.product_returns, c.product_returns, '#dc2626'),
  shifts: icon(webIcons.clock, undefined, '#0f766e'),

  products: icon(a.products, c.products, '#7c3aed'),
  categories: icon(a.categories, c.categories, '#9333ea'),
  units: icon(a.units, c.units, '#c026d3'),
  inventory_counts: icon(a.inventory_counts, c.inventory_counts, '#65a30d'),
  stock_adjustments: icon(a.stock_adjustments, c.stock_adjustments, '#ca8a04'),
  stock_movements: icon(a.stock_movements, c.stock_movements, '#0369a1'),
  warehouses: icon(a.warehouses, c.warehouses, '#1d4ed8'),
  warehouse_stocks: icon(a.warehouse_stocks, c.warehouse_stocks, '#0e7490'),
  stock_transfers: icon(a.stock_transfers, c.stock_transfers, '#7e22ce'),

  vehicles: icon(a.vehicles, c.vehicles, '#e11d48'),
  mechanics: icon(a.mechanics, c.mechanics, '#b45309'),
  work_orders: icon(a.work_orders, c.work_orders, '#be185d'),
  service_history: icon(a.service_history, c.service_history, '#6d28d9'),
  service_packages: icon(a.service_packages, c.service_packages, '#db2777'),
  bookings: icon(a.bookings, c.bookings, '#f59e0b'),

  tables: icon(webIcons.table, undefined, '#f97316'),
  waiters: icon(webIcons.waiter, undefined, '#c026d3'),
  kitchen_display: icon(a.kitchen_display, c.kitchen_display, '#ea580c'),

  customers: icon(a.customers, c.customers, '#0d9488'),
  suppliers: icon(a.suppliers, c.suppliers, '#0891b2'),
  staff: icon(webIcons.users, undefined, '#4338ca'),

  expenses: icon(a.expenses, c.expenses, '#059669'),
  bank_accounts: icon(a.bank_accounts, c.bank_accounts, '#16a34a'),
  bank_ledgers: icon(a.bank_ledgers, c.bank_ledgers, '#047857'),

  reports: icon(a.reports, c.reports, '#0284c7'),
  sales_report: icon(a.reports_bars, undefined, '#2563eb'),
  sales_items_report: icon(webIcons.tag, undefined, '#7c3aed'),
  payment_report: icon(webIcons.card, undefined, '#16a34a'),
  expense_report: icon(a.expenses, undefined, '#059669'),
  stock_report: icon(a.warehouse_stocks, undefined, '#0e7490'),
  low_stock_report: icon(webIcons.alert, undefined, '#dc2626'),
  shift_report: icon(webIcons.clock, undefined, '#0f766e'),
  sales_chart: icon(webIcons.trendUp, undefined, '#4f46e5'),
  expense_chart: icon(webIcons.trendDown, undefined, '#e11d48'),

  backup_center: icon(a.cloud_sync, undefined, '#5b21b6'),
  import_master_data: icon(webIcons.upload, undefined, '#0ea5e9'),
  settings: icon(a.settings, c.settings, '#475569'),
}

export const fallbackModuleIcon: ModuleIcon = { shapes: webIcons.tag, color: '#64748b' }

export function getModuleIcon(key: string): ModuleIcon {
  return moduleIcons[key] || fallbackModuleIcon
}
