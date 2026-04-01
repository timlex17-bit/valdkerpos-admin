<template>
  <div class="chart-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Sales Chart</h1>
        <p class="page-subtitle">
          Visual sales and profit summary from monthly P/L report and sale payment breakdown.
        </p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Reports</span>
          <span>›</span>
          <span class="active">Sales Chart</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" @click="loadAll" :disabled="loading">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>Total Sales</p>
        <h3>{{ currency(summary.sales) }}</h3>
        <span>{{ rangeLabel }}</span>
      </article>

      <article class="summary-card blue">
        <p>Total Profit</p>
        <h3>{{ currency(summary.profit) }}</h3>
        <span>From monthly report</span>
      </article>

      <article class="summary-card violet">
        <p>Best Sales Day</p>
        <h3>{{ bestSalesDayLabel }}</h3>
        <span>{{ bestSalesDayAmount }}</span>
      </article>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="chart-card">
      <div class="card-header">
        <div>
          <h2>Sales per Day</h2>
          <p>Line chart built from /api/reports/monthly-pl/ rows.</p>
        </div>
      </div>

      <div v-if="loading" class="chart-empty">Loading chart data...</div>
      <div v-else-if="chartRows.length === 0" class="chart-empty">No chart data found.</div>

      <div v-else class="line-chart-wrap">
        <div class="line-chart-y">
          <span>{{ yAxisMaxLabel }}</span>
          <span>{{ yAxisMidLabel }}</span>
          <span>0</span>
        </div>

        <div class="line-chart-area">
          <svg class="line-svg" viewBox="0 0 1000 320" preserveAspectRatio="none">
            <line x1="0" y1="40" x2="1000" y2="40" class="grid-line" />
            <line x1="0" y1="160" x2="1000" y2="160" class="grid-line" />
            <line x1="0" y1="280" x2="1000" y2="280" class="grid-line" />

            <polyline :points="salesPoints" class="sales-line" />
            <polyline :points="profitPoints" class="profit-line" />

            <circle
              v-for="(point, index) in salesPointObjects"
              :key="`sales-${index}`"
              :cx="point.x"
              :cy="point.y"
              r="5"
              class="sales-point"
            />
            <circle
              v-for="(point, index) in profitPointObjects"
              :key="`profit-${index}`"
              :cx="point.x"
              :cy="point.y"
              r="4"
              class="profit-point"
            />
          </svg>

          <div class="x-labels">
            <span v-for="row in chartRows" :key="row.date">{{ shortDate(row.date) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="payment-card">
      <div class="card-header">
        <div>
          <h2>Payment Method Breakdown</h2>
          <p>Aggregated from /api/sale-payments/</p>
        </div>
      </div>

      <div v-if="paymentRows.length === 0" class="chart-empty">
        No payment breakdown data found.
      </div>

      <div v-else class="payment-list">
        <div v-for="item in paymentRows" :key="item.name" class="payment-item">
          <div class="payment-head">
            <strong>{{ item.name }}</strong>
            <span>{{ currency(item.amount) }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${item.percent}%` }"></div>
          </div>
          <div class="payment-meta">{{ item.percent.toFixed(1) }}%</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type MonthlyRow = {
  date: string
  sales: number
  expense: number
  profit: number
}

type PaymentBreakdown = {
  name: string
  amount: number
  percent: number
}

type ChartPoint = {
  x: number
  y: number
}

type MonthlyPLResponse = {
  range?: {
    start?: string
    end?: string
  }
  summary?: {
    sales?: number | string
    expense?: number | string
    profit?: number | string
  }
  rows?: Array<{
    date?: string
    sales?: number | string
    expense?: number | string
    profit?: number | string
  }>
}

type SalePaymentItem = {
  payment_method_name?: string
  payment_type?: string
  bank_account_name?: string
  amount?: number | string
}

const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const chartRows = ref<MonthlyRow[]>([])
const paymentRows = ref<PaymentBreakdown[]>([])
const summary = ref<{ sales: number; expense: number; profit: number }>({
  sales: 0,
  expense: 0,
  profit: 0,
})
const range = ref<{ start: string; end: string }>({
  start: '',
  end: '',
})

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: T[] }).results
  }
  return []
}

async function fetchMonthlyPL(): Promise<void> {
  const response = await api.get<MonthlyPLResponse>(ENDPOINTS.REPORT_MONTHLY_PL)
  const data = response.data ?? {}

  range.value = {
    start: data.range?.start || '',
    end: data.range?.end || '',
  }

  summary.value = {
    sales: asNumber(data.summary?.sales, 0),
    expense: asNumber(data.summary?.expense, 0),
    profit: asNumber(data.summary?.profit, 0),
  }

  chartRows.value = normalizeArray<MonthlyRow>(data.rows)
    .map((item) => ({
      date: item.date || '',
      sales: asNumber(item.sales, 0),
      expense: asNumber(item.expense, 0),
      profit: asNumber(item.profit, 0),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

async function fetchSalePayments(): Promise<void> {
  try {
    const response = await api.get<SalePaymentItem[] | { results?: SalePaymentItem[] }>(
      ENDPOINTS.SALE_PAYMENTS
    )
    const list = normalizeArray<SalePaymentItem>(response.data)

    const totalsMap: Record<string, number> = list.reduce<Record<string, number>>((acc, item) => {
      const key =
        item.payment_method_name ||
        item.payment_type ||
        item.bank_account_name ||
        'UNKNOWN'

      acc[key] = (acc[key] || 0) + asNumber(item.amount, 0)
      return acc
    }, {})

    const entries: [string, number][] = Object.entries(totalsMap) as [string, number][]
    const total = entries.reduce((sum, [, value]) => sum + value, 0)

    paymentRows.value = entries
      .map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  } catch {
    paymentRows.value = []
  }
}

async function loadAll(): Promise<void> {
  loading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([fetchMonthlyPL(), fetchSalePayments()])
  } catch (error: unknown) {
    chartRows.value = []
    paymentRows.value = []

    if (axios.isAxiosError(error)) {
      const detail =
        typeof error.response?.data === 'object' &&
        error.response?.data &&
        'detail' in error.response.data
          ? String((error.response.data as { detail?: unknown }).detail ?? '')
          : ''

      errorMessage.value = detail || 'Failed to load sales chart data.'
    } else {
      errorMessage.value = 'Failed to load sales chart data.'
    }
  } finally {
    loading.value = false
  }
}

const rangeLabel = computed<string>(() => {
  if (!range.value.start || !range.value.end) return 'Current range'
  return `${range.value.start} → ${range.value.end}`
})

const bestSalesRow = computed<MonthlyRow | null>(() => {
  if (chartRows.value.length === 0) return null
  return [...chartRows.value].sort((a, b) => b.sales - a.sales)[0] ?? null
})

const bestSalesDayLabel = computed<string>(() => {
  return bestSalesRow.value ? formatDate(bestSalesRow.value.date) : '-'
})

const bestSalesDayAmount = computed<string>(() => {
  return bestSalesRow.value ? currency(bestSalesRow.value.sales) : '-'
})

const chartMax = computed<number>(() => {
  const candidates: number[] = []
  chartRows.value.forEach((row) => {
    candidates.push(row.sales)
    candidates.push(row.profit)
  })
  const max = Math.max(...candidates, 0)
  return max <= 0 ? 1 : max
})

const yAxisMaxLabel = computed<string>(() => currency(chartMax.value))
const yAxisMidLabel = computed<string>(() => currency(chartMax.value / 2))

function buildPoints(values: number[]): { text: string; objects: ChartPoint[] } {
  if (values.length === 0) {
    return { text: '', objects: [] }
  }

  const stepX = values.length === 1 ? 500 : 1000 / (values.length - 1)

  const objects: ChartPoint[] = values.map((value, index) => {
    const x = values.length === 1 ? 500 : stepX * index
    const y = 280 - (value / chartMax.value) * 240
    return { x, y }
  })

  return {
    text: objects.map((item) => `${item.x},${item.y}`).join(' '),
    objects,
  }
}

const salesPointsComputed = computed<{ text: string; objects: ChartPoint[] }>(() =>
  buildPoints(chartRows.value.map((row) => row.sales)),
)

const profitPointsComputed = computed<{ text: string; objects: ChartPoint[] }>(() =>
  buildPoints(chartRows.value.map((row) => row.profit)),
)

const salesPoints = computed<string>(() => salesPointsComputed.value.text)
const profitPoints = computed<string>(() => profitPointsComputed.value.text)
const salesPointObjects = computed<ChartPoint[]>(() => salesPointsComputed.value.objects)
const profitPointObjects = computed<ChartPoint[]>(() => profitPointsComputed.value.objects)

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function shortDate(value: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

onMounted(() => {
  void loadAll()
})
</script>

<style scoped>
.chart-page {
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
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}
.summary-card {
  border-radius: 20px;
  padding: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}
.summary-card p {
  margin: 0;
  color: #475569;
  font-weight: 700;
}
.summary-card h3 {
  margin: 10px 0 8px;
  color: #111827;
  font-size: 1.55rem;
  font-weight: 800;
}
.summary-card span {
  color: #64748b;
  font-size: 0.92rem;
}
.summary-card.emerald { background: #ecfdf5; }
.summary-card.blue { background: #eff6ff; }
.summary-card.violet { background: #f5f3ff; }
.chart-card,
.payment-card,
.alert-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}
.payment-card {
  margin-top: 22px;
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
.card-header {
  padding: 20px 22px 16px;
  border-bottom: 1px solid #eef2f7;
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
.line-chart-wrap {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 12px;
  padding: 24px;
  min-height: 420px;
}
.line-chart-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #64748b;
  font-weight: 700;
}
.line-chart-area {
  position: relative;
}
.line-svg {
  width: 100%;
  height: 320px;
  display: block;
}
.grid-line {
  stroke: rgba(148, 163, 184, 0.28);
  stroke-width: 1;
}
.sales-line {
  fill: none;
  stroke: #16a34a;
  stroke-width: 4;
}
.profit-line {
  fill: none;
  stroke: #2563eb;
  stroke-width: 3;
  stroke-dasharray: 8 6;
}
.sales-point {
  fill: #16a34a;
}
.profit-point {
  fill: #2563eb;
}
.x-labels {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  color: #475569;
  font-weight: 700;
  font-size: 0.85rem;
}
.chart-empty {
  padding: 36px 24px;
  color: #64748b;
}
.payment-list {
  padding: 20px 22px 24px;
  display: grid;
  gap: 16px;
}
.payment-item {
  display: grid;
  gap: 10px;
}
.payment-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #0f172a;
}
.progress-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #1677ff);
}
.payment-meta {
  color: #64748b;
  font-size: 0.88rem;
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
@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .chart-page {
    padding: 16px;
  }
  .page-title {
    font-size: 1.6rem;
  }
  .line-chart-wrap {
    grid-template-columns: 46px 1fr;
    min-height: 360px;
    padding: 16px;
  }
}
</style>