<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { canShowModule } from '@/utils/moduleVisibility'
import { useI18n } from 'vue-i18n'
import { getApiErrorMessage } from '@/utils/apiError'
import reportService, { type ReportParams } from '@/services/reportService'
import {
  PERIOD_PRESETS,
  comparisonPeriod,
  matchPreset,
  resolvePeriod,
  toIsoDate,
  type Change,
  type DateRange,
  type PeriodPreset,
} from '@/utils/reportPeriods'
import { collectFigures, type Figure, type FigureKey } from '@/utils/reportFigures'
import {
  loadFilterOptions,
  type FilterOption,
  type FilterOptionKind,
} from '@/services/filterOptions'

type BusinessType = 'retail' | 'restaurant' | 'workshop'
type ReportKey =
  | 'dashboard'
  | 'sales'
  | 'sales_items'
  | 'payments'
  | 'expenses'
  | 'stock'
  | 'low_stock'
  | 'shifts'

type ReportPayload = {
  summary?: Record<string, unknown>
  results?: Record<string, unknown>[]
  rows?: Record<string, unknown>[]
  data?: Record<string, unknown>[] | Record<string, unknown>
  count?: number
  next?: string | null
  previous?: string | null
  page?: number
  page_size?: number
  breakdown?: Record<string, unknown>
  shop?: {
    id?: string | number
    name?: string
    business_type?: string
  }
}

type Column = {
  label: string
  keys: string[]
  type?: 'text' | 'currency' | 'number' | 'date' | 'datetime' | 'badge' | 'percent'
}

type StoredUser = {
  username?: string
  role?: string
  shop_id?: string | number
  shop_name?: string
  shop_business_type?: string
  is_superuser?: boolean
  is_platform_admin?: boolean
}

type StoredShop = {
  id?: string | number
  name?: string
  business_type?: string
}

const route = useRoute()
const { t, te, locale } = useI18n()

// Tabs, summary cards, table columns and chart titles are defined below with
// an English label that also serves as their stable identity (v-for keys).
// label() turns that English label into the current language at render time.
function label(english: string) {
  const key = `reportCenter.labels.${english
    .replace(/%/g, ' Percent')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word, index) => (index ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()))
    .join('')}`
  return te(key) ? t(key) : english
}

const numberLocale = computed(() => (locale.value === 'id' || locale.value === 'tet' ? 'id-ID' : 'en-US'))
const dateLocale = computed(() => (locale.value === 'id' ? 'id-ID' : locale.value === 'tet' ? 'pt-PT' : 'en-US'))

const tabs: Array<{ key: ReportKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard Summary' },
  { key: 'sales', label: 'Sales' },
  { key: 'sales_items', label: 'Sales Items' },
  { key: 'payments', label: 'Payments' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'stock', label: 'Stock' },
  { key: 'low_stock', label: 'Low Stock' },
  { key: 'shifts', label: 'Shifts' },
]

// Local calendar dates, not UTC. toISOString() turned "1 September" into
// "31 August" for a shop in Dili (UTC+9), so the default range quietly began a
// day early and "this month" never matched the month it claimed to show.
const today = toIsoDate(new Date())
const startOfMonth = toIsoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const loading = ref(false)
const exportLoading = ref<'pdf' | 'xlsx' | ''>('')
const errorMessage = ref('')
const accessDenied = ref(false)
const activeReport = ref<ReportKey>('dashboard')
const rawPayload = ref<ReportPayload>({})
const responseBusinessType = ref('')
/** The same report over the comparison period, for the overview only. */
const previousSummary = ref<Record<string, unknown> | null>(null)
const customDatesOpen = ref(false)
const advancedOpen = ref(false)
/** Names for the pickers; a kind missing here falls back to an ID box. */
const filterOptions = ref<Partial<Record<FilterOptionKind, FilterOption[]>>>({})

// The values the backend accepts, taken from pos/api_reports.py rather than
// guessed: `status` is only paid/unpaid there, and the old free-text box
// suggesting "PAID, PENDING..." silently matched nothing for PENDING.
const ITEM_TYPES = ['product', 'menu', 'service', 'sparepart'] as const
const ORDER_TYPES = ['GENERAL', 'DINE_IN', 'TAKE_OUT', 'DELIVERY'] as const

const filters = ref<Record<string, string | number>>({
  start_date: startOfMonth,
  end_date: today,
  cashier_id: '',
  customer_id: '',
  payment_method: '',
  status: '',
  search: '',
  page: 1,
  page_size: 25,
  shop_id: '',
  item_type: '',
  order_type: '',
  table_number: '',
  waiter_id: '',
  menu_category: '',
  product_id: '',
  category_id: '',
  supplier_id: '',
  warehouse_id: '',
  sku: '',
  barcode: '',
  stock_status: '',
})

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

const storedUser = computed(() => readJson<StoredUser>('user'))
const storedShop = computed(() => readJson<StoredShop>('shop'))

const isPlatformAdmin = computed(() => {
  const user = storedUser.value
  const role = String(user?.role || '').toLowerCase()
  return Boolean(user?.is_superuser || user?.is_platform_admin || role === 'superuser' || role === 'platform_admin')
})

const currentShopName = computed(() => {
  return rawPayload.value.shop?.name || storedShop.value?.name || storedUser.value?.shop_name || t('reportCenter.currentShop')
})

const currentShopId = computed(() => {
  return rawPayload.value.shop?.id || storedShop.value?.id || storedUser.value?.shop_id || ''
})

const currentBusinessType = computed<BusinessType>(() => {
  return normalizeBusinessType(
    responseBusinessType.value ||
      rawPayload.value.shop?.business_type ||
      storedUser.value?.shop_business_type ||
      storedShop.value?.business_type
  )
})

const currentBusinessTypeLabel = computed(() => currentBusinessType.value.toUpperCase())

const reportTitle = computed(() => {
  const tab = tabs.find((item) => item.key === activeReport.value)
  return tab ? tabLabel(tab) : t('menu.reports')
})

const summary = computed(() => rawPayload.value.summary || {})
const rows = computed<Record<string, unknown>[]>(() => {
  const payload = rawPayload.value

  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && typeof payload.data === 'object' && Array.isArray((payload.data as ReportPayload).results)) {
    return (payload.data as ReportPayload).results || []
  }

  return []
})

const totalRows = computed(() => rawPayload.value.count ?? rows.value.length)
const pageCount = computed(() => Math.max(Math.ceil(totalRows.value / Number(filters.value.page_size || 25)), 1))
const hasSummaryData = computed(() => Object.keys(summary.value).length > 0)
const hasBreakdownData = computed(() => {
  const breakdown = rawPayload.value.breakdown || {}
  return Object.values(breakdown).some((value) => normalizeBreakdown(value).length > 0)
})

