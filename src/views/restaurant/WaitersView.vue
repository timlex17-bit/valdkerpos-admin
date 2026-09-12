<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  extractDetailMessage,
  getWaiterPerformance,
  listWaiters,
  type Waiter,
  type WaiterPerformanceRow,
} from '@/services/restaurantService'
import { canShowModule, parseStoredJson } from '@/utils/moduleVisibility'

const router = useRouter()
const { t, locale } = useI18n()

const waiters = ref<Waiter[]>([])
const search = ref('')
const loadingStaff = ref(false)
const staffError = ref('')

const performance = ref<WaiterPerformanceRow[]>([])
const loadingPerformance = ref(false)
const performanceError = ref('')
const performanceLoaded = ref(false)

const dateRange = reactive({
  from: '',
  to: '',
})

const filteredWaiters = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return waiters.value

  return waiters.value.filter((waiter) =>
    [waiter.name, waiter.username, waiter.role].join(' ').toLowerCase().includes(keyword),
  )
})

const servingCount = computed(
  () => waiters.value.filter((waiter) => waiter.active_orders_count > 0).length,
)

const ordersInProgress = computed(() =>
  waiters.value.reduce((sum, waiter) => sum + waiter.active_orders_count, 0),
)

function getIntlLocale() {
  if (locale.value === 'id') return 'id-ID'
  if (locale.value === 'tet') return 'id-ID'
  return 'en-US'
}

/**
 * Money arrives as a two-decimal string the server already rounded with
 * ROUND_HALF_EVEN. Intl.NumberFormat accepts a decimal string directly and
 * formats the digits exactly as given, so the value is never turned into a
 * float and re-rounded - parseFloat would reintroduce binary rounding into a
 * number the server had deliberately settled.
 */
function formatMoney(value: string) {
  const raw = String(value ?? '').trim()
  if (!raw) return '-'
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return raw

  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(raw as unknown as number)
}

/**
 * The `waiter_id: null` row is the "no waiter recorded" bucket. The backend
 * keeps it on purpose and says it is the row a restaurant owner most needs to
 * see, so it is labelled rather than hidden, and never filtered out.
 */
function rowLabel(row: WaiterPerformanceRow) {
  if (row.waiter_id === null) return t('waitersPage.unassigned')
  return row.waiter_name || `#${row.waiter_id}`
}

async function fetchWaiters() {
  loadingStaff.value = true
  staffError.value = ''

  try {
    waiters.value = await listWaiters()
  } catch (error: any) {
    staffError.value = extractDetailMessage(error, t('waitersPage.failedLoadStaff'))
  } finally {
    loadingStaff.value = false
  }
}

async function fetchPerformance() {
  loadingPerformance.value = true
  performanceError.value = ''

  try {
    const report = await getWaiterPerformance({
      date_from: dateRange.from || undefined,
      date_to: dateRange.to || undefined,
    })
    performance.value = report.results
    performanceLoaded.value = true
  } catch (error: any) {
    performance.value = []
    performanceError.value = extractDetailMessage(error, t('waitersPage.failedLoadPerformance'))
  } finally {
    loadingPerformance.value = false
  }
}

function clearDates() {
  dateRange.from = ''
  dateRange.to = ''
  fetchPerformance()
}

onMounted(() => {
  const user = parseStoredJson<Record<string, any> | null>('user', null)
  if (!canShowModule('waiters', user)) {
    sessionStorage.setItem(
      'module_access_message',
      'This module is not available for your business type, plan, or role.',
    )
    router.replace('/dashboard')
    return
  }

  fetchWaiters()
  fetchPerformance()
})
</script>

