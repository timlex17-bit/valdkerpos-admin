import { changeBetween, type Change } from './reportPeriods'

/**
 * Reading figures out of a report summary.
 *
 * The backend sends the same number under several names (`total_revenue`,
 * `revenue`, `total_sales`) and simply omits what a shop does not have, so a
 * figure is looked up by a list of aliases and is allowed to be absent. Absent
 * is not zero: a card for a number the backend never sent is noise, and a shop
 * with genuinely zero sales must still see a zero.
 */

export type FigureKey =
  | 'revenue'
  | 'grossProfit'
  | 'expenses'
  | 'netIncome'
  | 'orders'
  | 'averageOrder'
  | 'productSold'
  | 'discount'
  | 'tax'
  | 'cost'
  | 'margin'
  | 'lowStock'
  | 'outOfStock'

export const FIGURE_ALIASES: Record<FigureKey, string[]> = {
  revenue: ['total_revenue', 'revenue', 'total_sales', 'sales'],
  grossProfit: ['gross_profit', 'profit_gross'],
  expenses: ['total_expenses', 'total_expense', 'expenses', 'expense'],
  netIncome: ['net_income', 'net_profit', 'net'],
  orders: ['total_orders', 'orders_count', 'order_count'],
  averageOrder: ['average_order_value', 'aov'],
  productSold: ['total_product_sold', 'product_sold', 'total_items'],
  discount: ['total_discount', 'discount'],
  tax: ['total_tax', 'tax'],
  cost: ['total_cost', 'cost'],
  margin: ['profit_margin_percent', 'margin_percentage', 'margin_percent', 'margin'],
  lowStock: ['low_stock_count', 'low_stock'],
  outOfStock: ['out_of_stock_count', 'out_of_stock'],
}

/**
 * The figure under any of its names, as a number.
 *
 * `null` means the backend did not send it. Note `net` is deliberately not an
 * alias of `netIncome` alone - it is listed there because the API uses it for
 * net income, while `net_sales` belongs to revenue and must not be mixed in.
 */
export function readFigure(summary: Record<string, unknown> | null | undefined, key: FigureKey) {
  if (!summary) return null

  for (const alias of FIGURE_ALIASES[key]) {
    const value = summary[alias]
    if (value === undefined || value === null || value === '') continue

    const parsed = typeof value === 'number' ? value : Number(String(value))
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

export type Figure = {
  key: FigureKey
  value: number
  change: Change | null
}

/**
 * The figures to show, in the order an owner asks the questions: what came in,
 * what was left, what went out, what remains. Figures the backend did not send
 * are left out entirely rather than shown as a dash.
 */
export function collectFigures(
  summary: Record<string, unknown> | null | undefined,
  previous: Record<string, unknown> | null | undefined,
  keys: FigureKey[]
): Figure[] {
  return keys
    .map((key) => {
      const value = readFigure(summary, key)
      if (value === null) return null

      return { key, value, change: changeBetween(value, readFigure(previous, key)) }
    })
    .filter((figure): figure is Figure => figure !== null)
}