const activeParams = computed<ReportParams>(() => {
  const params: ReportParams = {
    start_date: filters.value.start_date,
    end_date: filters.value.end_date,
    cashier_id: filters.value.cashier_id,
    customer_id: filters.value.customer_id,
    payment_method: filters.value.payment_method,
    status: filters.value.status,
    search: filters.value.search,
    page: filters.value.page,
    page_size: filters.value.page_size,
  }

  if (isPlatformAdmin.value && filters.value.shop_id) {
    params.shop_id = filters.value.shop_id
  }

  if (currentBusinessType.value === 'workshop') {
    // Only item_type: pos/api_reports.py accepts vehicle_plate, mechanic_id
    // and service_status but never filters on them, so offering those boxes
    // promised a narrowing that never happened.
    Object.assign(params, { item_type: filters.value.item_type })
  }

  if (currentBusinessType.value === 'restaurant') {
    Object.assign(params, {
      order_type: String(filters.value.order_type || '').toUpperCase(),
      table_number: filters.value.table_number,
      waiter_id: filters.value.waiter_id,
      menu_category: filters.value.menu_category,
    })
  }

  if (currentBusinessType.value === 'retail') {
    Object.assign(params, {
      product_id: filters.value.product_id,
      category_id: filters.value.category_id,
      supplier_id: filters.value.supplier_id,
      warehouse_id: filters.value.warehouse_id,
      sku: filters.value.sku,
      barcode: filters.value.barcode,
      stock_status: filters.value.stock_status,
    })
  }

  return params
})

/**
 * The overview: the four figures an owner actually asks about, each measured
 * against the same stretch of the previous period, and the same numbers
 * written out as a sentence above them. Everything is read from the backend
 * summary and nothing is recomputed here, so the sentence cannot disagree with
 * the cards or with the tables below it.
 */
const PRIMARY_FIGURES: FigureKey[] = ['revenue', 'grossProfit', 'expenses', 'netIncome']
const SECONDARY_FIGURES: FigureKey[] = [
  'orders',
  'averageOrder',
  'productSold',
  'margin',
  'lowStock',
  'outOfStock',
]

const FIGURE_TYPES: Record<FigureKey, 'currency' | 'number' | 'percent'> = {
  revenue: 'currency',
  grossProfit: 'currency',
  expenses: 'currency',
  netIncome: 'currency',
  orders: 'number',
  averageOrder: 'currency',
  productSold: 'number',
  discount: 'currency',
  tax: 'currency',
  cost: 'currency',
  margin: 'percent',
  lowStock: 'number',
  outOfStock: 'number',
}

const isOverview = computed(() => activeReport.value === 'dashboard')

/**
 * Sidebar now lists three entries; everything else is reached from the tabs
 * here, so the tabs must obey the same permissions the sidebar did. A tab for
 * a report the backend refuses only leads to "you do not have access".
 */
const TAB_MODULE_KEYS: Record<ReportKey, string> = {
  dashboard: 'reports',
  sales: 'sales_report',
  sales_items: 'sales_items_report',
  payments: 'payment_report',
  expenses: 'expense_report',
  stock: 'stock_report',
  low_stock: 'low_stock_report',
  shifts: 'shift_report',
}

const visibleTabs = computed(() =>
  tabs.filter((tab) => canShowModule(TAB_MODULE_KEYS[tab.key], storedUser.value))
)

/** The two chart pages, still modules of their own, reached from here. */
const chartPages = computed(() =>
  [
    { key: 'sales_chart', route: '/sales-chart', label: t('menu.salesChart') },
    { key: 'expense_chart', route: '/expense-chart', label: t('menu.expenseChart') },
  ].filter((page) => canShowModule(page.key, storedUser.value))
)

/** The first tab is the page's own overview: it is named like the menu entry
 *  that leads here, not "Dashboard Summary", which sounded like the Dashboard. */
function tabLabel(tab: { key: ReportKey; label: string }) {
  return tab.key === 'dashboard' ? t('menu.reportsOverview') : label(tab.label)
}

/** Only the sales report has an export endpoint (reports/sales/export/). */
const canExport = computed(() => activeReport.value === 'sales')

const currentRange = computed<DateRange>(() => ({
  start: String(filters.value.start_date),
  end: String(filters.value.end_date),
}))

const activePreset = computed<PeriodPreset>(() => matchPreset(currentRange.value))
const comparisonRange = computed(() => comparisonPeriod(currentRange.value))

const primaryFigures = computed(() =>
  collectFigures(summary.value, previousSummary.value, PRIMARY_FIGURES)
)
const secondaryFigures = computed(() =>
  collectFigures(summary.value, previousSummary.value, SECONDARY_FIGURES)
)

function figureOf(key: FigureKey) {
  return [...primaryFigures.value, ...secondaryFigures.value].find((figure) => figure.key === key)
}

function figureValue(figure: Figure) {
  // Percentages go through formatPercent so a margin reads the same in the
  // card as in the sentence above it.
  return FIGURE_TYPES[figure.key] === 'percent'
    ? formatPercent(figure.value)
    : formatTypedValue(figure.value, FIGURE_TYPES[figure.key])
}

