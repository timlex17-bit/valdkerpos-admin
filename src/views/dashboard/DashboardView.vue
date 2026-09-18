<template>
  <div class="dashboard-page">
    <!-- Header -->
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('dashboardPage.title') }}</h1>
        <p class="page-subtitle">{{ t('dashboardPage.subtitle') }}</p>

        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>/</span>
          <span class="active">{{ t('dashboardPage.title') }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="secondary-btn" type="button" @click="loadDashboard" :disabled="loading">
          {{ loading ? t('dashboardPage.refreshing') : t('common.refresh') }}
        </button>
        <button class="add-btn" type="button" @click="exportSummary">
          {{ t('dashboardPage.exportSummary') }}
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      <div>{{ errorMessage }}</div>
      <button type="button" class="ghost-btn" @click="loadDashboard">{{ t('dashboardPage.retry') }}</button>
    </section>

    <!-- Today in one sentence, before any table. -->
    <section v-if="headlineToday" class="headline-card">
      <p>{{ headlineToday }}</p>
    </section>

    <!-- Only what needs doing. Nothing here means nothing is waiting. -->
    <section v-if="attentionItems.length" class="attention-bar">
      <button
        v-for="item in attentionItems"
        :key="item.key"
        class="attention-chip"
        type="button"
        @click="goTo(item.route)"
      >
        <ModuleIcon :module="item.icon" :size="28" variant="soft" />
        <span>{{ item.text }}</span>
      </button>
    </section>

    <!-- The four numbers of the day. Low stock and unpaid orders used to sit
         here as cards reading 0; they are in the bar above when they matter. -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-top">
          <ModuleIcon module="sales_chart" :size="40" variant="soft" />
          <span class="trend" :class="salesTrendClass">{{ salesTrendLabel }}</span>
        </div>
        <div class="stat-label">{{ t('dashboardPage.salesToday') }}</div>
        <div class="stat-value">${{ salesToday.toFixed(2) }}</div>
        <div class="stat-note">{{ t('dashboardPage.comparedWithYesterday') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <ModuleIcon module="orders" :size="40" variant="soft" />
          <span class="trend" :class="ordersTrendClass">{{ ordersTrendLabel }}</span>
        </div>
        <div class="stat-label">{{ t('dashboardPage.ordersToday') }}</div>
        <div class="stat-value">{{ ordersToday }}</div>
        <div class="stat-note">{{ t('dashboardPage.transactionsToday') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <ModuleIcon module="expenses" :size="40" variant="soft" />
          <span class="trend" :class="expensesTrendClass">{{ expensesTrendLabel }}</span>
        </div>
        <div class="stat-label">{{ t('dashboardPage.expensesToday') }}</div>
        <div class="stat-value">${{ expensesToday.toFixed(2) }}</div>
        <div class="stat-note">{{ t('dashboardPage.operationalExpensesToday') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <ModuleIcon module="reports" :size="40" variant="soft" />
          <span class="trend" :class="profitTrendClass">{{ profitTrendLabel }}</span>
        </div>
        <div class="stat-label">{{ t('dashboardPage.profitEstimate') }}</div>
        <div class="stat-value">${{ profitEstimate.toFixed(2) }}</div>
        <div class="stat-note">{{ t('dashboardPage.salesMinusExpenses') }}</div>
      </div>
    </section>

    <!-- One chart, one table. Payment split, best sellers and the expense
         list are a click away in the reports rather than repeated here. -->
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <h2>{{ t('dashboardPage.salesLast7Days') }}</h2>
          <p>{{ t('dashboardPage.dailySalesOverview') }}</p>
        </div>
        <button class="ghost-btn" type="button" @click="goTo('/reports/sales')">
          {{ t('dashboardPage.viewReport') }}
        </button>
      </div>

      <div class="chart-card">
        <p v-if="!hasSalesInChart" class="chart-empty-note">{{ t('dashboardPage.noSalesLast7Days') }}</p>

        <div class="chart-bars">
          <div v-for="item in salesChart" :key="item.label" class="chart-bar-item">
            <div class="bar-wrap">
              <div
                class="bar-fill"
                :class="{ 'is-empty': item.value <= 0 }"
                :style="{ height: `${item.height}%` }"
              ></div>
            </div>
            <div class="bar-value">${{ item.value.toFixed(2) }}</div>
            <div class="bar-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>{{ t('dashboardPage.recentOrders') }}</h2>
          <p>{{ t('dashboardPage.latestSales') }}</p>
        </div>
        <button class="ghost-btn" type="button" @click="goTo('/orders')">
          {{ t('dashboardPage.allOrders') }}
        </button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('common.invoice') }}</th>
              <th>{{ t('common.customer') }}</th>
              <th>{{ t('common.total') }}</th>
              <th>{{ t('common.payment') }}</th>
              <th>{{ t('common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="recentOrders.length === 0">
              <td colspan="5" class="empty-cell">{{ t('dashboardPage.noRecentOrders') }}</td>
            </tr>
            <tr v-for="order in recentOrders.slice(0, 5)" :key="order.id">
              <td>
                <div class="ref-main">{{ order.invoice }}</div>
                <div class="ref-sub">{{ order.type }}</div>
              </td>
              <td>{{ order.customer }}</td>
              <td class="amount-strong">${{ order.total.toFixed(2) }}</td>
              <td>{{ order.payment }}</td>
              <td>
                <span class="status-badge" :class="order.status === 'Paid' ? 'paid' : 'unpaid'">
                  {{ order.status === 'Paid' ? t('dashboardPage.paid') : t('dashboardPage.unpaid') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ModuleIcon from '@/components/icons/ModuleIcon.vue'
import { getApiErrorMessage } from '@/utils/apiError'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type ProductRow = {
  id: number
  name: string
  sku: string
  stock: number
  minStock: number
  trackStock: boolean
}

type OrderItemRow = {
  productId: string
  name: string
  qty: number
  total: number
}

type OrderRow = {
  id: number
  invoice: string
  type: string
  customer: string
  total: number
  payment: string
  status: 'Paid' | 'Unpaid'
  servedBy: string
  createdAt: string
  items: OrderItemRow[]
}

type ExpenseRow = {
  id: number
  name: string
  note: string
  amount: number
  date: string
  time: string
  createdBy: string
}

type PaymentRow = {
  label: string
  amount: number
}

type KpiRow = {
  salesToday: number
  salesYesterday: number
  ordersToday: number
  ordersYesterday: number
  expensesToday: number
  expensesYesterday: number
  pendingOrders: number
}

type SalesChartRow = {
  label: string
  value: number
  height: number
}

type TopProductRow = {
  id: string | number
  name: string
  qty: number
  total: number
}

type ActivityRow = {
  id: string | number
  icon: string
  title: string
  description: string
  time: string
  colorClass: string
}

const router = useRouter()
const { t, locale } = useI18n()

const dateLocale = computed(() => (locale.value === 'id' ? 'id-ID' : locale.value === 'tet' ? 'pt-PT' : 'en-US'))

const loading = ref(false)
const errorMessage = ref('')
const dashboardOrders = ref<OrderRow[]>([])
const dashboardExpenses = ref<ExpenseRow[]>([])
const dashboardProducts = ref<ProductRow[]>([])
const dashboardPayments = ref<PaymentRow[]>([])
const dashboardKpis = ref<KpiRow>({
  salesToday: 0,
  salesYesterday: 0,
  ordersToday: 0,
  ordersYesterday: 0,
  expensesToday: 0,
  expensesYesterday: 0,
  pendingOrders: 0,
})
const dashboardSalesChart = ref<SalesChartRow[]>([])
const dashboardTopProducts = ref<TopProductRow[]>([])
const dashboardActivities = ref<ActivityRow[]>([])

const salesToday = computed(() =>
  dashboardKpis.value.salesToday
)

const salesYesterday = computed(() =>
  dashboardKpis.value.salesYesterday
)

const ordersToday = computed(() =>
  dashboardKpis.value.ordersToday
)

const ordersYesterday = computed(() =>
  dashboardKpis.value.ordersYesterday
)

const expensesToday = computed(() =>
  dashboardKpis.value.expensesToday
)

const expensesYesterday = computed(() =>
  dashboardKpis.value.expensesYesterday
)

const pendingOrders = computed(() =>
  dashboardKpis.value.pendingOrders
)

const profitEstimate = computed(() => salesToday.value - expensesToday.value)
const profitYesterday = computed(() => salesYesterday.value - expensesYesterday.value)

function money(value: number) {
  return `$${value.toFixed(2)}`
}

/**
 * The day in one sentence, above the cards.
 *
 * The same four numbers the cards show, read as a sentence, so an owner who
 * only glances at the page still knows whether today is going well. It says
 * "left over" or "short by" rather than showing a minus sign, which is the
 * part people misread.
 */
const headlineToday = computed(() => {
  if (loading.value) return ''

  const sales = t('dashboardPage.headlineSales', {
    sales: money(salesToday.value),
    orders: t('dashboardPage.orderCount', ordersToday.value),
  })
  const rest =
    profitEstimate.value < 0
      ? t('dashboardPage.headlineShort', {
          expenses: money(expensesToday.value),
          amount: money(Math.abs(profitEstimate.value)),
        })
      : t('dashboardPage.headlineLeft', {
          expenses: money(expensesToday.value),
          amount: money(profitEstimate.value),
        })

  return `${sales} ${rest}`
})

/**
 * Only what is waiting for someone. An empty bar is the answer "nothing
 * needs you right now", which is why these are no longer cards permanently
 * reading 0.
 */
const attentionItems = computed(() => {
  const items: Array<{ key: string; icon: string; text: string; route: string }> = []

  if (lowStockItems.value.length) {
    items.push({
      key: 'low-stock',
      icon: 'low_stock_report',
      text: t('dashboardPage.attentionLowStock', lowStockItems.value.length),
      route: '/reports/low-stock',
    })
  }

  if (pendingOrders.value) {
    items.push({
      key: 'pending',
      icon: 'orders',
      text: t('dashboardPage.attentionPending', pendingOrders.value),
      route: '/orders',
    })
  }

  return items
})

const salesChart = computed(() => {
  const rows =
    dashboardSalesChart.value.length > 0
      ? dashboardSalesChart.value
      : lastDays(7).map((day) => ({ label: day.label, value: 0, height: 0 }))
  const values = rows.map((row) => row.value)
  const max = Math.max(...values, 1)

  return rows.map((row, index) => ({
    label: row.label,
    value: values[index],
    height: row.height || (values[index] > 0 ? Math.max((values[index] / max) * 100, 8) : 0),
  }))
})

/** Whether the week has any sales at all, so the chart can say so in words. */
const hasSalesInChart = computed(() => salesChart.value.some((item) => item.value > 0))

// Copy before sorting: `.sort()` mutates in place, so sorting the ref's own
// array here reordered the product list for every other consumer of it.
const lowStockItems = computed(() =>
  [...dashboardProducts.value]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4)
)

const recentOrders = computed(() =>
  [...dashboardOrders.value]
    .sort((a, b) => timeValue(b.createdAt) - timeValue(a.createdAt))
    .slice(0, 4)
)

const salesTrendLabel = computed(() => trendLabel(salesToday.value, salesYesterday.value, '%'))
const salesTrendClass = computed(() => trendClass(salesToday.value, salesYesterday.value))
const ordersTrendLabel = computed(() => trendLabel(ordersToday.value, ordersYesterday.value, 'count'))
const ordersTrendClass = computed(() => trendClass(ordersToday.value, ordersYesterday.value))
const profitTrendLabel = computed(() => trendLabel(profitEstimate.value, profitYesterday.value, '%'))
const profitTrendClass = computed(() => trendClass(profitEstimate.value, profitYesterday.value))
const expensesTrendLabel = computed(() => trendLabel(expensesToday.value, expensesYesterday.value, '%', true))
const expensesTrendClass = computed(() => trendClass(expensesToday.value, expensesYesterday.value, true))

function normalizeArray(data: unknown): any[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: any[] }).results
  }
  return []
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeProduct(raw: any): ProductRow {
  return {
    id: asNumber(raw?.id, 0),
    name: String(raw?.name ?? '-'),
    sku: String(raw?.sku || raw?.code || '-'),
    stock: asNumber(raw?.stock ?? raw?.quantity, 0),
    minStock: asNumber(raw?.min_stock ?? raw?.minStock ?? raw?.minimum_stock, 0),
    trackStock: raw?.track_stock !== false,
  }
}

function normalizeOrder(raw: any): OrderRow {
  const items = normalizeArray(raw?.items ?? raw?.order_items ?? raw?.lines ?? raw?.details).map(normalizeOrderItem)
  const user = raw?.served_by || raw?.created_by || raw?.user || raw?.cashier || raw?.staff

  return {
    id: asNumber(raw?.id, 0),
    invoice: String(raw?.invoice_number || raw?.invoice || raw?.invoice_id || `ORDER-${raw?.id ?? 'NA'}`),
    type: formatLabel(raw?.default_order_type || raw?.order_type || raw?.type || 'General'),
    customer: normalizeCustomer(raw?.customer),
    total: asNumber(raw?.total ?? raw?.grand_total ?? raw?.amount, 0),
    payment: formatLabel(raw?.payment_method || raw?.payment_method_name || raw?.payment_type || raw?.payments?.[0]?.payment_method || '-'),
    status: raw?.is_paid === false || String(raw?.status || '').toLowerCase() === 'unpaid' ? 'Unpaid' : 'Paid',
    servedBy: normalizeUser(user),
    createdAt: String(raw?.created_at || raw?.ordered_at || raw?.date || ''),
    items,
  }
}

function normalizeOrderItem(raw: any): OrderItemRow {
  const product = raw?.product
  const productName =
    typeof product === 'object' && product !== null
      ? product.name
      : raw?.product_name || raw?.name || raw?.title || `Product #${product ?? 'NA'}`
  const productId =
    typeof product === 'object' && product !== null
      ? product.id
      : product || raw?.product_id || productName
  const qty = asNumber(raw?.quantity ?? raw?.qty, 0)
  const directTotal = raw?.total_price ?? raw?.total ?? raw?.subtotal ?? raw?.line_total ?? raw?.amount
  const total =
    directTotal !== undefined && directTotal !== null && directTotal !== ''
      ? asNumber(directTotal, 0)
      : qty * asNumber(raw?.unit_price ?? raw?.price ?? raw?.sell_price, 0)

  return {
    productId: String(productId ?? productName),
    name: String(productName || 'Unnamed Product'),
    qty,
    total,
  }
}

function normalizeExpense(raw: any): ExpenseRow {
  return {
    id: asNumber(raw?.id, 0),
    name: String(raw?.name || '-'),
    note: String(raw?.note || ''),
    amount: asNumber(raw?.amount, 0),
    date: String(raw?.date || ''),
    time: String(raw?.time || ''),
    createdBy: normalizeUser(raw?.created_by || raw?.user || raw?.staff),
  }
}

function normalizePayments(data: unknown): PaymentRow[] {
  const totals = new Map<string, number>()

  normalizeArray(data).forEach((item) => {
    const label = formatLabel(
      item?.label ||
        item?.name ||
      item?.payment_method_name ||
        item?.payment_type ||
        item?.bank_account_name ||
        item?.payment_method ||
        'UNKNOWN'
    )
    totals.set(label, (totals.get(label) || 0) + asNumber(item?.amount, 0))
  })

  return [...totals.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
}

function normalizeKpis(raw: any): KpiRow {
  return {
    salesToday: asNumber(raw?.sales_today ?? raw?.salesToday ?? raw?.today_sales, 0),
    salesYesterday: asNumber(raw?.sales_yesterday ?? raw?.salesYesterday ?? raw?.yesterday_sales, 0),
    ordersToday: asNumber(raw?.orders_today ?? raw?.ordersToday ?? raw?.today_orders, 0),
    ordersYesterday: asNumber(raw?.orders_yesterday ?? raw?.ordersYesterday ?? raw?.yesterday_orders, 0),
    expensesToday: asNumber(raw?.expenses_today ?? raw?.expensesToday ?? raw?.today_expenses, 0),
    expensesYesterday: asNumber(raw?.expenses_yesterday ?? raw?.expensesYesterday ?? raw?.yesterday_expenses, 0),
    pendingOrders: asNumber(raw?.pending_orders ?? raw?.pendingOrders, 0),
  }
}

function normalizeSalesChart(data: unknown): SalesChartRow[] {
  const rows = normalizeArray(data).map((item) => ({
    label: String(item?.label || item?.day || item?.date || '-'),
    value: asNumber(item?.value ?? item?.sales ?? item?.total, 0),
    height: asNumber(item?.height, 0),
  }))
  const max = Math.max(...rows.map((item) => item.value), 1)

  return rows.map((item) => ({
    ...item,
    height: item.height || (item.value > 0 ? Math.max((item.value / max) * 100, 8) : 0),
  }))
}

function normalizeTopProduct(raw: any): TopProductRow {
  return {
    id: raw?.id ?? raw?.product_id ?? raw?.name ?? '-',
    name: String(raw?.name ?? raw?.product_name ?? '-'),
    qty: asNumber(raw?.qty ?? raw?.quantity ?? raw?.sold_quantity, 0),
    total: asNumber(raw?.total ?? raw?.amount ?? raw?.sales, 0),
  }
}

function normalizeActivity(raw: any, index: number): ActivityRow {
  const timestamp = raw?.created_at || raw?.timestamp || raw?.date
  const displayTime = timestamp ? relativeTime(String(timestamp)) : String(raw?.time || '-')

  return {
    id: raw?.id ?? index,
    icon: String(raw?.icon || '#'),
    title: String(raw?.title || '-'),
    description: String(raw?.description || raw?.message || ''),
    time: displayTime,
    colorClass: String(raw?.colorClass || raw?.color_class || 'activity-blue'),
  }
}

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(ENDPOINTS.DASHBOARD_SUMMARY)
    const data = response.data ?? {}

    dashboardKpis.value = normalizeKpis(data.kpis ?? {})
    dashboardSalesChart.value = normalizeSalesChart(data.sales_last_7_days)
    dashboardPayments.value = normalizePayments(data.payment_methods)
    dashboardProducts.value = normalizeArray(data.low_stock_items).map(normalizeProduct)
    dashboardTopProducts.value = normalizeArray(data.top_products).map(normalizeTopProduct)
    dashboardOrders.value = normalizeArray(data.recent_orders).map(normalizeOrder)
    dashboardExpenses.value = normalizeArray(data.recent_expenses).map(normalizeExpense)
    dashboardActivities.value = normalizeArray(data.recent_activities).map(normalizeActivity)
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('dashboardPage.failedLoad'))
  } finally {
    loading.value = false
  }
}

function exportSummary() {
  window.print()
}

function goTo(path: string) {
  router.push(path)
}

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function lastDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (count - index - 1))
    return {
      key: dateKey(date),
      label: new Intl.DateTimeFormat(dateLocale.value, { weekday: 'short' }).format(date),
    }
  })
}

function timeValue(value: string): number {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function relativeTime(value: string): string {
  const timestamp = timeValue(value)
  if (!timestamp) return '-'

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMinutes < 1) return t('dashboardPage.justNow')
  if (diffMinutes < 60) return t('dashboardPage.minutesAgo', { count: diffMinutes })

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return t('dashboardPage.hoursAgo', { count: diffHours }, diffHours)

  const diffDays = Math.floor(diffHours / 24)
  return t('dashboardPage.daysAgo', { count: diffDays }, diffDays)
}

function trendLabel(current: number, previous: number, mode: '%' | 'count', inverted = false): string {
  if (previous === 0 && current === 0) return t('dashboardPage.noChange')
  if (mode === 'count') {
    const diff = current - previous
    if (diff === 0) return t('dashboardPage.noChange')
    return `${diff > 0 ? '+' : ''}${diff}`
  }

  if (previous === 0) return current > 0 ? '+100%' : t('dashboardPage.noChange')
  const diff = ((current - previous) / Math.abs(previous)) * 100
  const adjusted = inverted ? -diff : diff
  return `${adjusted > 0 ? '+' : ''}${adjusted.toFixed(1)}%`
}

function trendClass(current: number, previous: number, inverted = false): 'up' | 'down' | 'flat' {
  const diff = current - previous
  if (diff === 0) return 'flat'
  const positive = inverted ? diff < 0 : diff > 0
  return positive ? 'up' : 'down'
}

function normalizeCustomer(value: any): string {
  if (!value) return t('ordersPage.walkIn')
  if (typeof value === 'object') {
    return String(value.name || value.full_name || value.username || t('ordersPage.customerLabel', { id: value.id ?? '-' }))
  }
  return t('ordersPage.customerLabel', { id: value })
}

function normalizeUser(value: any): string {
  if (!value) return t('dashboardPage.system')
  if (typeof value === 'object') {
    return String(value.full_name || value.username || value.name || `User #${value.id ?? 'NA'}`)
  }
  return String(value)
}

function formatLabel(value: unknown): string {
  const raw = String(value || '-').replace(/_/g, ' ').trim()
  if (!raw) return '-'
  return raw
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard-page {
  padding: 28px;
  background: #f3f4f6;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 22px;
}

.page-title {
  margin: 0;
  font-size: 32px;
  line-height: 1.15;
  font-weight: 800;
  color: #1f2a44;
}

.page-subtitle {
  margin: 10px 0 12px;
  color: #6b7280;
  font-size: 1rem;
}

.breadcrumb {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 0.98rem;
}

.breadcrumb .active {
  color: var(--brand-600);
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.alert-card {
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.alert-card.error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-card.warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.add-btn,
.secondary-btn,
.ghost-btn {
  border: none;
  height: 46px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.add-btn {
  background: var(--brand-600);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 20px rgba(98, 4, 191, 0.18);
}

.add-btn span {
  font-size: 1.2rem;
  line-height: 1;
}

.secondary-btn {
  background: #eef2f7;
  color: #334155;
}

.ghost-btn {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

/* The day in words, above the numbers. */
.headline-card {
  margin-bottom: 18px;
  padding: 18px 22px;
  background: var(--brand-25, #faf6ff);
  border: 1px solid var(--brand-100, #ebd9fd);
  border-radius: 18px;
}

.headline-card p {
  margin: 0;
  font-size: 16px;
  line-height: 1.55;
  color: #1f2937;
}

/* Shown only when something is waiting: an absent bar means nothing is. */
.attention-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.attention-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px 8px 8px;
  background: #fff;
  border: 1px solid #fcd34d;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
  cursor: pointer;
}

.attention-chip:hover {
  border-color: #f59e0b;
}

.stat-card {
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  border: 1px solid #edf0f5;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.icon-green { background: #dcfce7; }
.icon-blue { background: #dbeafe; }
.icon-purple { background: #ede9fe; }
.icon-orange { background: #ffedd5; }
.icon-red { background: #fee2e2; }
.icon-yellow { background: #fef3c7; }

.trend {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
}

.trend.up {
  background: #dcfce7;
  color: #16a34a;
}

.trend.down {
  background: #fee2e2;
  color: #dc2626;
}

.trend.flat {
  background: #f1f5f9;
  color: #475569;
}

.stat-label {
  font-size: 0.92rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.9rem;
  font-weight: 800;
  color: #1f2a44;
  margin-bottom: 6px;
}

.stat-note {
  color: #94a3b8;
  font-size: 0.9rem;
}

.content-grid {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
}

.content-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card,
.table-card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid #edf0f5;
  overflow: hidden;
}

.panel-header,
.table-header {
  padding: 20px 20px 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-header h2,
.table-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2a44;
}

.panel-header p,
.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.chart-card {
  padding: 16px 20px 22px;
}

.chart-bars {
  height: 260px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 16px;
  align-items: end;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
}

/* A baseline, not a container. The grey box that used to sit behind every bar
   was all a quiet day showed: seven empty boxes that looked like something
   had failed to load. A day with no sales is now a flat grey stub on the
   line, which is what "nothing sold" looks like. */
.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: end;
  padding: 8px 8px 0;
  min-height: 120px;
  border-bottom: 2px solid #e2e8f0;
}

.bar-fill {
  width: 100%;
  min-height: 4px;
  border-radius: 12px 12px 0 0;
  background: var(--brand-gradient);
}

.bar-fill.is-empty {
  background: #e2e8f0;
}

.chart-empty-note {
  margin: 0 0 12px;
  font-size: 14px;
  color: #64748b;
}

.bar-value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.bar-label {
  font-size: 0.85rem;
  color: #64748b;
}

.payment-summary {
  padding: 12px 20px 22px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: center;
}

.donut-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  margin: 0 auto;
  background:
    conic-gradient(
      #22c55e 0deg 170deg,
      #3b82f6 170deg 275deg,
      #fb923c 275deg 332deg,
      #8b5cf6 332deg 360deg
    );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.donut-placeholder::after {
  content: '';
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 50%;
  position: absolute;
}

.donut-center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-center strong {
  font-size: 1.2rem;
  color: #1f2a44;
}

.donut-center span {
  color: #64748b;
  font-size: 0.85rem;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-row,
.empty-cell {
  color: #64748b;
  text-align: center;
}

.empty-row {
  padding: 18px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}

.empty-cell {
  padding: 24px 16px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.payment-item__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-green { background: #22c55e; }
.dot-blue { background: #3b82f6; }
.dot-orange { background: #fb923c; }
.dot-purple { background: #8b5cf6; }

.payment-name {
  font-weight: 700;
  color: #1f2937;
}

.payment-sub {
  color: #64748b;
  font-size: 0.88rem;
  margin-top: 4px;
}

.payment-amount {
  font-weight: 800;
  color: #1f2a44;
}

.list-stack {
  padding: 6px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-row {
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.list-row__left,
.list-row__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.product-avatar--green {
  background: linear-gradient(135deg, #dcfce7, #f0fdf4);
  color: #16a34a;
}

.list-title,
.title-main {
  font-weight: 700;
  color: #1f2937;
}

.list-sub,
.ref-sub,
.mini-note {
  color: #64748b;
  font-size: 0.88rem;
  margin-top: 4px;
}

.amount-strong {
  font-weight: 800;
  color: #1f2a44;
}

.amount-expense {
  color: #dc2626;
}

.table-wrap {
  overflow-x: auto;
  padding: 8px 18px 18px;
}

.data-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 0.93rem;
  color: #64748b;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 16px;
  vertical-align: middle;
  border-bottom: 1px solid #edf2f7;
  color: #1f2937;
  font-size: 0.96rem;
}

.ref-main {
  color: #2563eb;
  font-weight: 800;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
}

.status-badge.paid {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.unpaid {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.activity-list {
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-row {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.activity-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.activity-blue { background: #dbeafe; }
.activity-orange { background: #ffedd5; }
.activity-red { background: #fee2e2; }
.activity-green { background: #dcfce7; }
.activity-purple { background: #ede9fe; }

.activity-title {
  font-weight: 700;
  color: #1f2937;
}

.activity-sub {
  color: #64748b;
  margin-top: 4px;
  font-size: 0.92rem;
}

.activity-time {
  color: #64748b;
  font-size: 0.88rem;
  white-space: nowrap;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .content-grid-2,
  .payment-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .add-btn,
  .secondary-btn {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 32px;
    line-height: 1.15;
  }

  .activity-row {
    grid-template-columns: 48px 1fr;
  }

  .activity-time {
    grid-column: 2;
  }

  .list-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
