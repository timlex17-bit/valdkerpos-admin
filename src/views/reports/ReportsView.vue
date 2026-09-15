<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import reportService, { type ReportParams } from '@/services/reportService'

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

const today = new Date().toISOString().slice(0, 10)
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10)

const loading = ref(false)
const exportLoading = ref<'pdf' | 'xlsx' | ''>('')
const errorMessage = ref('')
const activeReport = ref<ReportKey>('dashboard')
const rawPayload = ref<ReportPayload>({})
const responseBusinessType = ref('')

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
  vehicle_plate: '',
  mechanic_id: '',
  service_status: '',
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
  return rawPayload.value.shop?.name || storedShop.value?.name || storedUser.value?.shop_name || 'Current shop'
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
  return tabs.find((tab) => tab.key === activeReport.value)?.label || 'Reports'
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
    Object.assign(params, {
      item_type: String(filters.value.item_type || '').toUpperCase(),
      vehicle_plate: filters.value.vehicle_plate,
      mechanic_id: filters.value.mechanic_id,
      service_status: filters.value.service_status,
    })
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

  return [...universal, ...specific[currentBusinessType.value]]
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
  return {
    label,
    keys,
    type,
    value: formatTypedValue(readFirst(summary.value, keys), type),
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
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(asNumber(value))
}

function formatDate(value: unknown, withTime = false) {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function formatTypedValue(value: unknown, type: Column['type']) {
  if (value === null || value === undefined || value === '') return type === 'currency' ? formatCurrency(0) : '-'
  if (type === 'currency') return formatCurrency(value)
  if (type === 'number') return new Intl.NumberFormat('id-ID').format(asNumber(value))
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

  try {
    const response = await serviceForReport(activeReport.value)(activeParams.value)
    const payload = (response.data || {}) as ReportPayload
    rawPayload.value = payload

    if (payload.shop?.business_type) {
      responseBusinessType.value = payload.shop.business_type
    }
  } catch (error: unknown) {
    rawPayload.value = {}

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage.value = 'Session expired. Please login again.'
      } else if (error.response?.status === 403) {
        errorMessage.value = 'Access denied.'
      } else if (error.response?.status === 500) {
        errorMessage.value = 'Server error while loading report.'
      } else {
        const data = error.response?.data as { detail?: unknown; message?: unknown; error?: unknown } | undefined
        errorMessage.value = String(data?.detail || data?.message || data?.error || 'Failed to load report.')
      }
    } else {
      errorMessage.value = 'Failed to load report.'
    }
  } finally {
    loading.value = false
  }
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
    vehicle_plate: '',
    mechanic_id: '',
    service_status: '',
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
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage.value = 'Session expired. Please login again.'
      } else if (error.response?.status === 403) {
        errorMessage.value = 'Access denied.'
      } else if (error.response?.status === 500) {
        errorMessage.value = 'Server error while exporting report.'
      } else {
        errorMessage.value = `Failed to export ${format.toUpperCase()} report.`
      }
    } else {
      errorMessage.value = `Failed to export ${format.toUpperCase()} report.`
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
            label: String(record.label || record.name || record.date || record.category || record.payment_method || `Item ${index + 1}`),
            value: asNumber(record.value || record.amount || record.total || record.sales || record.quantity || record.count),
          }
        }

        return { label: `Item ${index + 1}`, value: asNumber(item) }
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
  activeReport.value = routeToReport()
  void fetchReport()
})
</script>

