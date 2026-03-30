<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'

type Direction = 'IN' | 'OUT'

type TransactionType =
  | 'SALE_IN'
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'REFUND_OUT'
  | 'ADJUSTMENT'

type BankLedger = {
  id: number
  shop_id: number
  shop_name: string
  shop_code: string
  bank_account: number
  bank_account_name: string
  transaction_type: TransactionType
  direction: Direction
  amount: string
  balance_before: string
  balance_after: string
  reference_order: number | null
  reference_order_invoice: string
  reference_payment: number | null
  description: string
  created_at: string
  created_by: number | null
}

const BANK_LEDGERS_ENDPOINT = '/api/bank-ledgers/'

const ledgers = ref<BankLedger[]>([])
const loading = ref(false)
const detailLoading = ref(false)
const errorMessage = ref('')

const search = ref('')
const transactionTypeFilter = ref('')
const directionFilter = ref('')
const accountFilter = ref('')

const showDetailModal = ref(false)
const selectedLedger = ref<BankLedger | null>(null)

const TRANSACTION_TYPES: TransactionType[] = [
  'SALE_IN',
  'DEPOSIT',
  'WITHDRAW',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'REFUND_OUT',
  'ADJUSTMENT',
]

const filteredLedgers = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return ledgers.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.bank_account_name?.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword) ||
      item.reference_order_invoice?.toLowerCase().includes(keyword) ||
      item.shop_name?.toLowerCase().includes(keyword)

    const matchesType =
      !transactionTypeFilter.value || item.transaction_type === transactionTypeFilter.value

    const matchesDirection =
      !directionFilter.value || item.direction === directionFilter.value

    const matchesAccount =
      !accountFilter.value || item.bank_account_name === accountFilter.value

    return matchesKeyword && matchesType && matchesDirection && matchesAccount
  })
})

const totalEntries = computed(() => filteredLedgers.value.length)

const totalIn = computed(() =>
  filteredLedgers.value
    .filter((item) => item.direction === 'IN')
    .reduce((sum, item) => sum + toNumber(item.amount), 0)
)

const totalOut = computed(() =>
  filteredLedgers.value
    .filter((item) => item.direction === 'OUT')
    .reduce((sum, item) => sum + toNumber(item.amount), 0)
)

const netFlow = computed(() => totalIn.value - totalOut.value)

const accountOptions = computed(() => {
  return [...new Set(ledgers.value.map((item) => item.bank_account_name).filter(Boolean))]
})

function extractRows(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function normalizeLedger(raw: any): BankLedger {
  return {
    id: Number(raw?.id ?? 0),
    shop_id: Number(raw?.shop_id ?? 0),
    shop_name: raw?.shop_name ?? '',
    shop_code: raw?.shop_code ?? '',
    bank_account: Number(raw?.bank_account ?? 0),
    bank_account_name: raw?.bank_account_name ?? '',
    transaction_type: (raw?.transaction_type ?? 'ADJUSTMENT') as TransactionType,
    direction: (raw?.direction ?? 'IN') as Direction,
    amount: String(raw?.amount ?? '0.00'),
    balance_before: String(raw?.balance_before ?? '0.00'),
    balance_after: String(raw?.balance_after ?? '0.00'),
    reference_order: raw?.reference_order ?? null,
    reference_order_invoice: raw?.reference_order_invoice ?? '',
    reference_payment: raw?.reference_payment ?? null,
    description: raw?.description ?? '',
    created_at: raw?.created_at ?? '',
    created_by: raw?.created_by ?? null,
  }
}

function getErrorMessage(error: any, fallback = 'Request failed.') {
  const data = error?.response?.data

  if (typeof data === 'string') return data
  if (data?.detail) return String(data.detail)
  if (data?.message) return String(data.message)
  if (data?.error) return String(data.error)

  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0]
    const firstValue = firstKey ? data[firstKey] : null

    if (Array.isArray(firstValue) && firstValue.length) {
      return String(firstValue[0])
    }

    if (typeof firstValue === 'string') {
      return firstValue
    }
  }

  return error?.message || fallback
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(toNumber(value))
}

function formatDateTime(value: string | null | undefined) {
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

function getTransactionTypeLabel(type: TransactionType | string) {
  switch (type) {
    case 'SALE_IN':
      return 'Sale Income'
    case 'DEPOSIT':
      return 'Deposit'
    case 'WITHDRAW':
      return 'Withdraw'
    case 'TRANSFER_IN':
      return 'Transfer In'
    case 'TRANSFER_OUT':
      return 'Transfer Out'
    case 'REFUND_OUT':
      return 'Refund Out'
    case 'ADJUSTMENT':
      return 'Adjustment'
    default:
      return type || '-'
  }
}

async function fetchLedgers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(BANK_LEDGERS_ENDPOINT)
    const rows = extractRows(response.data)
    ledgers.value = rows.map(normalizeLedger)
  } catch (error: any) {
    console.error('Failed to load bank ledgers:', error)
    errorMessage.value = getErrorMessage(error, 'Failed to load bank ledgers.')
    ledgers.value = []
  } finally {
    loading.value = false
  }
}

