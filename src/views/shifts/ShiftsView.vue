<template>
  <section class="shifts-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <div>
          <h1 class="page-title">Shifts</h1>
          <p class="page-subtitle">
            Manage cashier shift sessions for your current shop.
          </p>
        </div>

        <nav class="breadcrumb">
          <span>Home</span>
          <span class="sep">/</span>
          <span>POS</span>
          <span class="sep">/</span>
          <span class="current">Shifts</span>
        </nav>
      </div>

      <div class="header-actions">
        <button class="btn btn-light" @click="refreshAll">
          Refresh Current
        </button>

        <button
          v-if="!currentShift"
          class="btn btn-primary add-btn"
          @click="openShiftModal"
        >
          <span class="btn-icon">＋</span>
          Open Shift
        </button>

        <button
          v-else
          class="btn btn-danger add-btn"
          @click="openCloseModal(currentShift)"
        >
          Close Current Shift
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Shifts</div>
        <div class="stat-value">{{ filteredShifts.length }}</div>
        <div class="stat-note">Shifts shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Open Shifts</div>
        <div class="stat-value">{{ openShiftsCount }}</div>
        <div class="stat-note">Currently open shift records</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Current Shift</div>
        <div class="stat-value">
          {{ currentShift ? `#${currentShift.id}` : '-' }}
        </div>
        <div class="stat-note">
          {{ currentShift ? 'There is an active shift' : 'No active shift' }}
        </div>
      </div>
    </div>

    <div v-if="currentShift" class="current-shift-card">
      <div class="current-shift-top">
        <div>
          <h2>Current Shift</h2>
          <p>Shift currently active for this account.</p>
        </div>

        <span class="status-badge status-open">Open</span>
      </div>

      <div class="current-shift-grid">
        <div class="info-box">
          <span class="label">Shift ID</span>
          <strong>#{{ currentShift.id }}</strong>
        </div>

        <div class="info-box">
          <span class="label">Cashier</span>
          <strong>{{ getCashierName(currentShift) }}</strong>
        </div>

        <div class="info-box">
          <span class="label">Opened At</span>
          <strong>{{ formatDateTimeDisplay(getOpenedAt(currentShift)) }}</strong>
        </div>

        <div class="info-box">
          <span class="label">Opening Cash</span>
          <strong>${{ formatMoney(getOpeningCash(currentShift)) }}</strong>
        </div>

        <div class="info-box">
          <span class="label">Status</span>
          <strong>{{ getShiftStatus(currentShift) }}</strong>
        </div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box toolbar-item toolbar-search">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by cashier, id, or status..."
          />
        </div>

        <div class="toolbar-item">
          <select v-model="statusFilter" class="filter-select">
            <option value="">All status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div class="toolbar-item">
          <input
            v-model="dateFilter"
            type="date"
            class="filter-input"
          />
        </div>

        <div class="toolbar-item toolbar-reset">
          <button class="btn btn-light" @click="resetFilters">
            Reset
          </button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <div>
          <h2>Shift List</h2>
          <p>{{ filteredShifts.length }} shift(s) found</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        Loading shifts...
      </div>

      <div v-else-if="errorMessage" class="error-state">
        {{ errorMessage }}
      </div>

      <div v-else class="table-wrapper desktop-table">
        <table class="shift-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cashier</th>
              <th>Status</th>
              <th>Opened At</th>
              <th>Closed At</th>
              <th>Opening Cash</th>
              <th>Closing Cash</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredShifts.length === 0">
              <td colspan="8" class="empty-cell">
                No shifts found.
              </td>
            </tr>

            <tr v-for="shift in filteredShifts" :key="shift.id">
              <td>
                <span class="id-badge">#{{ shift.id }}</span>
              </td>

              <td>
                <div class="cashier-block">
                  <div class="cashier-avatar">
                    {{ getInitials(getCashierName(shift)) }}
                  </div>
                  <div>
                    <div class="cashier-name">{{ getCashierName(shift) }}</div>
                    <div class="cashier-sub">Cashier</div>
                  </div>
                </div>
              </td>

              <td>
                <span
                  :class="[
                    'status-badge',
                    getShiftStatus(shift) === 'Open' ? 'status-open' : 'status-closed'
                  ]"
                >
                  {{ getShiftStatus(shift) }}
                </span>
              </td>

              <td>
                <span class="table-value">
                  {{ formatDateTimeDisplay(getOpenedAt(shift)) }}
                </span>
              </td>
              <td>
                <span class="table-value">
                  {{ getClosedAt(shift) ? formatDateTimeDisplay(getClosedAt(shift)) : '-' }}
                </span>
              </td>
              <td>
                <span class="table-value">
                  ${{ formatMoney(getOpeningCash(shift)) }}
                </span>
              </td>
              <td>
                <span class="table-value">
                  {{ hasClosingCashValue(shift) ? `$${formatMoney(getClosingCash(shift))}` : '-' }}
                </span>
              </td>

              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(shift)">
                    View
                  </button>

                  <button class="btn btn-sm btn-info" @click="fetchShiftReport(shift.id)">
                    Report
                  </button>

                  <button
                    v-if="getShiftStatus(shift) === 'Open'"
                    class="btn btn-sm btn-warning"
                    @click="openCloseModal(shift)"
                  >
                    Close
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !errorMessage" class="mobile-list">
        <div v-if="filteredShifts.length === 0" class="mobile-empty">
          No shifts found.
        </div>

        <div
          v-for="shift in filteredShifts"
          :key="shift.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div class="cashier-block">
              <div class="cashier-avatar">
                {{ getInitials(getCashierName(shift)) }}
              </div>
              <div>
                <div class="cashier-name">{{ getCashierName(shift) }}</div>
                <div class="cashier-sub">Shift #{{ shift.id }}</div>
              </div>
            </div>

            <span
              :class="[
                'status-badge',
                getShiftStatus(shift) === 'Open' ? 'status-open' : 'status-closed'
              ]"
            >
              {{ getShiftStatus(shift) }}
            </span>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">Opened At</span>
              <span class="value">{{ formatDateTimeDisplay(getOpenedAt(shift)) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Closed At</span>
              <span class="value">{{ getClosedAt(shift) ? formatDateTimeDisplay(getClosedAt(shift)) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Opening Cash</span>
              <span class="value">${{ formatMoney(getOpeningCash(shift)) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Closing Cash</span>
              <span class="value">
                {{ hasClosingCashValue(shift) ? `$${formatMoney(getClosingCash(shift))}` : '-' }}
              </span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(shift)">
              View
            </button>

            <button class="btn btn-sm btn-info" @click="fetchShiftReport(shift.id)">
              Report
            </button>

            <button
              v-if="getShiftStatus(shift) === 'Open'"
              class="btn btn-sm btn-warning"
              @click="openCloseModal(shift)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showOpenModal" class="modal-overlay" @click.self="closeOpenModal">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h3>Open Shift</h3>
              <p>Open a new cashier shift for the current shop.</p>
            </div>

            <button class="modal-close" @click="closeOpenModal">×</button>
          </div>

          <div class="modal-body">
            <form class="shift-form" @submit.prevent="submitOpenShift">
              <div class="form-grid single-col">
                <div class="form-group">
                  <label>Shop ID <span>*</span></label>
                  <input
                    v-model="openForm.shop"
                    type="number"
                    min="1"
                    placeholder="Shop ID"
                    :disabled="openingShift"
                  />
                </div>

                <div class="form-group">
                  <label>Opening Cash <span>*</span></label>
                  <input
                    v-model="openForm.opening_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    :disabled="openingShift"
                  />
                </div>
              </div>

              <div v-if="openFormError" class="form-error">
                {{ openFormError }}
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-light modal-btn" @click="closeOpenModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary modal-btn" :disabled="openingShift">
                  {{ openingShift ? 'Opening...' : 'Open Shift' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showCloseModal" class="modal-overlay" @click.self="closeCloseModal">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h3>Close Shift</h3>
              <p>Enter closing cash to close this shift.</p>
            </div>

            <button class="modal-close" @click="closeCloseModal">×</button>
          </div>

          <div class="modal-body">
            <form class="shift-form" @submit.prevent="submitCloseShift">
              <div class="form-grid single-col">
                <div class="form-group">
                  <label>Shift ID</label>
                  <input :value="closingShiftId || '-'" type="text" disabled />
                </div>

                <div class="form-group">
                  <label>Closing Cash <span>*</span></label>
                  <input
                    v-model="closeForm.closing_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="120.00"
                    :disabled="closingShift"
                  />
                </div>
              </div>

              <div v-if="closeFormError" class="form-error">
                {{ closeFormError }}
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-light modal-btn" @click="closeCloseModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-danger modal-btn" :disabled="closingShift">
                  {{ closingShift ? 'Closing...' : 'Close Shift' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div>
              <h3>Shift Detail</h3>
              <p>View shift information.</p>
            </div>

            <button class="modal-close" @click="closeViewModal">×</button>
          </div>

          <div class="modal-body">
            <div v-if="selectedShift" class="detail-grid">
              <div class="detail-item">
                <span class="label">Shift ID</span>
                <strong>#{{ selectedShift.id }}</strong>
              </div>
              <div class="detail-item">
                <span class="label">Cashier</span>
                <strong>{{ getCashierName(selectedShift) }}</strong>
              </div>
              <div class="detail-item">
                <span class="label">Status</span>
                <strong>{{ getShiftStatus(selectedShift) }}</strong>
              </div>
              <div class="detail-item">
                <span class="label">Opened At</span>
                <strong>{{ formatDateTimeDisplay(getOpenedAt(selectedShift)) }}</strong>
              </div>
              <div class="detail-item">
                <span class="label">Closed At</span>
                <strong>{{ getClosedAt(selectedShift) ? formatDateTimeDisplay(getClosedAt(selectedShift)) : '-' }}</strong>
              </div>
              <div class="detail-item">
                <span class="label">Opening Cash</span>
                <strong>${{ formatMoney(getOpeningCash(selectedShift)) }}</strong>
              </div>
              <div class="detail-item">
                <span class="label">Closing Cash</span>
                <strong>{{ hasClosingCashValue(selectedShift) ? `$${formatMoney(getClosingCash(selectedShift))}` : '-' }}</strong>
              </div>
              <div class="detail-item">
                <span class="label">Raw Data</span>
                <strong>Available</strong>
              </div>
            </div>

            <pre v-if="selectedShift" class="json-preview">{{ JSON.stringify(selectedShift, null, 2) }}</pre>

            <div class="modal-footer">
              <button type="button" class="btn btn-primary modal-btn" @click="closeViewModal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div>
              <h3>Shift Report</h3>
              <p>Shift report response from API.</p>
            </div>

            <button class="modal-close" @click="closeReportModal">×</button>
          </div>

          <div class="modal-body">
            <pre class="json-preview">{{ JSON.stringify(shiftReport, null, 2) }}</pre>

            <div class="modal-footer">
              <button type="button" class="btn btn-primary modal-btn" @click="closeReportModal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'

type ShiftRecord = Record<string, any>

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('token') ||
    ''

  if (token) {
    config.headers.Authorization = `Token ${token}`
  }

  return config
})

const search = ref('')
const statusFilter = ref('')
const dateFilter = ref('')
const loading = ref(false)
const errorMessage = ref('')

const shifts = ref<ShiftRecord[]>([])
const currentShift = ref<ShiftRecord | null>(null)
const currentShopId = ref<number | null>(null)

const showOpenModal = ref(false)
const showCloseModal = ref(false)
const showViewModal = ref(false)
const showReportModal = ref(false)

const openingShift = ref(false)
const closingShift = ref(false)

const openFormError = ref('')
const closeFormError = ref('')

const openForm = ref({
  shop: '',
  opening_cash: '50.00',
})

const closeForm = ref({
  closing_cash: '0.00',
})

const closingShiftId = ref<number | null>(null)
const selectedShift = ref<ShiftRecord | null>(null)
const shiftReport = ref<any>(null)

const filteredShifts = computed(() => {
  let result = [...shifts.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((shift) => {
      return (
        String(shift?.id ?? '').toLowerCase().includes(q) ||
        getCashierName(shift).toLowerCase().includes(q) ||
        getShiftStatus(shift).toLowerCase().includes(q)
      )
    })
  }

  if (statusFilter.value) {
    result = result.filter((shift) => getShiftStatus(shift) === statusFilter.value)
  }

  if (dateFilter.value) {
    result = result.filter((shift) => {
      const opened = getOpenedAt(shift)
      return opened ? opened.slice(0, 10) === dateFilter.value : false
    })
  }

  return result
})

const openShiftsCount = computed(() => {
  return shifts.value.filter((shift) => getShiftStatus(shift) === 'Open').length
})

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  dateFilter.value = ''
}

function safeText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  return fallback
}

function firstDefined(...values: any[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return null
}

function normalizeShift(raw: any): ShiftRecord {
  const row = raw?.shift && typeof raw.shift === 'object' ? raw.shift : raw || {}
  const report = row?.report && typeof row.report === 'object' ? row.report : raw?.report || {}
  const summary = row?.summary && typeof row.summary === 'object' ? row.summary : raw?.summary || {}
  const totals = row?.totals && typeof row.totals === 'object' ? row.totals : raw?.totals || {}

  return {
    ...row,
    id: firstDefined(row.id, raw?.id),
    shop: firstDefined(row.shop, raw?.shop),
    cashier: firstDefined(row.cashier, raw?.cashier),
    cashier_name: firstDefined(
      row.cashier_name,
      raw?.cashier_name,
      row.cashier?.full_name,
      row.cashier?.name,
      row.cashier?.username,
      raw?.cashier?.full_name,
      raw?.cashier?.name,
      raw?.cashier?.username,
      row.user?.full_name,
      row.user?.name,
      row.user?.username,
      raw?.user?.full_name,
      raw?.user?.name,
      raw?.user?.username,
      ''
    ),
    status: firstDefined(row.status, raw?.status, report?.status, summary?.status, ''),
    opened_at: firstDefined(
      row.opened_at,
      raw?.opened_at,
      report?.opened_at,
      summary?.opened_at,
      row.start_time,
      raw?.start_time,
      row.created_at,
      raw?.created_at,
      ''
    ),
    closed_at: firstDefined(
      row.closed_at,
      raw?.closed_at,
      report?.closed_at,
      summary?.closed_at,
      row.end_time,
      raw?.end_time,
      ''
    ),
    opening_cash: firstDefined(
      row.opening_cash,
      raw?.opening_cash,
      report?.opening_cash,
      summary?.opening_cash,
      totals?.opening_cash,
      row.open_cash,
      raw?.open_cash,
      0
    ),
    closing_cash: firstDefined(
      row.closing_cash,
      raw?.closing_cash,
      report?.closing_cash,
      summary?.closing_cash,
      totals?.closing_cash,
      row.close_cash,
      raw?.close_cash,
      null
    ),
  }
}

function getCashierName(shift: ShiftRecord): string {
  if (!shift || typeof shift !== 'object') return 'Cashier'

  const directCandidates = [
    shift.cashier_name,
    shift.user_name,
    shift.username,
    shift.staff_name,
    shift.cashier_display_name,
    shift.operator_name,
  ]

  for (const item of directCandidates) {
    const value = safeText(item)
    if (value) return value
  }

  const cashier = shift.cashier
  if (typeof cashier === 'string' || typeof cashier === 'number') {
    return safeText(cashier, 'Cashier')
  }

  if (cashier && typeof cashier === 'object') {
    const nestedCandidates = [
      cashier.full_name,
      cashier.name,
      cashier.username,
      cashier.email,
      cashier.id,
    ]

    for (const item of nestedCandidates) {
      const value = safeText(item)
      if (value) return value
    }
  }

  return 'Cashier'
}

function getOpenedAt(shift: ShiftRecord): string {
  return safeText(
    firstDefined(
      shift?.opened_at,
      shift?.report?.opened_at,
      shift?.summary?.opened_at,
      shift?.start_time,
      shift?.created_at,
      ''
    ),
    ''
  )
}

function getClosedAt(shift: ShiftRecord): string {
  return safeText(
    firstDefined(
      shift?.closed_at,
      shift?.report?.closed_at,
      shift?.summary?.closed_at,
      shift?.end_time,
      ''
    ),
    ''
  )
}

function getOpeningCash(shift: ShiftRecord): number {
  const value = firstDefined(
    shift?.opening_cash,
    shift?.report?.opening_cash,
    shift?.summary?.opening_cash,
    shift?.totals?.opening_cash,
    shift?.open_cash,
    0
  )
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getClosingCash(shift: ShiftRecord): number {
  const value = firstDefined(
    shift?.closing_cash,
    shift?.report?.closing_cash,
    shift?.summary?.closing_cash,
    shift?.totals?.closing_cash,
    shift?.close_cash,
    null
  )
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function hasClosingCashValue(shift: ShiftRecord): boolean {
  const value = firstDefined(
    shift?.closing_cash,
    shift?.report?.closing_cash,
    shift?.summary?.closing_cash,
    shift?.totals?.closing_cash,
    shift?.close_cash,
    null
  )
  return value !== null && value !== undefined && value !== ''
}

function getShiftStatus(shift: ShiftRecord): 'Open' | 'Closed' {
  const rawStatus = firstDefined(
    shift?.is_open,
    shift?.status,
    shift?.report?.status,
    shift?.summary?.status,
    null
  )

  if (typeof rawStatus === 'boolean') {
    return rawStatus ? 'Open' : 'Closed'
  }

  if (rawStatus !== null && rawStatus !== undefined) {
    const value = String(rawStatus).trim().toLowerCase()
    if (['open', 'opened', 'active'].includes(value)) return 'Open'
    if (['closed', 'close', 'inactive'].includes(value)) return 'Closed'
  }

  return getClosedAt(shift) ? 'Closed' : 'Open'
}

function formatMoney(value: unknown): string {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : '0.00'
}

function formatDateTimeDisplay(value: string): string {
  if (!value) return '-'

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getInitials(name: unknown): string {
  let safeName = ''

  if (typeof name === 'string') {
    safeName = name.trim()
  } else if (typeof name === 'number') {
    safeName = String(name)
  } else if (name && typeof name === 'object') {
    const obj = name as Record<string, any>
    safeName =
      safeText(obj.full_name) ||
      safeText(obj.name) ||
      safeText(obj.username) ||
      safeText(obj.email) ||
      ''
  }

  if (!safeName) return 'NA'

  const parts = safeName.split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'NA'
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

async function fetchShopMe() {
  try {
    const response = await api.get('/api/shop/me/')
    const data = response.data || {}
    currentShopId.value = data.id || data.shop?.id || null

    if (currentShopId.value) {
      openForm.value.shop = String(currentShopId.value)
    }
  } catch {
    currentShopId.value = null
  }
}

async function fetchShifts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/api/shifts/')
    const data = response.data

    let rows: any[] = []

    if (Array.isArray(data)) {
      rows = data
    } else if (Array.isArray(data?.results)) {
      rows = data.results
    } else if (Array.isArray(data?.shifts)) {
      rows = data.shifts
    } else if (Array.isArray(data?.data)) {
      rows = data.data
    } else {
      rows = []
    }

    shifts.value = rows.map((item) => normalizeShift(item))
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to load shifts.'
    shifts.value = []
  } finally {
    loading.value = false
  }
}

async function fetchCurrentShift() {
  try {
    const response = await api.get('/api/shifts/current/')
    const data = response.data || null

    if (!data || data.open === false || !data.shift) {
      currentShift.value = null
      return
    }

    currentShift.value = normalizeShift(data.shift)
  } catch {
    currentShift.value = null
  }
}

async function refreshAll() {
  await Promise.all([fetchShopMe(), fetchShifts(), fetchCurrentShift()])
}

function openShiftModal() {
  openFormError.value = ''
  openForm.value.opening_cash = '50.00'

  if (currentShopId.value) {
    openForm.value.shop = String(currentShopId.value)
  }

  showOpenModal.value = true
}

function closeOpenModal() {
  showOpenModal.value = false
  openFormError.value = ''
}

function openCloseModal(shift: ShiftRecord) {
  closeFormError.value = ''
  closingShiftId.value = shift?.id ?? null
  closeForm.value.closing_cash = hasClosingCashValue(shift)
    ? String(getClosingCash(shift))
    : '0.00'
  showCloseModal.value = true
}

function closeCloseModal() {
  showCloseModal.value = false
  closingShiftId.value = null
  closeFormError.value = ''
}

function openViewModal(shift: ShiftRecord) {
  selectedShift.value = shift
  showViewModal.value = true
}

function closeViewModal() {
  selectedShift.value = null
  showViewModal.value = false
}

function closeReportModal() {
  shiftReport.value = null
  showReportModal.value = false
}

async function submitOpenShift() {
  openFormError.value = ''

  if (!openForm.value.shop) {
    openFormError.value = 'Shop ID is required.'
    return
  }

  if (Number(openForm.value.opening_cash) < 0) {
    openFormError.value = 'Opening cash cannot be negative.'
    return
  }

  openingShift.value = true

  try {
    await api.post('/api/shifts/open/', {
      shop: Number(openForm.value.shop),
      opening_cash: Number(openForm.value.opening_cash).toFixed(2),
    })

    await Promise.all([fetchShifts(), fetchCurrentShift()])
    closeOpenModal()
  } catch (error: any) {
    const data = error?.response?.data

    if (typeof data === 'string') {
      openFormError.value = data
    } else if (data?.detail) {
      openFormError.value = data.detail
    } else if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      const firstValue = data[firstKey]
      openFormError.value = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
    } else {
      openFormError.value = error?.message || 'Failed to open shift.'
    }
  } finally {
    openingShift.value = false
  }
}

async function submitCloseShift() {
  closeFormError.value = ''

  if (Number(closeForm.value.closing_cash) < 0) {
    closeFormError.value = 'Closing cash cannot be negative.'
    return
  }

  closingShift.value = true

  try {
    if (closingShiftId.value) {
      await api.post(`/api/shifts/${closingShiftId.value}/close/`, {
        closing_cash: Number(closeForm.value.closing_cash).toFixed(2),
      })
    } else {
      await api.post('/api/shifts/close/', {
        closing_cash: Number(closeForm.value.closing_cash).toFixed(2),
      })
    }

    await Promise.all([fetchShifts(), fetchCurrentShift()])
    closeCloseModal()
  } catch (error: any) {
    const data = error?.response?.data

    if (typeof data === 'string') {
      closeFormError.value = data
    } else if (data?.detail) {
      closeFormError.value = data.detail
    } else if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      const firstValue = data[firstKey]
      closeFormError.value = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
    } else {
      closeFormError.value = error?.message || 'Failed to close shift.'
    }
  } finally {
    closingShift.value = false
  }
}

async function fetchShiftReport(id: number) {
  try {
    const response = await api.get(`/api/shifts/${id}/report/`)
    shiftReport.value = response.data || {}
    showReportModal.value = true
  } catch (error: any) {
    window.alert(
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to fetch shift report.'
    )
  }
}

onMounted(async () => {
  await refreshAll()
})
</script>

<style scoped>
.shifts-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1 1 420px;
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #162033;
  line-height: 1.1;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #7b8496;
  font-size: 14px;
}

.breadcrumb .current {
  color: #1f6feb;
  font-weight: 600;
}

.sep {
  opacity: 0.6;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.add-btn {
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card,
.toolbar-card,
.table-card,
.current-shift-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #eef1f6;
}

.stat-card {
  padding: 20px;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: clamp(24px, 3vw, 28px);
  font-weight: 800;
  color: #172033;
  line-height: 1.1;
  word-break: break-word;
}

.stat-note {
  margin-top: 8px;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.current-shift-card {
  padding: 20px;
  margin-bottom: 20px;
}

.current-shift-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.current-shift-top h2 {
  margin: 0;
  font-size: 20px;
  color: #162033;
}

.current-shift-top p {
  margin: 6px 0 0;
  color: #6b7280;
}

.current-shift-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.info-box,
.detail-item {
  border: 1px solid #edf2f7;
  border-radius: 16px;
  padding: 14px;
  background: #fbfcfe;
}

.info-box .label,
.detail-item .label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.info-box strong,
.detail-item strong {
  color: #162033;
  word-break: break-word;
}

.toolbar-card {
  padding: 18px;
  margin-bottom: 20px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: minmax(260px, 2fr) minmax(180px, 1fr) minmax(180px, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.toolbar-item {
  min-width: 0;
}

.toolbar-reset {
  display: flex;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid #dbe3ef;
  background: #f9fbff;
  padding: 0 16px 0 44px;
  font-size: 14px;
  outline: none;
  transition: 0.2s ease;
}

.search-box input:focus,
.filter-input:focus,
.filter-select:focus,
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 15px;
}

.filter-input,
.filter-select {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid #dbe3ef;
  background: #f9fbff;
  padding: 0 14px;
  font-size: 14px;
  color: #162033;
  outline: none;
  transition: 0.2s ease;
}

.table-card {
  padding: 18px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.table-header h2 {
  margin: 0;
  font-size: 20px;
  color: #162033;
}

.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.table-wrapper {
  overflow-x: auto;
}

.shift-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1050px;
}

.shift-table th,
.shift-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.shift-table th {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  background: #fbfcfe;
  white-space: nowrap;
}

.shift-table tbody tr:hover {
  background: #fafcff;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.cashier-block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.cashier-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: white;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.cashier-name {
  font-weight: 700;
  color: #162033;
  line-height: 1.4;
  word-break: break-word;
}

.cashier-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8798;
  line-height: 1.4;
}

.table-value {
  color: #162033;
  font-weight: 600;
  display: inline-block;
  min-width: 100px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-open {
  background: #ecfdf3;
  color: #16a34a;
}

.status-closed {
  background: #f1f5f9;
  color: #475569;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.text-right {
  text-align: right;
}

.empty-cell {
  text-align: center !important;
  color: #94a3b8;
  padding: 32px !important;
}

.mobile-list {
  display: none;
}

.mobile-card {
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 16px;
  background: #fff;
  margin-bottom: 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.mobile-card:last-child {
  margin-bottom: 0;
}

.mobile-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.mobile-info-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #334155;
  min-width: 0;
}

.info-item .label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-item .value {
  word-break: break-word;
  line-height: 1.5;
}

.mobile-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.mobile-actions .btn {
  width: 100%;
}

.mobile-empty {
  text-align: center;
  color: #94a3b8;
  padding: 24px 0;
}

.loading-state,
.error-state {
  padding: 24px;
  border-radius: 16px;
  margin-top: 10px;
  font-weight: 600;
}

.loading-state {
  background: #eff6ff;
  color: #1d4ed8;
}

.error-state {
  background: #fef2f2;
  color: #dc2626;
}

.form-error {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
}

.json-preview {
  margin-top: 18px;
  padding: 16px;
  border-radius: 16px;
  background: #0f172a;
  color: #e2e8f0;
  overflow: auto;
  font-size: 13px;
  line-height: 1.5;
}

.btn {
  border: none;
  outline: none;
  cursor: pointer;
  transition: 0.2s ease;
  border-radius: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #fff;
  height: 48px;
  padding: 0 18px;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.18);
}

.btn-primary:hover {
  transform: translateY(-1px);
}

.btn-light {
  background: #eef2f7;
  color: #334155;
  height: 48px;
  padding: 0 16px;
}

.btn-outline {
  background: #fff;
  color: #2563eb;
  border: 1px solid #cfe0ff;
}

.btn-warning {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.btn-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-info {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.btn-sm {
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 12px;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 760px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
  overflow: hidden;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.modal-lg {
  max-width: 980px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: #162033;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.modal-close {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: #f3f6fb;
  color: #475569;
  font-size: 24px;
  cursor: pointer;
  flex-shrink: 0;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.shift-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.single-col {
  grid-template-columns: 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.form-group label span {
  color: #dc2626;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #fbfcff;
  padding: 12px 14px;
  font-size: 14px;
  color: #162033;
  outline: none;
  transition: 0.2s ease;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-btn {
  min-width: 150px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-reset .btn {
    width: 100%;
  }
}

@media (max-width: 1024px) {
  .shifts-page {
    padding: 20px;
  }

  .stats-grid,
  .current-shift-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .shifts-page {
    padding: 16px;
  }

  .page-header {
    align-items: stretch;
  }

  .page-title-wrap {
    flex: 1 1 100%;
  }

  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .header-actions,
  .add-btn,
  .header-actions .btn {
    width: 100%;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }

  .toolbar-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-item,
  .toolbar-reset,
  .toolbar-reset .btn {
    width: 100%;
  }

  .table-card,
  .toolbar-card,
  .stat-card,
  .current-shift-card {
    border-radius: 18px;
  }

  .table-card {
    padding: 14px;
  }

  .modal-card,
  .modal-lg {
    max-width: 100%;
    border-radius: 20px;
    max-height: calc(100vh - 24px);
  }

  .modal-body,
  .modal-header {
    padding: 18px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
    min-width: 0;
  }

  .mobile-info-grid,
  .mobile-actions,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .mobile-actions .btn {
    height: 40px;
  }
}

@media (max-width: 480px) {
  .shifts-page {
    padding: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .breadcrumb {
    font-size: 12px;
    gap: 6px;
  }

  .stat-card,
  .current-shift-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 22px;
  }

  .toolbar-card {
    padding: 14px;
  }

  .table-header h2 {
    font-size: 18px;
  }

  .mobile-card {
    padding: 14px;
    border-radius: 16px;
  }

  .cashier-avatar {
    width: 36px;
    height: 36px;
    font-size: 11px;
  }

  .status-badge {
    min-width: 70px;
    font-size: 11px;
    padding: 6px 10px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .modal-header h3 {
    font-size: 18px;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    font-size: 22px;
  }
}
</style>