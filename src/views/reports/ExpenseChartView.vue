<template>
  <div class="chart-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Expense Chart</h1>
        <p class="page-subtitle">
          Visual summary of expense trends and spending performance from monthly P/L report.
        </p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Reports</span>
          <span>›</span>
          <span class="active">Expense Chart</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" @click="fetchChart" :disabled="loading">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card cyan">
        <p>Total Expense</p>
        <h3>{{ currency(summary.expense) }}</h3>
        <span>{{ rangeLabel }}</span>
      </article>

      <article class="summary-card orange">
        <p>Average Daily Expense</p>
        <h3>{{ currency(avgDailyExpense) }}</h3>
        <span>Based on available rows</span>
      </article>

      <article class="summary-card purple">
        <p>Highest Expense Day</p>
        <h3>{{ highestExpenseDay }}</h3>
        <span>{{ highestExpenseAmount }}</span>
      </article>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="chart-card">
      <div class="card-header">
        <div>
          <h2>Total Expense per Day</h2>
          <p>Bar chart built from /api/reports/monthly-pl/ rows.</p>
        </div>
      </div>

      <div v-if="loading" class="chart-empty">Loading chart data...</div>
      <div v-else-if="rows.length === 0" class="chart-empty">No expense data found.</div>

      <div v-else class="expense-chart-area">
        <div class="y-guides">
          <span>{{ yAxisMax }}</span>
          <span>{{ yAxisMid }}</span>
          <span>0</span>
        </div>

        <div class="bars-area">
          <div class="guide-lines">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div class="expense-bars">
            <div
              v-for="item in barRows"
              :key="item.date"
              class="expense-bar-wrap"
              :class="{ featured: item.isHighest }"
            >
              <div class="bar-value">{{ currency(item.expense) }}</div>
              <div class="expense-bar" :style="{ height: `${item.height}%` }"></div>
              <label>{{ shortDate(item.date) }}</label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="card-header">
        <div>
          <h2>Expense Summary Rows</h2>
          <p>Daily rows from monthly P/L endpoint.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sales</th>
              <th>Expense</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="4" class="empty-state">No summary rows found.</td>
            </tr>
            <tr v-for="item in rows" :key="item.date">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ currency(item.sales) }}</td>
              <td class="expense-text">{{ currency(item.expense) }}</td>
              <td :class="{ 'profit-positive': item.profit >= 0, 'profit-negative': item.profit < 0 }">
                {{ currency(item.profit) }}
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
import axios from 'axios'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type MonthlyRow = {
  date: string
  sales: number
  expense: number
  profit: number
}

type BarRow = MonthlyRow & {
  height: number
  isHighest: boolean
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

const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const rows = ref<MonthlyRow[]>([])
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

async function fetchChart(): Promise<void> {
  loading.value = true
  errorMessage.value = ''

  try {
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

    rows.value = normalizeArray<MonthlyRow>(data.rows)
      .map((item) => ({
        date: item.date || '',
        sales: asNumber(item.sales, 0),
        expense: asNumber(item.expense, 0),
        profit: asNumber(item.profit, 0),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch (error: unknown) {
    rows.value = []

    if (axios.isAxiosError(error)) {
      const detail =
        typeof error.response?.data === 'object' &&
        error.response?.data &&
        'detail' in error.response.data
          ? String((error.response.data as { detail?: unknown }).detail ?? '')
          : ''

      errorMessage.value = detail || 'Failed to load expense chart data.'
    } else {
      errorMessage.value = 'Failed to load expense chart data.'
    }
  } finally {
    loading.value = false
  }
}

const rangeLabel = computed<string>(() => {
  if (!range.value.start || !range.value.end) return 'Current range'
  return `${range.value.start} → ${range.value.end}`
})

const avgDailyExpense = computed<number>(() => {
  if (rows.value.length === 0) return 0
  return summary.value.expense / rows.value.length
})

const highestExpenseRow = computed<MonthlyRow | null>(() => {
  if (rows.value.length === 0) return null
  return [...rows.value].sort((a, b) => b.expense - a.expense)[0] ?? null
})

const highestExpenseDay = computed<string>(() => {
  return highestExpenseRow.value ? formatDate(highestExpenseRow.value.date) : '-'
})

const highestExpenseAmount = computed<string>(() => {
  return highestExpenseRow.value ? currency(highestExpenseRow.value.expense) : '-'
})

const maxExpense = computed<number>(() => {
  const max = Math.max(...rows.value.map((item) => item.expense), 0)
  return max <= 0 ? 1 : max
})

const yAxisMax = computed<string>(() => currency(maxExpense.value))
const yAxisMid = computed<string>(() => currency(maxExpense.value / 2))

const barRows = computed<BarRow[]>(() => {
  const highestDate = highestExpenseRow.value?.date || ''

  return rows.value.map((item) => ({
    ...item,
    height: Math.max((item.expense / maxExpense.value) * 100, item.expense > 0 ? 8 : 0),
    isHighest: item.date === highestDate,
  }))
})

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
  void fetchChart()
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
.summary-card.cyan { background: #ecfeff; }
.summary-card.orange { background: #fff7ed; }
.summary-card.purple { background: #f5f3ff; }
.chart-card,
.table-card,
.alert-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}
.table-card {
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
.expense-chart-area {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 12px;
  padding: 24px 24px 28px;
  min-height: 420px;
}
.y-guides {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #64748b;
  font-weight: 700;
  padding-top: 6px;
}
.bars-area {
  position: relative;
}
.guide-lines {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.guide-lines span {
  display: block;
  border-top: 1px solid rgba(148, 163, 184, 0.22);
}
.expense-bars {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: end;
  justify-content: space-around;
  gap: 20px;
  padding: 10px 10px 0;
}
.expense-bar-wrap {
  width: 140px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: end;
  gap: 10px;
  height: 100%;
}
.bar-value {
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 700;
}
.expense-bar {
  width: 100%;
  border-radius: 18px 18px 8px 8px;
  background: linear-gradient(180deg, #99f6e4, #14b8a6);
  box-shadow: 0 14px 28px rgba(20, 184, 166, 0.2);
}
.expense-bar-wrap.featured .expense-bar {
  background: linear-gradient(180deg, #fdba74, #f97316);
}
.expense-bar-wrap label {
  color: #475569;
  font-weight: 700;
}
.chart-empty {
  padding: 36px 24px;
  color: #64748b;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
}
.modern-table {
  width: 100%;
  min-width: 760px;
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
}
.modern-table tbody tr:hover {
  background: #f8fafc;
}
.empty-state {
  text-align: center;
  padding: 28px !important;
  color: #64748b;
}
.expense-text {
  color: #dc2626;
  font-weight: 700;
}
.profit-positive {
  color: #059669;
  font-weight: 700;
}
.profit-negative {
  color: #dc2626;
  font-weight: 700;
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
  .expense-bars {
    gap: 12px;
  }
  .expense-bar-wrap {
    width: 100px;
  }
}
@media (max-width: 768px) {
  .chart-page {
    padding: 16px;
  }
  .page-title {
    font-size: 1.6rem;
  }
  .expense-chart-area {
    grid-template-columns: 46px 1fr;
    min-height: 360px;
  }
  .expense-bar-wrap {
    width: 78px;
  }
}
</style>