<template>
  <div class="restaurant-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('waitersPage.title') }}</h1>
        <p class="page-subtitle">{{ t('waitersPage.subtitle') }}</p>
        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>/</span>
          <span>{{ t('waitersPage.breadcrumbRestaurant') }}</span>
          <span>/</span>
          <span class="active">{{ t('waitersPage.title') }}</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" type="button" :disabled="loadingStaff" @click="fetchWaiters">
          {{ loadingStaff ? t('common.loading') : t('usersPage.refresh') }}
        </button>
      </div>
    </section>

    <!-- There is no waiter role in this system and nothing here creates one:
         no "make waiter" action, no per-person toggle. Every active staff
         member is already a candidate. -->
    <section class="alert-card note">
      {{ t('waitersPage.designNote') }}
    </section>

    <section v-if="staffError" class="alert-card error">
      {{ staffError }}
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>{{ t('waitersPage.totalStaff') }}</p>
        <h3>{{ waiters.length }}</h3>
      </article>
      <article class="summary-card amber">
        <p>{{ t('waitersPage.staffServing') }}</p>
        <h3>{{ servingCount }}</h3>
      </article>
      <article class="summary-card blue">
        <p>{{ t('waitersPage.ordersInProgress') }}</p>
        <h3>{{ ordersInProgress }}</h3>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input
          v-model="search"
          type="text"
          class="search-input"
          :placeholder="t('waitersPage.searchPlaceholder')"
        />
      </div>
      <span class="results-count">{{ filteredWaiters.length }}</span>
    </section>

    <section class="table-card">
      <div class="section-head">
        <h2>{{ t('waitersPage.staffList') }}</h2>
        <p>{{ t('waitersPage.staffListSubtitle') }}</p>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('waitersPage.name') }}</th>
              <th>{{ t('waitersPage.username') }}</th>
              <th>{{ t('waitersPage.role') }}</th>
              <th>{{ t('waitersPage.activeOrders') }}</th>
              <th>{{ t('waitersPage.activeTables') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingStaff && !waiters.length">
              <td colspan="5" class="empty-state">{{ t('waitersPage.loadingStaff') }}</td>
            </tr>
            <tr v-else-if="!filteredWaiters.length">
              <td colspan="5" class="empty-state">{{ t('waitersPage.noStaff') }}</td>
            </tr>
            <tr v-for="waiter in filteredWaiters" :key="waiter.id">
              <td>
                <div class="primary-cell">
                  <strong>{{ waiter.name || waiter.username }}</strong>
                </div>
              </td>
              <td>{{ waiter.username }}</td>
              <td>
                <span class="status-pill muted">{{ waiter.role }}</span>
              </td>
              <td>
                <span class="status-pill" :class="waiter.active_orders_count > 0 ? 'busy' : 'idle'">
                  {{ waiter.active_orders_count }}
                </span>
              </td>
              <td>
                <span v-if="!waiter.active_tables.length" class="muted-text">
                  {{ t('waitersPage.noTables') }}
                </span>
                <span v-else class="table-chips">
                  <span v-for="name in waiter.active_tables" :key="name" class="chip">{{ name }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="table-card">
      <div class="section-head">
        <h2>{{ t('waitersPage.performance') }}</h2>
        <p>{{ t('waitersPage.performanceSubtitle') }}</p>
      </div>

      <div class="filter-row">
        <label class="form-group">
          <span>{{ t('waitersPage.dateFrom') }}</span>
          <input v-model="dateRange.from" class="form-input" type="date" />
        </label>
        <label class="form-group">
          <span>{{ t('waitersPage.dateTo') }}</span>
          <input v-model="dateRange.to" class="form-input" type="date" />
        </label>
        <div class="filter-actions">
          <button
            class="btn btn-primary"
            type="button"
            :disabled="loadingPerformance"
            @click="fetchPerformance"
          >
            {{ loadingPerformance ? t('common.loading') : t('waitersPage.apply') }}
          </button>
          <button class="btn btn-light" type="button" :disabled="loadingPerformance" @click="clearDates">
            {{ t('waitersPage.clearDates') }}
          </button>
        </div>
      </div>

      <div v-if="performanceError" class="alert-card error inline">
        {{ performanceError }}
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('waitersPage.waiter') }}</th>
              <th>{{ t('waitersPage.ordersCount') }}</th>
              <th>{{ t('waitersPage.totalSales') }}</th>
              <th>{{ t('waitersPage.avgOrderValue') }}</th>
              <th>{{ t('waitersPage.itemsServed') }}</th>
              <th>{{ t('waitersPage.tablesServed') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingPerformance && !performance.length">
              <td colspan="6" class="empty-state">{{ t('waitersPage.loadingPerformance') }}</td>
            </tr>
            <tr v-else-if="performanceLoaded && !performance.length">
              <td colspan="6" class="empty-state">{{ t('waitersPage.noPerformance') }}</td>
            </tr>
            <tr
              v-for="(row, index) in performance"
              :key="row.waiter_id === null ? 'unassigned' : `w-${row.waiter_id}-${index}`"
              :class="{ 'row-unassigned': row.waiter_id === null }"
            >
              <td>
                <div class="primary-cell">
                  <strong>{{ rowLabel(row) }}</strong>
                  <span v-if="row.waiter_id === null" class="unassigned-note">
                    {{ t('waitersPage.unassignedNote') }}
                  </span>
                </div>
              </td>
              <td>{{ row.orders_count }}</td>
              <td class="money">{{ formatMoney(row.total_sales) }}</td>
              <td class="money">{{ formatMoney(row.avg_order_value) }}</td>
              <td>{{ row.items_served }}</td>
              <td>{{ row.tables_served }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.restaurant-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header,
.toolbar-card,
.table-card,
.summary-card,
.alert-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.page-header {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
}

.breadcrumb,
.page-actions,
.toolbar-left,
.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.breadcrumb {
  margin-top: 10px;
  font-size: 13px;
  color: #94a3b8;
}

.breadcrumb .active {
  color: #16a34a;
  font-weight: 700;
}

.alert-card {
  padding: 14px 16px;
  font-weight: 600;
}

.alert-card.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.alert-card.note {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
}

.alert-card.inline {
  margin: 0 16px 12px;
  border-radius: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.summary-card {
  padding: 18px 20px;
}

.summary-card p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.summary-card h3 {
  margin: 6px 0 0;
  font-size: 30px;
  font-weight: 800;
  color: #0f172a;
}

.summary-card.emerald {
  border-top: 3px solid #16a34a;
}

.summary-card.blue {
  border-top: 3px solid #2563eb;
}

.summary-card.amber {
  border-top: 3px solid #f59e0b;
}

.toolbar-card {
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input,
.form-input {
  min-height: 42px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 0 12px;
  outline: none;
  color: #0f172a;
  background: #fff;
}

.search-input {
  min-width: 240px;
}

.results-count {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.table-card {
  padding: 6px 6px 10px;
}

.section-head {
  padding: 16px 16px 4px;
}

.section-head h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
}

.section-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 14px 16px;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #0f172a;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.primary-cell strong {
  font-weight: 700;
}

.money {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

/* The "no waiter recorded" row is marked out rather than hidden - it is the
   one a restaurant owner most needs to notice. */
.row-unassigned {
  background: #fffbeb;
}

.unassigned-note {
  font-size: 11px;
  color: #92400e;
  font-weight: 600;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 800;
}

.status-pill.muted {
  background: #f1f5f9;
  color: #64748b;
}

.status-pill.busy {
  background: #fef3c7;
  color: #92400e;
}

.status-pill.idle {
  background: #dcfce7;
  color: #166534;
}

.table-chips {
  display: inline-flex;
  gap: 5px;
  flex-wrap: wrap;
}

.chip {
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
}

.muted-text {
  color: #94a3b8;
}

.empty-state {
  padding: 26px 16px;
  text-align: center;
  color: #94a3b8;
}

.btn {
  min-height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

.btn-light {
  background: #fff;
  border: 1px solid #dbe3ef;
  color: #334155;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