function figureLabel(key: FigureKey) {
  return t(`reportCenter.figures.${key}`)
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat(numberLocale.value, { maximumFractionDigits: 1 }).format(Math.abs(value))}%`
}

/** "up 12.5%", or only "up" when a percentage would be dishonest. */
function changeText(change: Change | null) {
  if (!change) return ''
  if (change.direction === 'flat') return t('reportCenter.change.flat')
  // "up from nothing" says what happened; "up 100%" from zero would not.
  if (change.fromNothing) return t(`reportCenter.change.${change.direction}FromZero`)
  if (change.percent === null) return t(`reportCenter.change.${change.direction}Plain`)
  return t(`reportCenter.change.${change.direction}`, { percent: formatPercent(change.percent) })
}

const periodLabel = computed(() =>
  activePreset.value === 'custom'
    ? `${formatDate(currentRange.value.start)} - ${formatDate(currentRange.value.end)}`
    : t(`reportCenter.period.${activePreset.value}`)
)

const comparisonLabel = computed(
  () => `${formatDate(comparisonRange.value.start)} - ${formatDate(comparisonRange.value.end)}`
)

/**
 * The overview in words. Each sentence is built only from figures the backend
 * sent, so a shop that records no expenses gets a shorter summary rather than
 * a confident sentence about zero.
 */
const headlineSentences = computed(() => {
  if (!isOverview.value || !hasSummaryData.value) return []

  const sentences: string[] = []
  const revenue = figureOf('revenue')
  const orders = figureOf('orders')
  const grossProfit = figureOf('grossProfit')
  const margin = figureOf('margin')
  const expenses = figureOf('expenses')
  const net = figureOf('netIncome')

  if (revenue) {
    const amount = formatCurrency(revenue.value)
    const base = orders
      ? t('reportCenter.headline.revenueWithOrders', {
          period: periodLabel.value,
          amount,
          orders: t('reportCenter.headline.orderCount', orders.value),
        })
      : t('reportCenter.headline.revenue', { period: periodLabel.value, amount })

    const comparison = changeText(revenue.change)
    sentences.push(
      comparison
        ? t('reportCenter.headline.comparedTo', {
            base,
            change: comparison,
            period: comparisonLabel.value,
          })
        : t('reportCenter.headline.plain', { base })
    )
  }

  if (grossProfit) {
    sentences.push(
      margin
        ? t('reportCenter.headline.profitWithMargin', {
            amount: formatCurrency(grossProfit.value),
            margin: formatPercent(margin.value),
          })
        : t('reportCenter.headline.profit', { amount: formatCurrency(grossProfit.value) })
    )
  }

  if (expenses) {
    const spent = formatCurrency(expenses.value)
    if (!net) {
      sentences.push(t('reportCenter.headline.expensesOnly', { amount: spent }))
    } else {
      const key = net.value < 0 ? 'expensesNetLoss' : 'expensesNetProfit'
      sentences.push(
        t(`reportCenter.headline.${key}`, {
          expenses: spent,
          net: formatCurrency(Math.abs(net.value)),
        })
      )
    }
  }

  return sentences
})

const summaryCards = computed(() => {
  const universal = [
    card('Total Revenue', ['total_revenue', 'revenue', 'total_sales', 'sales'], 'currency'),
    card('Net Sales', ['net_sales', 'net', 'net_revenue'], 'currency'),
    card('Gross Profit', ['gross_profit', 'profit'], 'currency'),
    card('Total Orders', ['total_orders', 'orders_count', 'order_count'], 'number'),
    card('Total Discount', ['total_discount', 'discount'], 'currency'),
    card('Total Tax', ['total_tax', 'tax'], 'currency'),
  ]

  const specific: Record<BusinessType, ReturnType<typeof card>[]> = {
    workshop: [
      card('Service Revenue', ['total_service_revenue', 'service_revenue', 'service'], 'currency'),
      card('Sparepart Revenue', ['total_sparepart_revenue', 'sparepart_revenue', 'sparepart'], 'currency'),
      card('Menu Revenue', ['total_menu_revenue', 'menu_revenue', 'menu'], 'currency'),
      card('Service Jobs', ['total_service_jobs', 'service_jobs', 'jobs_count'], 'number'),
      card('Average Order Value', ['average_order_value', 'aov'], 'currency'),
    ],
    restaurant: [
      card('Dine In Revenue', ['dine_in_revenue', 'total_dine_in_revenue', 'dine_in'], 'currency'),
      card('Takeaway Revenue', ['takeaway_revenue', 'total_takeaway_revenue', 'takeaway'], 'currency'),
      card('Delivery Revenue', ['delivery_revenue', 'total_delivery_revenue', 'delivery'], 'currency'),
      card('Delivery Fee', ['delivery_fee', 'total_delivery_fee'], 'currency'),
      card('Service Charge', ['service_charge', 'total_service_charge'], 'currency'),
      card('Average Order Value', ['average_order_value', 'aov'], 'currency'),
    ],
    retail: [
      card('Product Sold', ['total_product_sold', 'product_sold', 'total_items', 'quantity'], 'number'),
      card('Total Cost', ['total_cost', 'cost'], 'currency'),
      card('Gross Profit', ['gross_profit', 'profit'], 'currency'),
      card('Margin %', ['margin_percentage', 'margin_percent', 'margin'], 'percent'),
      card('Low Stock', ['low_stock', 'low_stock_count'], 'number'),
      card('Out of Stock', ['out_of_stock', 'out_of_stock_count'], 'number'),
    ],
  }

  return [...universal, ...specific[currentBusinessType.value]].filter((item) => item.present)
})

const tableColumns = computed<Column[]>(() => {
  if (activeReport.value === 'payments') {
    return [
      col('Date', ['date', 'created_at', 'payment_date'], 'date'),
      col('Payment Method', ['payment_method', 'payment_method_name', 'method'], 'badge'),
      col('Transaction Count', ['transaction_count', 'transactions', 'count'], 'number'),
      col('Total Amount', ['total_amount', 'amount', 'total'], 'currency'),
      col('Cashier', ['cashier', 'cashier_name', 'user_name']),
    ]
  }

  if (activeReport.value === 'expenses') {
    return [
      col('Date', ['date', 'created_at', 'expense_date'], 'date'),
      col('Name', ['name', 'title', 'expense_name']),
      col('Category', ['category', 'category_name']),
      col('Amount', ['amount', 'total_amount'], 'currency'),
      col('Note', ['note', 'description', 'remarks']),
      col('Created By', ['created_by', 'created_by_name', 'user_name']),
    ]
  }

  if (activeReport.value === 'stock') {
    return [
      col('Product', ['product_name', 'product', 'name']),
      col('SKU', ['sku', 'product_sku']),
      col('Barcode', ['barcode']),
      col('Category', ['category', 'category_name']),
      col('Warehouse', ['warehouse', 'warehouse_name']),
      col('Current Stock', ['current_stock', 'stock', 'quantity'], 'number'),
      col('Minimum Stock', ['minimum_stock', 'min_stock'], 'number'),
      col('Stock Status', ['stock_status', 'status'], 'badge'),
    ]
  }

  if (activeReport.value === 'low_stock') {
    return [
      col('Product', ['product_name', 'product', 'name']),
      col('SKU', ['sku', 'product_sku']),
      col('Barcode', ['barcode']),
      col('Warehouse', ['warehouse', 'warehouse_name']),
      col('Current Stock', ['current_stock', 'stock', 'quantity'], 'number'),
      col('Minimum Stock', ['minimum_stock', 'min_stock'], 'number'),
    ]
  }

  if (activeReport.value === 'shifts') {
    return [
      col('Cashier', ['cashier', 'cashier_name', 'user_name']),
      col('Opened At', ['opened_at', 'open_time'], 'datetime'),
      col('Closed At', ['closed_at', 'close_time'], 'datetime'),
      col('Opening Cash', ['opening_cash', 'start_cash'], 'currency'),
      col('Closing Cash', ['closing_cash', 'end_cash'], 'currency'),
      col('Expected Cash', ['expected_cash'], 'currency'),
      col('Difference', ['difference', 'cash_difference'], 'currency'),
      col('Status', ['status'], 'badge'),
    ]
  }

  if (currentBusinessType.value === 'workshop') {
    return [
      col('Date', ['date', 'created_at', 'order_date'], 'date'),
      col('Invoice', ['invoice', 'invoice_number', 'invoice_id']),
      col('Customer', ['customer', 'customer_name']),
      col('Vehicle Plate', ['vehicle_plate', 'plate_number']),
      col('Item Name', ['item_name', 'product_name', 'service_name', 'name']),
      col('Item Type', ['item_type', 'type'], 'badge'),
      col('Category', ['category', 'category_name']),
      col('Qty', ['qty', 'quantity'], 'number'),
      col('Unit Price', ['unit_price', 'price'], 'currency'),
      col('Discount', ['discount', 'discount_amount'], 'currency'),
      col('Tax', ['tax', 'tax_amount'], 'currency'),
      col('Subtotal', ['subtotal', 'line_total', 'total'], 'currency'),
      col('Profit', ['profit', 'gross_profit'], 'currency'),
      col('Payment Method', ['payment_method', 'payment_method_name'], 'badge'),
      col('Cashier', ['cashier', 'cashier_name']),
      col('Mechanic', ['mechanic', 'mechanic_name']),
    ]
  }

  if (currentBusinessType.value === 'restaurant') {
    return [
      col('Date', ['date', 'created_at', 'order_date'], 'date'),
      col('Invoice', ['invoice', 'invoice_number', 'invoice_id']),
      col('Order Type', ['order_type'], 'badge'),
      col('Table', ['table_number', 'table']),
      col('Customer', ['customer', 'customer_name']),
      col('Item Name', ['item_name', 'product_name', 'menu_name', 'name']),
      col('Category', ['category', 'category_name', 'menu_category']),
      col('Qty', ['qty', 'quantity'], 'number'),
      col('Unit Price', ['unit_price', 'price'], 'currency'),
      col('Addon/Modifier', ['addon', 'modifier', 'addons', 'modifiers']),
      col('Discount', ['discount', 'discount_amount'], 'currency'),
      col('Tax', ['tax', 'tax_amount'], 'currency'),
      col('Service Charge', ['service_charge'], 'currency'),
      col('Delivery Fee', ['delivery_fee'], 'currency'),
      col('Subtotal', ['subtotal', 'line_total', 'total'], 'currency'),
      col('Payment Method', ['payment_method', 'payment_method_name'], 'badge'),
      col('Cashier', ['cashier', 'cashier_name']),
      col('Waiter', ['waiter', 'waiter_name']),
    ]
  }

  return [
    col('Date', ['date', 'created_at', 'order_date'], 'date'),
    col('Invoice', ['invoice', 'invoice_number', 'invoice_id']),
    col('Product Name', ['product_name', 'item_name', 'name']),
    col('SKU', ['sku', 'product_sku']),
    col('Barcode', ['barcode']),
    col('Category', ['category', 'category_name']),
    col('Supplier', ['supplier', 'supplier_name']),
    col('Warehouse', ['warehouse', 'warehouse_name']),
    col('Qty', ['qty', 'quantity'], 'number'),
    col('Unit Price', ['unit_price', 'price'], 'currency'),
    col('Cost Price', ['cost_price', 'cost'], 'currency'),
    col('Discount', ['discount', 'discount_amount'], 'currency'),
    col('Tax', ['tax', 'tax_amount'], 'currency'),
    col('Subtotal', ['subtotal', 'line_total', 'total'], 'currency'),
    col('Profit', ['profit', 'gross_profit'], 'currency'),
    col('Margin %', ['margin_percentage', 'margin_percent', 'margin'], 'percent'),
    col('Payment Method', ['payment_method', 'payment_method_name'], 'badge'),
    col('Cashier', ['cashier', 'cashier_name']),
  ]
})

const chartSections = computed(() => {
  const breakdown = rawPayload.value.breakdown || {}

  return [
    { title: 'Sales by Date', rows: normalizeBreakdown(breakdown.by_date), valueType: 'currency' },
    { title: 'Sales by Category', rows: normalizeBreakdown(breakdown.by_category), valueType: 'currency' },
    { title: 'Payment Method Breakdown', rows: normalizeBreakdown(breakdown.by_payment_method), valueType: 'currency' },
    { title: 'Top Products / Top Items', rows: normalizeBreakdown(breakdown.top_products || breakdown.top_items), valueType: 'number' },
    { title: 'Profit Trend', rows: normalizeBreakdown(breakdown.profit_trend), valueType: 'currency' },
  ].filter((section) => section.rows.length > 0)
})

function normalizeBusinessType(value: unknown): BusinessType {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'restaurant') return 'restaurant'
  if (normalized === 'workshop') return 'workshop'
  return 'retail'
}

function card(label: string, keys: string[], type: 'currency' | 'number' | 'percent') {
  const raw = readFirst(summary.value, keys)

  return {
    label,
    keys,
    type,
    // A card for a number the backend never sent says nothing; `present`
    // keeps it off the page instead of showing a dash or a made-up zero.
    present: raw !== null,
    value: formatTypedValue(raw, type),
  }
}

function col(label: string, keys: string[], type: Column['type'] = 'text'): Column {
  return { label, keys, type }
}

function readFirst(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value
  }

  return null
}

function getCellValue(row: Record<string, unknown>, column: Column) {
  return readFirst(row, column.keys)
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat(numberLocale.value, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(asNumber(value))
}

function formatDate(value: unknown, withTime = false) {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat(dateLocale.value, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function formatTypedValue(value: unknown, type: Column['type']) {
  if (value === null || value === undefined || value === '') return type === 'currency' ? formatCurrency(0) : '-'
  if (type === 'currency') return formatCurrency(value)
  if (type === 'number') return new Intl.NumberFormat(numberLocale.value).format(asNumber(value))
  if (type === 'percent') return `${asNumber(value).toFixed(2)}%`
  if (type === 'date') return formatDate(value)
  if (type === 'datetime') return formatDate(value, true)
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return String((value as { name?: unknown }).name || JSON.stringify(value))
  return String(value)
}

function badgeClass(value: unknown) {
  const normalized = String(value || '').toUpperCase()

  if (['SERVICE', 'DINE_IN', 'PAID', 'CLOSED', 'COMPLETED', 'IN_STOCK'].includes(normalized)) {
    return 'badge-green'
  }

  if (['SPAREPART', 'DELIVERY', 'PENDING', 'OPEN', 'LOW_STOCK'].includes(normalized)) {
    return normalized === 'PENDING' || normalized === 'OPEN' || normalized === 'LOW_STOCK'
      ? 'badge-yellow'
      : 'badge-orange'
  }

  if (['MENU', 'TAKEAWAY'].includes(normalized)) return 'badge-blue'
  if (['CANCELLED', 'VOID', 'RETURNED', 'OUT_OF_STOCK'].includes(normalized)) return 'badge-red'

  return 'badge-gray'
}

function routeToReport(): ReportKey {
  const routeName = String(route.name || '')
  const queryTab = String(route.query.tab || '') as ReportKey
  const path = route.path

  if (tabs.some((tab) => tab.key === queryTab)) return queryTab
  if (routeName.includes('sales-items') || path.includes('sales-items')) return 'sales_items'
  if (routeName.includes('payment') || path.includes('payment')) return 'payments'
  if (routeName.includes('expense')) return 'expenses'
  if (routeName.includes('stock') && routeName.includes('low')) return 'low_stock'
  if (routeName.includes('stock')) return 'stock'
  if (routeName.includes('shift')) return 'shifts'
  if (routeName.includes('sales')) return 'sales'
  return 'dashboard'
}

function serviceForReport(report: ReportKey) {
  const services = {
    dashboard: reportService.getDashboardSummary,
    sales: reportService.getSalesReport,
    sales_items: reportService.getSalesItemsReport,
    payments: reportService.getPaymentsReport,
    expenses: reportService.getExpensesReport,
    stock: reportService.getStockReport,
    low_stock: reportService.getLowStockReport,
    shifts: reportService.getShiftsReport,
  }

  return services[report]
}

async function fetchReport() {
  loading.value = true
  errorMessage.value = ''
  accessDenied.value = false

  try {
    const response = await serviceForReport(activeReport.value)(activeParams.value)
    const payload = (response.data || {}) as ReportPayload
    rawPayload.value = payload

    if (payload.shop?.business_type) {
      responseBusinessType.value = payload.shop.business_type
    }

    await fetchComparison()
  } catch (error: unknown) {
    rawPayload.value = {}
    previousSummary.value = null

    accessDenied.value = axios.isAxiosError(error) && error.response?.status === 403
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      errorMessage.value = t('reportCenter.sessionExpired')
    } else if (accessDenied.value) {
      errorMessage.value = t('reportCenter.accessDenied')
    } else {
      errorMessage.value = getApiErrorMessage(error, t('reportCenter.loadFailed'))
    }
  } finally {
    loading.value = false
  }
}

/**
 * The overview also asks for the comparison period. It is a second read of the
 * same endpoint, so a failure here costs only the little "up or down" line: the
 * report itself stays on screen with no comparison rather than an error.
 */
async function fetchComparison() {
  if (!isOverview.value) {
    previousSummary.value = null
    return
  }

  try {
    const range = comparisonRange.value
    const response = await serviceForReport(activeReport.value)({
      ...activeParams.value,
      start_date: range.start,
      end_date: range.end,
      page: 1,
      page_size: 1,
    })
    previousSummary.value = ((response.data || {}) as ReportPayload).summary || null
  } catch {
    previousSummary.value = null
  }
}

/** Which pickers this shop's advanced filters need. */
const filterKindsForShop = computed<FilterOptionKind[]>(() => {
  const shared: FilterOptionKind[] = ['cashier', 'customer']

  if (currentBusinessType.value === 'restaurant') return [...shared, 'waiter']
  if (currentBusinessType.value === 'workshop') return shared
  return [...shared, 'product', 'category', 'supplier', 'warehouse']
})

function optionsFor(kind: FilterOptionKind) {
  return filterOptions.value[kind] || null
}

/** False only while the shop has nothing of this kind to filter by. */
function showsFilter(kind: FilterOptionKind) {
  const options = filterOptions.value[kind]
  return options === undefined || options.length > 0
}

/**
 * Names are fetched when the advanced filters are opened, not on page load:
 * most visits never open them, and a report page should not pull the whole
 * product list to show four cards.
 */
async function loadFilterNames() {
  const kinds = filterKindsForShop.value.filter((kind) => !(kind in filterOptions.value))

  await Promise.all(
    kinds.map(async (kind) => {
      const options = await loadFilterOptions(kind)
      // null means the list is not readable for this user: leave the kind
      // unset so the template keeps the plain ID box for it. An empty list
      // means the shop has none of these yet, and the filter is dropped.
      if (options) filterOptions.value = { ...filterOptions.value, [kind]: options }
    })
  )
}

function toggleAdvanced() {
  advancedOpen.value = !advancedOpen.value
  if (advancedOpen.value) void loadFilterNames()
}

/** Filters in force beyond the period and the search box. */
const ADVANCED_FILTER_KEYS = [
  'payment_method',
  'cashier_id',
  'customer_id',
  'status',
  'shop_id',
  'item_type',
  'order_type',
  'table_number',
  'waiter_id',
  'menu_category',
  'product_id',
  'category_id',
  'supplier_id',
  'warehouse_id',
  'sku',
  'barcode',
  'stock_status',
]

const activeAdvancedCount = computed(
  () => ADVANCED_FILTER_KEYS.filter((key) => String(filters.value[key] ?? '').trim() !== '').length
)

const hasActiveFilters = computed(
  () => activeAdvancedCount.value > 0 || String(filters.value.search || '').trim() !== ''
)

function setPeriodPreset(preset: PeriodPreset) {
  if (preset === 'custom') {
    customDatesOpen.value = true
    return
  }

  const range = resolvePeriod(preset)
  if (!range) return

  customDatesOpen.value = false
  filters.value.start_date = range.start
  filters.value.end_date = range.end
  filters.value.page = 1
  void fetchReport()
}

function setActiveReport(report: ReportKey) {
  activeReport.value = report
  filters.value.page = 1
  void fetchReport()
}

function applyFilters() {
  filters.value.page = 1
  void fetchReport()
}

function resetFilters() {
  filters.value = {
    ...filters.value,
    start_date: startOfMonth,
    end_date: today,
    cashier_id: '',
    customer_id: '',
    payment_method: '',
    status: '',
    search: '',
    page: 1,
    page_size: 25,
    shop_id: '',
    item_type: '',
    order_type: '',
    table_number: '',
    waiter_id: '',
    menu_category: '',
    product_id: '',
    category_id: '',
    supplier_id: '',
    warehouse_id: '',
    sku: '',
    barcode: '',
    stock_status: '',
  }

  void fetchReport()
}

async function exportSales(format: 'pdf' | 'xlsx') {
  exportLoading.value = format

  try {
    const response = await reportService.exportSalesReport(format, activeParams.value)
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-report-${today}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      errorMessage.value = t('reportCenter.sessionExpired')
    } else if (axios.isAxiosError(error) && error.response?.status === 403) {
      errorMessage.value = t('reportCenter.accessDenied')
    } else {
      errorMessage.value = t('reportCenter.exportFailed', { format: format.toUpperCase() })
    }
  } finally {
    exportLoading.value = ''
  }
}

function changePage(nextPage: number) {
  filters.value.page = Math.min(Math.max(nextPage, 1), pageCount.value)
  void fetchReport()
}

function printReport() {
  window.print()
}

function normalizeBreakdown(value: unknown) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          return {
            label: String(record.label || record.name || record.date || record.category || record.payment_method || t('reportCenter.itemNumber', { n: index + 1 })),
            value: asNumber(record.value || record.amount || record.total || record.sales || record.quantity || record.count),
          }
        }

        return { label: t('reportCenter.itemNumber', { n: index + 1 }), value: asNumber(item) }
      })
      .filter((item) => item.label)
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([label, item]) => ({
      label,
      value: asNumber(item),
    }))
  }

  return []
}

function maxBreakdownValue(items: Array<{ value: number }>) {
  return Math.max(...items.map((item) => item.value), 1)
}

watch(
  () => route.fullPath,
  () => {
    activeReport.value = routeToReport()
    void fetchReport()
  }
)

onMounted(() => {
  const requested = routeToReport()
  // The route guard already refused a report this user may not open; this
  // only covers the tab the page defaults to.
  const allowed = visibleTabs.value.some((tab) => tab.key === requested)
  activeReport.value = allowed ? requested : (visibleTabs.value[0]?.key ?? requested)
  void fetchReport()
})
</script>

<template>
  <div class="reports-page">
    <section class="reports-header">
      <div>
        <p class="eyebrow">{{ t('menu.reports') }}</p>
        <h1>{{ reportTitle }}</h1>
        <div class="header-meta">
          <span>{{ currentShopName }}</span>
          <span class="business-badge">{{ currentBusinessTypeLabel }}</span>
          <span v-if="currentShopId">{{ t('reportCenter.shopId', { id: currentShopId }) }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-light" type="button" :disabled="loading" @click="fetchReport">
          {{ loading ? t('dashboardPage.refreshing') : t('common.refresh') }}
        </button>
        <button
          v-if="canExport"
          class="btn btn-light"
          type="button"
          :disabled="Boolean(exportLoading)"
          @click="exportSales('pdf')"
        >
          {{ exportLoading === 'pdf' ? t('reportCenter.exporting') : t('reportCenter.exportPdf') }}
        </button>
        <button
          v-if="canExport"
          class="btn btn-light"
          type="button"
          :disabled="Boolean(exportLoading)"
          @click="exportSales('xlsx')"
        >
          {{ exportLoading === 'xlsx' ? t('reportCenter.exporting') : t('reportCenter.exportExcel') }}
        </button>
        <button class="btn btn-primary" type="button" @click="printReport">{{ t('reportCenter.print') }}</button>
      </div>
    </section>

    <section class="period-bar">
      <span class="period-caption">{{ t('reportCenter.period.caption') }}</span>
      <div class="period-buttons">
        <button
          v-for="preset in PERIOD_PRESETS"
          :key="preset"
          class="period-button"
          :class="{ active: activePreset === preset || (preset === 'custom' && customDatesOpen) }"
          type="button"
          :disabled="loading"
          @click="setPeriodPreset(preset)"
        >
          {{ t(`reportCenter.period.${preset}`) }}
        </button>
      </div>
      <div v-if="activePreset === 'custom' || customDatesOpen" class="period-dates">
        <input v-model="filters.start_date" type="date" :aria-label="t('reportCenter.startDate')" />
        <span>-</span>
        <input v-model="filters.end_date" type="date" :aria-label="t('reportCenter.endDate')" />
        <button class="btn btn-primary btn-sm" type="button" :disabled="loading" @click="applyFilters">
          {{ t('reportCenter.applyFilter') }}
        </button>
      </div>
    </section>

    <section v-if="isOverview && headlineSentences.length" class="headline-card">
      <p v-for="sentence in headlineSentences" :key="sentence">{{ sentence }}</p>
    </section>

    <section v-if="isOverview && primaryFigures.length" class="figure-grid">
      <article v-for="figure in primaryFigures" :key="figure.key" class="figure-card">
        <span class="figure-label">{{ figureLabel(figure.key) }}</span>
        <strong class="figure-value" :class="{ negative: figure.value < 0 }">{{ figureValue(figure) }}</strong>
        <span v-if="figure.change" class="figure-change" :class="figure.change.direction">
          {{ changeText(figure.change) }}
          <span class="figure-compare">{{ t('reportCenter.change.versus', { period: comparisonLabel }) }}</span>
        </span>
        <span v-else class="figure-change none">{{ t('reportCenter.change.noComparison') }}</span>
      </article>
    </section>

    <section v-if="isOverview && secondaryFigures.length" class="figure-strip">
      <span v-for="figure in secondaryFigures" :key="figure.key">
        {{ figureLabel(figure.key) }}: <strong>{{ figureValue(figure) }}</strong>
      </span>
    </section>

    <section class="tabs-wrap">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        class="tab-button"
        :class="{ active: activeReport === tab.key }"
        type="button"
        @click="setActiveReport(tab.key)"
      >
        {{ tabLabel(tab) }}
      </button>
      <RouterLink v-for="chart in chartPages" :key="chart.route" class="tab-button chart-link" :to="chart.route">
        {{ chart.label }}
      </RouterLink>
    </section>

    <section class="filter-panel">
      <div class="filter-simple">
        <label class="field wide">
          <span>{{ t('common.search') }}</span>
          <input
            v-model="filters.search"
            type="search"
            :placeholder="t('reportCenter.searchPlaceholder')"
            @keyup.enter="applyFilters"
          />
        </label>
        <button class="btn btn-primary" type="button" @click="applyFilters">
          {{ t('reportCenter.applyFilter') }}
        </button>
        <button class="btn btn-light" type="button" @click="toggleAdvanced">
          {{ advancedOpen ? t('reportCenter.hideAdvanced') : t('reportCenter.showAdvanced') }}
          <span v-if="activeAdvancedCount" class="filter-count">{{ activeAdvancedCount }}</span>
        </button>
        <button v-if="hasActiveFilters" class="btn btn-light" type="button" @click="resetFilters">
          {{ t('reportCenter.resetFilter') }}
        </button>
      </div>

      <div v-if="advancedOpen" class="filter-grid">
        <label class="field">
          <span>{{ t('reportCenter.labels.paymentMethod') }}</span>
          <input v-model="filters.payment_method" type="text" :placeholder="t('reportCenter.paymentPlaceholder')" />
        </label>

        <label v-if="showsFilter('cashier')" class="field">
          <span>{{ t('reportCenter.labels.cashier') }}</span>
          <select v-if="optionsFor('cashier')" v-model="filters.cashier_id">
            <option value="">{{ t('reportCenter.all') }}</option>
            <option v-for="option in optionsFor('cashier')" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input
            v-else
            v-model="filters.cashier_id"
            type="text"
            :placeholder="t('reportCenter.idOf', { name: t('reportCenter.labels.cashier') })"
          />
        </label>

        <label v-if="showsFilter('customer')" class="field">
          <span>{{ t('reportCenter.labels.customer') }}</span>
          <select v-if="optionsFor('customer')" v-model="filters.customer_id">
            <option value="">{{ t('reportCenter.all') }}</option>
            <option v-for="option in optionsFor('customer')" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input
            v-else
            v-model="filters.customer_id"
            type="text"
            :placeholder="t('reportCenter.idOf', { name: t('reportCenter.labels.customer') })"
          />
        </label>

        <label class="field">
          <span>{{ t('reportCenter.labels.status') }}</span>
          <select v-model="filters.status">
            <option value="">{{ t('reportCenter.all') }}</option>
            <option value="paid">{{ t('reportCenter.statuses.paid') }}</option>
            <option value="unpaid">{{ t('reportCenter.statuses.unpaid') }}</option>
          </select>
        </label>

        <label v-if="isPlatformAdmin" class="field">
          <span>{{ t('reportCenter.shopIdLabel') }}</span>
          <input v-model="filters.shop_id" type="text" :placeholder="t('reportCenter.optional')" />
        </label>

        <template v-if="currentBusinessType === 'workshop'">
          <label class="field">
            <span>{{ t('reportCenter.labels.itemType') }}</span>
            <select v-model="filters.item_type">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option v-for="type in ITEM_TYPES" :key="type" :value="type">
                {{ t(`reportCenter.itemTypes.${type}`) }}
              </option>
            </select>
          </label>
        </template>

        <template v-else-if="currentBusinessType === 'restaurant'">
          <label class="field">
            <span>{{ t('reportCenter.labels.orderType') }}</span>
            <select v-model="filters.order_type">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option v-for="type in ORDER_TYPES" :key="type" :value="type">
                {{ t(`reportCenter.orderTypes.${type}`) }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>{{ t('reportCenter.tableNumber') }}</span>
            <input v-model="filters.table_number" type="text" />
          </label>
          <label v-if="showsFilter('waiter')" class="field">
            <span>{{ t('reportCenter.labels.waiter') }}</span>
            <select v-if="optionsFor('waiter')" v-model="filters.waiter_id">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option v-for="option in optionsFor('waiter')" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-else
              v-model="filters.waiter_id"
              type="text"
              :placeholder="t('reportCenter.idOf', { name: t('reportCenter.labels.waiter') })"
            />
          </label>
          <label class="field">
            <span>{{ t('reportCenter.menuCategory') }}</span>
            <input v-model="filters.menu_category" type="text" />
          </label>
        </template>

        <template v-else>
          <label v-if="showsFilter('product')" class="field">
            <span>{{ t('reportCenter.labels.product') }}</span>
            <select v-if="optionsFor('product')" v-model="filters.product_id">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option v-for="option in optionsFor('product')" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-else
              v-model="filters.product_id"
              type="text"
              :placeholder="t('reportCenter.idOf', { name: t('reportCenter.labels.product') })"
            />
          </label>
          <label v-if="showsFilter('category')" class="field">
            <span>{{ t('reportCenter.labels.category') }}</span>
            <select v-if="optionsFor('category')" v-model="filters.category_id">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option v-for="option in optionsFor('category')" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-else
              v-model="filters.category_id"
              type="text"
              :placeholder="t('reportCenter.idOf', { name: t('reportCenter.labels.category') })"
            />
          </label>
          <label v-if="showsFilter('supplier')" class="field">
            <span>{{ t('reportCenter.labels.supplier') }}</span>
            <select v-if="optionsFor('supplier')" v-model="filters.supplier_id">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option v-for="option in optionsFor('supplier')" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-else
              v-model="filters.supplier_id"
              type="text"
              :placeholder="t('reportCenter.idOf', { name: t('reportCenter.labels.supplier') })"
            />
          </label>
          <label v-if="showsFilter('warehouse')" class="field">
            <span>{{ t('reportCenter.labels.warehouse') }}</span>
            <select v-if="optionsFor('warehouse')" v-model="filters.warehouse_id">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option v-for="option in optionsFor('warehouse')" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-else
              v-model="filters.warehouse_id"
              type="text"
              :placeholder="t('reportCenter.idOf', { name: t('reportCenter.labels.warehouse') })"
            />
          </label>
          <label class="field">
            <span>{{ t('reportCenter.labels.sku') }}</span>
            <input v-model="filters.sku" type="text" />
          </label>
          <label class="field">
            <span>{{ t('reportCenter.labels.barcode') }}</span>
            <input v-model="filters.barcode" type="text" />
          </label>
          <label class="field">
            <span>{{ t('reportCenter.labels.stockStatus') }}</span>
            <select v-model="filters.stock_status">
              <option value="">{{ t('reportCenter.all') }}</option>
              <option value="low_stock">{{ t('reportCenter.stockStatuses.lowStock') }}</option>
              <option value="out_of_stock">{{ t('reportCenter.stockStatuses.outOfStock') }}</option>
            </select>
          </label>
        </template>
      </div>

      <div v-if="advancedOpen" class="filter-actions">
        <button class="btn btn-primary" type="button" @click="applyFilters">{{ t('reportCenter.applyFilter') }}</button>
        <button class="btn btn-light" type="button" @click="resetFilters">{{ t('reportCenter.resetFilter') }}</button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card" :class="{ denied: accessDenied }">
      {{ errorMessage }}
    </section>

    <section v-if="!isOverview" class="summary-grid">
      <article v-for="item in summaryCards" :key="item.label" class="summary-card">
        <span>{{ label(item.label) }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <!-- Only when there is something to draw: the overview endpoint sends no
         breakdown, and an empty panel saying so filled a screenful. -->
    <section v-if="hasBreakdownData" class="charts-section">
      <div class="section-heading">
        <h2>{{ t('reportCenter.charts') }}</h2>
        <p>{{ t('reportCenter.chartsSubtitle') }}</p>
      </div>

      <div class="chart-grid">
        <article v-for="section in chartSections" :key="section.title" class="chart-card">
          <h3>{{ label(section.title) }}</h3>
          <div class="bar-list">
            <div v-for="item in section.rows.slice(0, 8)" :key="item.label" class="bar-row">
              <div class="bar-row-head">
                <span>{{ item.label }}</span>
                <strong>
                  {{ section.valueType === 'currency' ? formatCurrency(item.value) : formatTypedValue(item.value, 'number') }}
                </strong>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${Math.max((item.value / maxBreakdownValue(section.rows)) * 100, 4)}%` }"></div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="table-card">
      <div class="table-head">
        <div>
          <h2>{{ isOverview ? t('reportCenter.transactionsTitle') : t('reportCenter.tableTitle', { name: reportTitle }) }}</h2>
          <p v-if="hasSummaryData && rows.length === 0">{{ t('reportCenter.summaryOnly') }}</p>
          <p v-else>{{ t('reportCenter.rowCount', { count: totalRows }) }}</p>
        </div>

        <label class="page-size">
          {{ t('reportCenter.rows') }}
          <select v-model.number="filters.page_size" @change="applyFilters">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
      </div>

      <div class="table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th v-for="column in tableColumns" :key="column.label">{{ label(column.label) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="tableColumns.length" class="empty-state">{{ t('reportCenter.loadingData') }}</td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td :colspan="tableColumns.length" class="empty-state">{{ t('reportCenter.noTableData') }}</td>
            </tr>
            <tr v-for="(row, rowIndex) in rows" :key="String(row.id || row.pk || rowIndex)">
              <td v-for="column in tableColumns" :key="column.label">
                <span v-if="column.type === 'badge'" class="status-badge" :class="badgeClass(getCellValue(row, column))">
                  {{ formatTypedValue(getCellValue(row, column), 'text') }}
                </span>
                <span v-else>{{ formatTypedValue(getCellValue(row, column), column.type) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn btn-light" type="button" :disabled="Number(filters.page) <= 1 || loading" @click="changePage(Number(filters.page) - 1)">
          {{ t('reportCenter.previous') }}
        </button>
        <span>{{ t('reportCenter.pageOf', { page: filters.page, total: pageCount }) }}</span>
        <button class="btn btn-light" type="button" :disabled="Number(filters.page) >= pageCount || loading" @click="changePage(Number(filters.page) + 1)">
          {{ t('reportCenter.next') }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.reports-page {
  display: grid;
  gap: 18px;
  color: #0f172a;
}

.reports-header,
.filter-panel,
.table-card,
.charts-section,
.alert-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.reports-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 800;
  color: var(--brand-600);
  text-transform: uppercase;
}

.reports-header h1 {
  margin: 0;
  font-size: 28px;
}

.header-meta,
.header-actions,
.filter-actions,
.pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-meta {
  margin-top: 10px;
  color: #64748b;
  font-size: 14px;
}

.business-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.business-badge {
  background: #dcfce7;
  color: #166534;
}

.btn {
  min-height: 40px;
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  font-weight: 800;
  cursor: pointer;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.btn-light {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-primary {
  background: var(--brand-600);
  color: #ffffff;
}

.tabs-wrap {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.tab-button {
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  padding: 10px 14px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
}

.tab-button.active {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: #ffffff;
}

.filter-panel {
  padding: 18px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.field.wide {
  grid-column: span 2;
}

.field span,
.page-size {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.field input,
.field select,
.page-size select {
  width: 100%;
  min-height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  padding: 0 11px;
  outline: none;
}

.field input:focus,
.field select:focus,
.page-size select:focus {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(98, 4, 191, 0.12);
}

.filter-actions {
  justify-content: flex-end;
  margin-top: 16px;
}

.alert-card {
  padding: 14px 16px;
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
  font-weight: 700;
}

.alert-card.denied {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.period-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.period-caption {
  font-size: 13px;
  font-weight: 800;
  color: #64748b;
}

.period-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.period-button {
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
}

.period-button:hover:not(:disabled) {
  border-color: var(--brand-200);
  color: var(--brand-700);
}

.period-button.active {
  background: var(--brand-gradient);
  border-color: transparent;
  color: #ffffff;
}

.period-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.period-dates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.period-dates input {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}

.headline-card {
  padding: 18px 20px;
  background: var(--brand-25, #faf6ff);
  border: 1px solid var(--brand-100, #ebd9fd);
  border-radius: 10px;
}

.headline-card p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #1f2937;
}

.headline-card p + p {
  margin-top: 6px;
}

.figure-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.figure-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid var(--brand-600);
  border-radius: 10px;
}

.figure-label {
  font-size: 13px;
  font-weight: 800;
  color: #64748b;
}

.figure-value {
  font-size: 22px;
  color: #111827;
}

.figure-value.negative {
  color: #b91c1c;
}

.figure-change {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.figure-change.up {
  color: #15803d;
}

.figure-change.down {
  color: #b91c1c;
}

.figure-compare {
  display: block;
  font-weight: 600;
  color: #94a3b8;
}

.figure-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  padding: 12px 18px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  color: #64748b;
}

.figure-strip strong {
  color: #111827;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid var(--brand-600);
  border-radius: 8px;
  padding: 16px;
}

.summary-card span {
  display: block;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
  color: #111827;
}

.charts-section {
  padding: 18px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.section-heading h2,
.table-head h2,
.chart-card h3 {
  margin: 0;
}

.section-heading p,
.table-head p {
  margin: 5px 0 0;
  color: #64748b;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.chart-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
}

.chart-card h3 {
  font-size: 15px;
  margin-bottom: 12px;
}

.bar-list {
  display: grid;
  gap: 11px;
}

.bar-row-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #334155;
}

.bar-track {
  height: 10px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--brand-600);
}

.empty-chart {
  color: #64748b;
  padding: 12px 0 4px;
}

.table-card {
  overflow: hidden;
}

.table-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid #eef2f7;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.report-table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
}

.report-table th,
.report-table td {
  padding: 13px 14px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}

.report-table th {
  background: #f8fafc;
  color: #1677ff;
  font-size: 13px;
}

.report-table td {
  color: #1e293b;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 28px !important;
}

.badge-green {
  background: #dcfce7;
  color: #166534;
}

.badge-orange {
  background: #ffedd5;
  color: #9a3412;
}

.badge-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-yellow {
  background: #fef3c7;
  color: #92400e;
}

.badge-red {
  background: #fee2e2;
  color: #991b1b;
}

.badge-gray {
  background: #e5e7eb;
  color: #374151;
}

.pagination {
  justify-content: flex-end;
  padding: 16px 18px;
}

@media (max-width: 1180px) {
  .filter-grid,
  .figure-grid,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .reports-header,
  .table-head,
  .section-heading {
    flex-direction: column;
  }

  .header-actions,
  .header-actions .btn {
    width: 100%;
  }

  .filter-grid,
  .figure-grid,
  .summary-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .field.wide {
    grid-column: span 1;
  }

  .filter-actions .btn,
  .pagination .btn {
    flex: 1;
  }
}

@media print {
  .tabs-wrap,
  .filter-panel,
  .header-actions,
  .pagination {
    display: none;
  }

  .reports-page {
    display: block;
  }
}
</style>
