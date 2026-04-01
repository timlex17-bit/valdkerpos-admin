<template>
  <div class="report-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Sales Report</h1>
        <p class="page-subtitle">
          Monitor detailed sales rows from order transactions, invoices, quantities, and totals.
        </p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Reports</span>
          <span>›</span>
          <span class="active">Sales Report</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" @click="fetchOrders" :disabled="loading">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card emerald">
        <div class="stat-icon">💰</div>
        <div>
          <p class="stat-label">Total Sales</p>
          <h3 class="stat-value">{{ currency(totalSalesAmount) }}</h3>
          <p class="stat-meta">From {{ filteredRows.length }} sales rows</p>
        </div>
      </article>

      <article class="stat-card blue">
        <div class="stat-icon">🧾</div>
        <div>
          <p class="stat-label">Invoices</p>
          <h3 class="stat-value">{{ uniqueInvoices }}</h3>
          <p class="stat-meta">Unique invoice count</p>
        </div>
      </article>

      <article class="stat-card amber">
        <div class="stat-icon">📦</div>
        <div>
          <p class="stat-label">Quantity Sold</p>
          <h3 class="stat-value">{{ totalQuantity }}</h3>
          <p class="stat-meta">Total units sold</p>
        </div>
      </article>

      <article class="stat-card violet">
        <div class="stat-icon">⚖️</div>
        <div>
          <p class="stat-label">Weight</p>
          <h3 class="stat-value">{{ totalWeightDisplay }}</h3>
          <p class="stat-meta">Accumulated product weight</p>
        </div>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <div class="toolbar-field">
          <label>Filter by Month</label>
          <input v-model="selectedMonth" type="month" class="form-input" />
        </div>

        <div class="toolbar-field search-field">
          <label>Search</label>
          <input
            v-model="search"
            type="text"
            class="form-input"
            placeholder="Search product or invoice..."
          />
        </div>
      </div>

      <div class="toolbar-right">
        <button class="btn btn-primary" @click="applyFilter">Filter</button>
        <button class="btn btn-light" @click="resetFilter">Reset</button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="table-card">
      <div class="card-header">
        <div>
          <h2>Sales transaction details</h2>
          <p>Detailed list of order item rows grouped from order transactions.</p>
        </div>

        <div class="table-summary">
          Showing <strong>{{ filteredRows.length }}</strong> rows
        </div>
      </div>

      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Invoice</th>
              <th>Qty</th>
              <th>Weight</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Type</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="empty-state">Loading sales data...</td>
            </tr>

            <tr v-else-if="filteredRows.length === 0">
              <td colspan="8" class="empty-state">No sales data found.</td>
            </tr>

            <tr v-for="item in filteredRows" :key="item.rowKey">
              <td>
                <div class="primary-cell">{{ item.product }}</div>
                <div class="sub-cell" v-if="item.productCode">{{ item.productCode }}</div>
              </td>
              <td>{{ item.invoice }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.weightDisplay }}</td>
              <td class="amount-cell">{{ currency(item.total) }}</td>
              <td>
                <span class="badge badge-blue">{{ item.paymentMethod }}</span>
              </td>
              <td>
                <span class="badge" :class="orderTypeClass(item.orderType)">
                  {{ item.orderType }}
                </span>
              </td>
              <td>{{ formatDateTime(item.orderDate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <transition name="fade">
      <div v-if="flashMessage" class="flash-message">
        {{ flashMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type SalesRow = {
  rowKey: string
  invoice: string
  product: string
  productCode: string
  quantity: number
  weight: number | null
  weightDisplay: string
  total: number
  paymentMethod: string
  orderType: string
  orderDate: string
  month: string
}

type OrderItemPayload = {
  id?: number | string
  product?: number | string | { name?: string; sku?: string }
  product_name?: string
  product_code?: string
  product_sku?: string
  sku?: string
  barcode?: string
  name?: string
  title?: string
  quantity?: number | string
  qty?: number | string
  unit_price?: number | string
  price?: number | string
  sell_price?: number | string
  total_price?: number | string
  total?: number | string
  subtotal?: number | string
  line_total?: number | string
  amount?: number | string
  weight?: number | string
  product_weight?: number | string
  weight_total?: number | string
  total_weight?: number | string
  order_type?: string
  item_type?: string
}

type OrderPayload = {
  id?: number | string
  invoice_number?: string
  invoice?: string
  invoice_id?: string
  payment_method?: string
  payment_method_name?: string
  payment_type?: string
  default_order_type?: string
  order_type?: string
  created_at?: string
  ordered_at?: string
  date?: string
  items?: OrderItemPayload[]
  order_items?: OrderItemPayload[]
  lines?: OrderItemPayload[]
  details?: OrderItemPayload[]
}

type OrderListResponse = OrderPayload[] | { results?: OrderPayload[] }

const flashMessage = ref<string>('')
const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const rows = ref<SalesRow[]>([])

const selectedMonth = ref<string>(currentMonth())
const appliedMonth = ref<string>(currentMonth())
const search = ref<string>('')

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: T[] }).results
  }
  return []
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getItemTotal(item: OrderItemPayload): number {
  const direct =
    item.total_price ??
    item.total ??
    item.subtotal ??
    item.line_total ??
    item.amount

  if (direct !== undefined && direct !== null && direct !== '') {
    return asNumber(direct, 0)
  }

  const quantity = asNumber(item.quantity ?? item.qty, 0)
  const unitPrice = asNumber(item.unit_price ?? item.price ?? item.sell_price, 0)
  return quantity * unitPrice
}

function getItemWeight(item: OrderItemPayload): number | null {
  const weightValue =
    item.weight ??
    item.product_weight ??
    item.weight_total ??
    item.total_weight

  if (weightValue === undefined || weightValue === null || weightValue === '') {
    return null
  }

  const parsed = Number(weightValue)
  return Number.isFinite(parsed) ? parsed : null
}

function getOrderType(order: OrderPayload, item: OrderItemPayload): string {
  return (
    item.order_type ||
    item.item_type ||
    order.default_order_type ||
    order.order_type ||
    'SALE'
  )
}

function normalizeInvoice(order: OrderPayload): string {
  return (
    order.invoice_number ||
    order.invoice ||
    order.invoice_id ||
    `ORDER-${order.id ?? 'NA'}`
  )
}

function normalizeItemName(item: OrderItemPayload): string {
  if (typeof item.product === 'object' && item.product !== null && 'name' in item.product) {
    return item.product.name || 'Unnamed Product'
  }

  return (
    item.product_name ||
    item.name ||
    item.title ||
    `Product #${item.product ?? 'NA'}`
  )
}

function normalizeItemCode(item: OrderItemPayload): string {
  if (typeof item.product === 'object' && item.product !== null && 'sku' in item.product) {
    return item.product.sku || ''
  }

  return (
    item.product_code ||
    item.product_sku ||
    item.sku ||
    item.barcode ||
    ''
  )
}

function normalizePayment(order: OrderPayload): string {
  return (
    order.payment_method ||
    order.payment_method_name ||
    order.payment_type ||
    'UNKNOWN'
  )
}

function buildRows(ordersPayload: OrderPayload[]): SalesRow[] {
  const normalizedRows: SalesRow[] = []

  ordersPayload.forEach((order, orderIndex) => {
    const items =
      order.items ||
      order.order_items ||
      order.lines ||
      order.details ||
      []

    const itemsArray = Array.isArray(items) ? items : []

    if (itemsArray.length === 0) return

    itemsArray.forEach((item, itemIndex) => {
      const orderDate = order.created_at || order.ordered_at || order.date || ''
      const weight = getItemWeight(item)

      normalizedRows.push({
        rowKey: `${order.id ?? orderIndex}-${item.id ?? itemIndex}`,
        invoice: normalizeInvoice(order),
        product: normalizeItemName(item),
        productCode: normalizeItemCode(item),
        quantity: asNumber(item.quantity ?? item.qty, 0),
        weight,
        weightDisplay: weight === null ? '-' : String(weight),
        total: getItemTotal(item),
        paymentMethod: String(normalizePayment(order)).toUpperCase(),
        orderType: String(getOrderType(order, item)).toUpperCase(),
        orderDate,
        month: orderDate ? String(orderDate).slice(0, 7) : '',
      })
    })
  })

  return normalizedRows.sort((a, b) => {
    const ad = new Date(a.orderDate).getTime()
    const bd = new Date(b.orderDate).getTime()
    return bd - ad
  })
}

async function fetchOrders(): Promise<void> {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get<OrderListResponse>(ENDPOINTS.ORDERS)
    rows.value = buildRows(normalizeArray<OrderPayload>(response.data))
    showFlash('Sales report loaded.')
  } catch (error: unknown) {
    rows.value = []

    if (axios.isAxiosError(error)) {
      const detail =
        typeof error.response?.data === 'object' &&
        error.response?.data &&
        'detail' in error.response.data
          ? String((error.response.data as { detail?: unknown }).detail ?? '')
          : ''

      errorMessage.value = detail || 'Failed to load sales report.'
    } else {
      errorMessage.value = 'Failed to load sales report.'
    }
  } finally {
    loading.value = false
  }
}

const filteredRows = computed<SalesRow[]>(() => {
  let result = [...rows.value]

  if (appliedMonth.value) {
    result = result.filter((item) => item.month === appliedMonth.value)
  }

  const keyword = search.value.trim().toLowerCase()
  if (keyword) {
    result = result.filter(
      (item) =>
        item.product.toLowerCase().includes(keyword) ||
        item.invoice.toLowerCase().includes(keyword) ||
        item.paymentMethod.toLowerCase().includes(keyword) ||
        item.orderType.toLowerCase().includes(keyword),
    )
  }

  return result
})

const totalSalesAmount = computed<number>(() =>
  filteredRows.value.reduce((sum, item) => sum + item.total, 0),
)

const totalQuantity = computed<number>(() =>
  filteredRows.value.reduce((sum, item) => sum + item.quantity, 0),
)

const uniqueInvoices = computed<number>(() => {
  const invoices = new Set(filteredRows.value.map((item) => item.invoice))
  return invoices.size
})

const totalWeight = computed<number>(() =>
  filteredRows.value.reduce((sum, item) => sum + (item.weight ?? 0), 0),
)

const totalWeightDisplay = computed<string>(() => {
  return totalWeight.value > 0 ? String(totalWeight.value) : '-'
})

function applyFilter(): void {
  appliedMonth.value = selectedMonth.value
  showFlash('Filter applied.')
}

function resetFilter(): void {
  selectedMonth.value = currentMonth()
  appliedMonth.value = currentMonth()
  search.value = ''
  showFlash('Filter reset.')
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function showFlash(message: string): void {
  flashMessage.value = message
  window.setTimeout(() => {
    flashMessage.value = ''
  }, 2200)
}

function orderTypeClass(type: string): Record<string, boolean> {
  const normalized = type.toUpperCase()
  return {
    'badge-emerald': ['DINE_IN', 'SALE', 'POS'].includes(normalized),
    'badge-amber': ['TAKEAWAY', 'PICKUP'].includes(normalized),
    'badge-violet': ['DELIVERY'].includes(normalized),
    'badge-slate': !['DINE_IN', 'SALE', 'POS', 'TAKEAWAY', 'PICKUP', 'DELIVERY'].includes(normalized),
  }
}

onMounted(() => {
  void fetchOrders()
})
</script>

<style scoped>
.report-page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}
.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.6;
}
.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: #64748b;
  font-size: 0.92rem;
}
.breadcrumb .active {
  color: #059814;
  font-weight: 700;
}
.page-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}
.stat-card {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}
.stat-card.emerald { border-top: 4px solid #16a34a; }
.stat-card.blue { border-top: 4px solid #2563eb; }
.stat-card.amber { border-top: 4px solid #f59e0b; }
.stat-card.violet { border-top: 4px solid #7c3aed; }
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  font-size: 24px;
  flex-shrink: 0;
}
.stat-label {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #64748b;
}
.stat-value {
  margin: 6px 0 4px;
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
}
.stat-meta {
  margin: 0;
  color: #6b7280;
  font-size: 0.92rem;
}
.toolbar-card,
.table-card,
.alert-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}
.toolbar-card {
  padding: 20px;
  margin-bottom: 22px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.alert-card {
  padding: 16px 18px;
  margin-bottom: 22px;
}
.alert-card.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.toolbar-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toolbar-field label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
}
.search-field {
  min-width: 280px;
}
.form-input {
  min-height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  outline: none;
  background: #fff;
}
.form-input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}
.card-header {
  padding: 20px 22px 16px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}
.card-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: #111827;
}
.card-header p {
  margin: 6px 0 0;
  color: #6b7280;
}
.table-summary {
  color: #475569;
  font-size: 0.95rem;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
}
.modern-table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
}
.modern-table thead th {
  text-align: left;
  padding: 16px 18px;
  color: #1677ff;
  font-size: 0.95rem;
  font-weight: 800;
  background: #fcfdff;
  border-bottom: 1px solid #e5e7eb;
}
.modern-table tbody td {
  padding: 16px 18px;
  border-bottom: 1px solid #eef2f7;
  color: #1e293b;
  vertical-align: top;
}
.modern-table tbody tr:hover {
  background: #f8fafc;
}
.primary-cell {
  font-weight: 700;
  color: #0f172a;
}
.sub-cell {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 4px;
}
.amount-cell {
  font-weight: 700;
  color: #059669;
}
.empty-state {
  text-align: center;
  padding: 28px !important;
  color: #64748b;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}
.badge-blue {
  background: #dbeafe;
  color: #1d4ed8;
}
.badge-emerald {
  background: #dcfce7;
  color: #166534;
}
.badge-amber {
  background: #fef3c7;
  color: #b45309;
}
.badge-violet {
  background: #ede9fe;
  color: #6d28d9;
}
.badge-slate {
  background: #e2e8f0;
  color: #334155;
}
.btn {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}
.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-light {
  background: #f1f5f9;
  color: #0f172a;
}
.btn-light:hover {
  background: #e2e8f0;
}
.btn-primary {
  background: #1677ff;
  color: #fff;
}
.btn-primary:hover {
  background: #0f67ea;
}
.flash-message {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 999;
  background: #111827;
  color: #fff;
  padding: 14px 18px;
  border-radius: 14px;
  font-weight: 700;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.24);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .report-page {
    padding: 16px;
  }
  .page-title {
    font-size: 1.6rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .toolbar-left,
  .toolbar-right,
  .search-field {
    width: 100%;
  }
  .form-input,
  .btn {
    width: 100%;
  }
}
</style>