<template>
  <div class="reports-page">
    <section class="reports-header">
      <div>
        <p class="eyebrow">Reports / Laporan</p>
        <h1>{{ reportTitle }}</h1>
        <div class="header-meta">
          <span>{{ currentShopName }}</span>
          <span class="business-badge">{{ currentBusinessTypeLabel }}</span>
          <span v-if="currentShopId">Shop ID: {{ currentShopId }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-light" type="button" :disabled="loading" @click="fetchReport">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="btn btn-light" type="button" :disabled="Boolean(exportLoading)" @click="exportSales('pdf')">
          {{ exportLoading === 'pdf' ? 'Exporting...' : 'Export PDF' }}
        </button>
        <button class="btn btn-light" type="button" :disabled="Boolean(exportLoading)" @click="exportSales('xlsx')">
          {{ exportLoading === 'xlsx' ? 'Exporting...' : 'Export Excel' }}
        </button>
        <button class="btn btn-primary" type="button" @click="printReport">Print</button>
      </div>
    </section>

    <section class="tabs-wrap">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-button"
        :class="{ active: activeReport === tab.key }"
        type="button"
        @click="setActiveReport(tab.key)"
      >
        {{ tab.label }}
      </button>
    </section>

    <section class="filter-panel">
      <div class="filter-grid">
        <label class="field">
          <span>Start Date</span>
          <input v-model="filters.start_date" type="date" />
        </label>
        <label class="field">
          <span>End Date</span>
          <input v-model="filters.end_date" type="date" />
        </label>
        <label class="field wide">
          <span>Search</span>
          <input v-model="filters.search" type="search" placeholder="Invoice, customer, product..." />
        </label>
        <label class="field">
          <span>Payment Method</span>
          <input v-model="filters.payment_method" type="text" placeholder="Cash, card, transfer" />
        </label>
        <label class="field">
          <span>Cashier</span>
          <input v-model="filters.cashier_id" type="text" placeholder="Cashier ID" />
        </label>
        <label class="field">
          <span>Customer</span>
          <input v-model="filters.customer_id" type="text" placeholder="Customer ID" />
        </label>
        <label class="field">
          <span>Status</span>
          <input v-model="filters.status" type="text" placeholder="PAID, PENDING..." />
        </label>
        <label v-if="isPlatformAdmin" class="field">
          <span>Shop ID</span>
          <input v-model="filters.shop_id" type="text" placeholder="Optional shop_id" />
        </label>

        <template v-if="currentBusinessType === 'workshop'">
          <label class="field">
            <span>Item Type</span>
            <select v-model="filters.item_type">
              <option value="">Semua</option>
              <option value="MENU">MENU</option>
              <option value="SERVICE">SERVICE</option>
              <option value="SPAREPART">SPAREPART</option>
            </select>
          </label>
          <label class="field">
            <span>Vehicle Plate</span>
            <input v-model="filters.vehicle_plate" type="text" />
          </label>
          <label class="field">
            <span>Mechanic</span>
            <input v-model="filters.mechanic_id" type="text" placeholder="Mechanic ID" />
          </label>
          <label class="field">
            <span>Service Status</span>
            <input v-model="filters.service_status" type="text" />
          </label>
        </template>

        <template v-else-if="currentBusinessType === 'restaurant'">
          <label class="field">
            <span>Order Type</span>
            <select v-model="filters.order_type">
              <option value="">Semua</option>
              <option value="DINE_IN">DINE_IN</option>
              <option value="TAKEAWAY">TAKEAWAY</option>
              <option value="DELIVERY">DELIVERY</option>
            </select>
          </label>
          <label class="field">
            <span>Table Number</span>
            <input v-model="filters.table_number" type="text" />
          </label>
          <label class="field">
            <span>Waiter</span>
            <input v-model="filters.waiter_id" type="text" placeholder="Waiter ID" />
          </label>
          <label class="field">
            <span>Menu Category</span>
            <input v-model="filters.menu_category" type="text" />
          </label>
        </template>

        <template v-else>
          <label class="field">
            <span>Product</span>
            <input v-model="filters.product_id" type="text" placeholder="Product ID" />
          </label>
          <label class="field">
            <span>Category</span>
            <input v-model="filters.category_id" type="text" placeholder="Category ID" />
          </label>
          <label class="field">
            <span>Supplier</span>
            <input v-model="filters.supplier_id" type="text" placeholder="Supplier ID" />
          </label>
          <label class="field">
            <span>Warehouse</span>
            <input v-model="filters.warehouse_id" type="text" placeholder="Warehouse ID" />
          </label>
          <label class="field">
            <span>SKU</span>
            <input v-model="filters.sku" type="text" />
          </label>
          <label class="field">
            <span>Barcode</span>
            <input v-model="filters.barcode" type="text" />
          </label>
          <label class="field">
            <span>Stock Status</span>
            <input v-model="filters.stock_status" type="text" />
          </label>
        </template>
      </div>

      <div class="filter-actions">
        <button class="btn btn-primary" type="button" @click="applyFilters">Apply Filter</button>
        <button class="btn btn-light" type="button" @click="resetFilters">Reset Filter</button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card" :class="{ denied: errorMessage === 'Access denied.' }">
      {{ errorMessage }}
    </section>

    <section class="summary-grid">
      <article v-for="item in summaryCards" :key="item.label" class="summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="charts-section">
      <div class="section-heading">
        <h2>Charts</h2>
        <p>Breakdown data from the active report response.</p>
      </div>

      <div v-if="!hasBreakdownData" class="empty-chart">No breakdown data available.</div>
      <div v-else class="chart-grid">
        <article v-for="section in chartSections" :key="section.title" class="chart-card">
          <h3>{{ section.title }}</h3>
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
          <h2>{{ reportTitle }} Table</h2>
          <p v-if="hasSummaryData && rows.length === 0">Summary is available, but table rows are empty.</p>
          <p v-else>{{ totalRows }} row(s)</p>
        </div>

        <label class="page-size">
          Rows
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
              <th v-for="column in tableColumns" :key="column.label">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="tableColumns.length" class="empty-state">Loading report data...</td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td :colspan="tableColumns.length" class="empty-state">No table data found.</td>
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
          Previous
        </button>
        <span>Page {{ filters.page }} of {{ pageCount }}</span>
        <button class="btn btn-light" type="button" :disabled="Number(filters.page) >= pageCount || loading" @click="changePage(Number(filters.page) + 1)">
          Next
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