async function openDetail(id: number) {
  detailLoading.value = true
  showDetailModal.value = true
  selectedLedger.value = null

  try {
    const response = await api.get(`${BANK_LEDGERS_ENDPOINT}${id}/`)
    selectedLedger.value = normalizeLedger(response.data)
  } catch (error: any) {
    console.error('Failed to load bank ledger detail:', error)
    errorMessage.value = getErrorMessage(error, 'Failed to load bank ledger detail.')
    showDetailModal.value = false
  } finally {
    detailLoading.value = false
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedLedger.value = null
}

onMounted(() => {
  fetchLedgers()
})
</script>

<template>
  <div class="page">
    <section class="hero-card">
      <div class="hero-left">
        <div class="hero-badge">Finance / Bank Ledgers</div>
        <h1 class="page-title">Bank Ledgers</h1>
        <p class="page-subtitle">
          Track all incoming and outgoing bank transactions with running balance history.
        </p>
      </div>

      <div class="hero-actions">
        <button class="secondary-btn" @click="fetchLedgers" :disabled="loading">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <p class="stat-label">Total Entries</p>
        <h3 class="stat-value">{{ totalEntries }}</h3>
        <p class="stat-note">Filtered bank ledger records</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Total In</p>
        <h3 class="stat-value money-in">{{ formatCurrency(totalIn) }}</h3>
        <p class="stat-note">All incoming transactions</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Total Out</p>
        <h3 class="stat-value money-out">{{ formatCurrency(totalOut) }}</h3>
        <p class="stat-note">All outgoing transactions</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Net Flow</p>
        <h3 class="stat-value">{{ formatCurrency(netFlow) }}</h3>
        <p class="stat-note">Incoming minus outgoing</p>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <div class="search-wrap">
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search account, invoice, description..."
          />
        </div>

        <select v-model="accountFilter" class="filter-select">
          <option value="">All Accounts</option>
          <option v-for="name in accountOptions" :key="name" :value="name">
            {{ name }}
          </option>
        </select>

        <select v-model="transactionTypeFilter" class="filter-select">
          <option value="">All Transaction Types</option>
          <option v-for="type in TRANSACTION_TYPES" :key="type" :value="type">
            {{ getTransactionTypeLabel(type) }}
          </option>
        </select>

        <select v-model="directionFilter" class="filter-select">
          <option value="">All Directions</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>
      </div>

      <div class="toolbar-right">
        <div class="result-chip">{{ filteredLedgers.length }} result(s)</div>
      </div>
    </section>

    <section v-if="errorMessage" class="alert error-alert">
      {{ errorMessage }}
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Ledger Transactions</h2>
          <p>Detailed bank flow history by account and transaction type.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Created At</th>
              <th>Account</th>
              <th>Transaction Type</th>
              <th>Direction</th>
              <th>Amount</th>
              <th>Before</th>
              <th>After</th>
              <th>Invoice / Order</th>
              <th>Description</th>
              <th class="action-col">Action</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr>
              <td colspan="10" class="empty-row">Loading bank ledgers...</td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredLedgers.length === 0">
            <tr>
              <td colspan="10" class="empty-row">No bank ledger records found.</td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="item in filteredLedgers" :key="item.id">
              <td>{{ formatDateTime(item.created_at) }}</td>

              <td>
                <div class="main-cell">
                  <div class="cell-title">{{ item.bank_account_name || '-' }}</div>
                  <div class="cell-subtitle">{{ item.shop_name || '-' }}</div>
                </div>
              </td>

              <td>
                <span class="type-badge transaction">
                  {{ getTransactionTypeLabel(item.transaction_type) }}
                </span>
              </td>

              <td>
                <span class="direction-badge" :class="item.direction === 'IN' ? 'in' : 'out'">
                  {{ item.direction }}
                </span>
              </td>

              <td :class="item.direction === 'IN' ? 'money-in' : 'money-out'">
                {{ formatCurrency(item.amount) }}
              </td>

              <td>{{ formatCurrency(item.balance_before) }}</td>
              <td class="strong-money">{{ formatCurrency(item.balance_after) }}</td>

              <td>
                <div class="main-cell">
                  <div class="cell-title">
                    {{ item.reference_order_invoice || '-' }}
                  </div>
                  <div class="cell-subtitle">
                    Order ID: {{ item.reference_order ?? '-' }}
                  </div>
                </div>
              </td>

              <td class="description-cell">
                {{ item.description || '-' }}
              </td>

              <td>
                <button class="icon-btn view" @click="openDetail(item.id)">
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>Bank Ledger Detail</h3>
            <p>Transaction detail and running balance information.</p>
          </div>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>

        <div class="modal-body">
          <div v-if="detailLoading" class="detail-loading">
            Loading detail...
          </div>

          <div v-else-if="selectedLedger" class="detail-grid">
            <div class="detail-item">
              <label>ID</label>
              <p>#{{ selectedLedger.id }}</p>
            </div>

            <div class="detail-item">
              <label>Shop</label>
              <p>{{ selectedLedger.shop_name || '-' }}</p>
            </div>

            <div class="detail-item">
              <label>Shop Code</label>
              <p>{{ selectedLedger.shop_code || '-' }}</p>
            </div>

            <div class="detail-item">
              <label>Bank Account</label>
              <p>{{ selectedLedger.bank_account_name || '-' }}</p>
            </div>

            <div class="detail-item">
              <label>Transaction Type</label>
              <p>{{ getTransactionTypeLabel(selectedLedger.transaction_type) }}</p>
            </div>

            <div class="detail-item">
              <label>Direction</label>
              <p>{{ selectedLedger.direction }}</p>
            </div>

            <div class="detail-item">
              <label>Amount</label>
              <p>{{ formatCurrency(selectedLedger.amount) }}</p>
            </div>

            <div class="detail-item">
              <label>Balance Before</label>
              <p>{{ formatCurrency(selectedLedger.balance_before) }}</p>
            </div>

            <div class="detail-item">
              <label>Balance After</label>
              <p>{{ formatCurrency(selectedLedger.balance_after) }}</p>
            </div>

            <div class="detail-item">
              <label>Reference Invoice</label>
              <p>{{ selectedLedger.reference_order_invoice || '-' }}</p>
            </div>

            <div class="detail-item">
              <label>Reference Order</label>
              <p>{{ selectedLedger.reference_order ?? '-' }}</p>
            </div>

            <div class="detail-item">
              <label>Reference Payment</label>
              <p>{{ selectedLedger.reference_payment ?? '-' }}</p>
            </div>

            <div class="detail-item detail-item-full">
              <label>Description</label>
              <p>{{ selectedLedger.description || '-' }}</p>
            </div>

            <div class="detail-item detail-item-full">
              <label>Created At</label>
              <p>{{ formatDateTime(selectedLedger.created_at) }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="closeDetailModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100%;
  color: #0f172a;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #ffffff, #eff6ff);
  border: 1px solid #dbeafe;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 20px;
}

.hero-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #111827;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #6b7280;
  max-width: 680px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

.secondary-btn,
.icon-btn {
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn {
  background: white;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 12px 18px;
}

.secondary-btn:hover {
  background: #eff6ff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.stat-label {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.stat-value {
  margin: 10px 0 6px;
  font-size: 28px;
  font-weight: 800;
  color: #111827;
}

.stat-note {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.money-in {
  color: #15803d;
  font-weight: 800;
}

.money-out {
  color: #dc2626;
  font-weight: 800;
}

.toolbar-card,
.table-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.search-wrap {
  flex: 1;
  min-width: 260px;
}

.search-input,
.filter-select {
  width: 100%;
  border: 1px solid #dbe4ee;
  border-radius: 14px;
  padding: 12px 14px;
  outline: none;
  font-size: 14px;
  background: #fff;
  color: #111827;
}

.search-input:focus,
.filter-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.filter-select {
  min-width: 190px;
  max-width: 240px;
}

.result-chip {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.alert {
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.table-header h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
}

.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 1450px;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  font-size: 13px;
  color: #64748b;
  font-weight: 800;
  padding: 14px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #111827;
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.main-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-title {
  font-weight: 800;
  color: #111827;
}

.cell-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.type-badge,
.direction-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 800;
}

.type-badge.transaction {
  background: #f1f5f9;
  color: #334155;
}

.direction-badge.in {
  background: #dcfce7;
  color: #166534;
}

.direction-badge.out {
  background: #fee2e2;
  color: #b91c1c;
}

.description-cell {
  max-width: 240px;
  white-space: normal;
  color: #475569;
}

.strong-money {
  font-weight: 800;
}

.action-col {
  width: 120px;
}

.icon-btn.view {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 10px 12px;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 32px !important;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal-card {
  width: min(860px, 100%);
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.25);
}

.modal-header,
.modal-footer {
  padding: 20px 22px;
}

.modal-header {
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 24px;
  color: #111827;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.close-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: none;
  background: #f8fafc;
  color: #334155;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 22px;
}

.detail-loading {
  color: #64748b;
  font-weight: 700;
  padding: 20px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.detail-item {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
}

.detail-item-full {
  grid-column: 1 / -1;
}

.detail-item label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  margin-bottom: 6px;
}

.detail-item p {
  margin: 0;
  color: #111827;
  font-weight: 700;
  line-height: 1.5;
}

.modal-footer {
  border-top: 1px solid #eef2f7;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .hero-card {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer > * {
    width: 100%;
  }
}
</style>