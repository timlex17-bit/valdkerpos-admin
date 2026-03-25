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

      <button class="btn btn-primary add-btn" @click="openCreateModal">
        <span class="btn-icon">＋</span>
        Add Shift
      </button>
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
        <div class="stat-label">Total Sales</div>
        <div class="stat-value">${{ filteredSalesTotal }}</div>
        <div class="stat-note">Visible shift sales amount</div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box toolbar-item toolbar-search">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by cashier, status, or note..."
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

      <div class="table-wrapper desktop-table">
        <table class="shift-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cashier</th>
              <th>Status</th>
              <th>Opened At</th>
              <th>Closed At</th>
              <th>Opening Cash</th>
              <th>Expected Cash</th>
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
                    {{ getInitials(shift.cashier) }}
                  </div>
                  <div>
                    <div class="cashier-name">{{ shift.cashier }}</div>
                    <div class="cashier-sub">Cashier</div>
                  </div>
                </div>
              </td>

              <td>
                <span
                  :class="[
                    'status-badge',
                    shift.status === 'Open' ? 'status-open' : 'status-closed'
                  ]"
                >
                  {{ shift.status }}
                </span>
              </td>

              <td>{{ formatDateTimeDisplay(shift.opened_at) }}</td>
              <td>{{ shift.closed_at ? formatDateTimeDisplay(shift.closed_at) : '-' }}</td>
              <td>${{ formatMoney(shift.opening_cash) }}</td>
              <td>${{ formatMoney(shift.expected_cash) }}</td>

              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(shift)">
                    View
                  </button>
                  <button class="btn btn-sm btn-warning" @click="openEditModal(shift)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="removeShift(shift.id)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-list">
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
                {{ getInitials(shift.cashier) }}
              </div>
              <div>
                <div class="cashier-name">{{ shift.cashier }}</div>
                <div class="cashier-sub">Shift #{{ shift.id }}</div>
              </div>
            </div>

            <span
              :class="[
                'status-badge',
                shift.status === 'Open' ? 'status-open' : 'status-closed'
              ]"
            >
              {{ shift.status }}
            </span>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">Opened At</span>
              <span class="value">{{ formatDateTimeDisplay(shift.opened_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Closed At</span>
              <span class="value">{{ shift.closed_at ? formatDateTimeDisplay(shift.closed_at) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Opening Cash</span>
              <span class="value">${{ formatMoney(shift.opening_cash) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Expected Cash</span>
              <span class="value">${{ formatMoney(shift.expected_cash) }}</span>
            </div>
            <div class="info-item full">
              <span class="label">Note</span>
              <span class="value">{{ shift.note || '-' }}</span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(shift)">
              View
            </button>
            <button class="btn btn-sm btn-warning" @click="openEditModal(shift)">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" @click="removeShift(shift.id)">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div>
              <h3>
                {{
                  modalMode === 'create'
                    ? 'Add Shift'
                    : modalMode === 'edit'
                    ? 'Edit Shift'
                    : 'Shift Detail'
                }}
              </h3>
              <p>
                {{
                  modalMode === 'view'
                    ? 'View shift information'
                    : 'Fill in shift data below'
                }}
              </p>
            </div>

            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <form class="shift-form" @submit.prevent="saveShift">
              <div class="form-grid">
                <div class="form-group">
                  <label>Cashier <span>*</span></label>
                  <input
                    v-model="form.cashier"
                    type="text"
                    placeholder="Enter cashier name"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Status <span>*</span></label>
                  <select
                    v-model="form.status"
                    :disabled="modalMode === 'view'"
                    @change="handleStatusChange"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Opened Date <span>*</span></label>
                  <input
                    v-model="openedDate"
                    type="date"
                    :disabled="modalMode === 'view'"
                    @input="syncOpenedAt"
                  />
                  <button
                    v-if="modalMode !== 'view'"
                    type="button"
                    class="quick-link"
                    @click="setTodayOpened"
                  >
                    Today
                  </button>
                </div>

                <div class="form-group">
                  <label>Opened Time <span>*</span></label>
                  <input
                    v-model="openedTime"
                    type="time"
                    step="1"
                    :disabled="modalMode === 'view'"
                    @input="syncOpenedAt"
                  />
                  <button
                    v-if="modalMode !== 'view'"
                    type="button"
                    class="quick-link"
                    @click="setNowOpened"
                  >
                    Now
                  </button>
                </div>

                <div class="form-group">
                  <label>Closed Date</label>
                  <input
                    v-model="closedDate"
                    type="date"
                    :disabled="modalMode === 'view' || form.status === 'Open'"
                    @input="syncClosedAt"
                  />
                  <button
                    v-if="modalMode !== 'view' && form.status === 'Closed'"
                    type="button"
                    class="quick-link"
                    @click="setTodayClosed"
                  >
                    Today
                  </button>
                </div>

                <div class="form-group">
                  <label>Closed Time</label>
                  <input
                    v-model="closedTime"
                    type="time"
                    step="1"
                    :disabled="modalMode === 'view' || form.status === 'Open'"
                    @input="syncClosedAt"
                  />
                  <button
                    v-if="modalMode !== 'view' && form.status === 'Closed'"
                    type="button"
                    class="quick-link"
                    @click="setNowClosed"
                  >
                    Now
                  </button>
                </div>

                <div class="form-group">
                  <label>Opening Cash <span>*</span></label>
                  <input
                    v-model.number="form.opening_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateCashFields"
                  />
                </div>

                <div class="form-group">
                  <label>Closing Cash</label>
                  <input
                    v-model.number="form.closing_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateCashDifference"
                  />
                </div>

                <div class="form-group">
                  <label>Total Sales <span>*</span></label>
                  <input
                    v-model.number="form.total_sales"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateCashFields"
                  />
                </div>

                <div class="form-group">
                  <label>Total Refunds <span>*</span></label>
                  <input
                    v-model.number="form.total_refunds"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateCashFields"
                  />
                </div>

                <div class="form-group">
                  <label>Total Expenses <span>*</span></label>
                  <input
                    v-model.number="form.total_expenses"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateCashFields"
                  />
                </div>

                <div class="form-group">
                  <label>Expected Cash <span>*</span></label>
                  <input
                    :value="formatMoney(form.expected_cash)"
                    type="text"
                    disabled
                  />
                </div>

                <div class="form-group">
                  <label>Cash Difference <span>*</span></label>
                  <input
                    :value="formatMoney(form.cash_difference)"
                    type="text"
                    disabled
                  />
                </div>

                <div class="form-group full">
                  <label>Note</label>
                  <textarea
                    v-model="form.note"
                    rows="4"
                    placeholder="Enter shift note"
                    :disabled="modalMode === 'view'"
                  />
                </div>
              </div>

              <div v-if="modalMode !== 'view'" class="modal-footer">
                <button type="button" class="btn btn-light modal-btn" @click="closeModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary modal-btn">
                  {{ modalMode === 'create' ? 'Save Shift' : 'Update Shift' }}
                </button>
              </div>

              <div v-else class="modal-footer">
                <button type="button" class="btn btn-primary modal-btn" @click="closeModal">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

type ShiftStatus = 'Open' | 'Closed'

type Shift = {
  id: number
  cashier: string
  status: ShiftStatus
  opened_at: string
  closed_at: string
  opening_cash: number
  closing_cash: number
  total_sales: number
  total_refunds: number
  total_expenses: number
  expected_cash: number
  cash_difference: number
  note: string
}

type ModalMode = 'create' | 'edit' | 'view'

const search = ref('')
const statusFilter = ref('')
const dateFilter = ref('')
const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)

const openedDate = ref('')
const openedTime = ref('')
const closedDate = ref('')
const closedTime = ref('')

const shifts = ref<Shift[]>([
  {
    id: 27,
    cashier: 'Julio',
    status: 'Open',
    opened_at: '2026-03-21T16:51:00',
    closed_at: '',
    opening_cash: 50,
    closing_cash: 0,
    total_sales: 120,
    total_refunds: 5,
    total_expenses: 10,
    expected_cash: 155,
    cash_difference: -155,
    note: 'Evening shift still open.',
  },
  {
    id: 26,
    cashier: 'Kerry',
    status: 'Closed',
    opened_at: '2026-03-21T15:52:00',
    closed_at: '2026-03-21T21:10:00',
    opening_cash: 40,
    closing_cash: 140,
    total_sales: 120,
    total_refunds: 5,
    total_expenses: 15,
    expected_cash: 140,
    cash_difference: 0,
    note: 'Shift closed with balanced cash.',
  },
  {
    id: 24,
    cashier: 'Jefri',
    status: 'Open',
    opened_at: '2026-03-19T00:07:00',
    closed_at: '',
    opening_cash: 30,
    closing_cash: 0,
    total_sales: 60,
    total_refunds: 0,
    total_expenses: 8,
    expected_cash: 82,
    cash_difference: -82,
    note: 'Night shift.',
  },
])

const form = reactive<Shift>({
  id: 0,
  cashier: '',
  status: 'Open',
  opened_at: '',
  closed_at: '',
  opening_cash: 0,
  closing_cash: 0,
  total_sales: 0,
  total_refunds: 0,
  total_expenses: 0,
  expected_cash: 0,
  cash_difference: 0,
  note: '',
})

const filteredShifts = computed(() => {
  let result = [...shifts.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((shift) => {
      return (
        shift.cashier.toLowerCase().includes(q) ||
        shift.status.toLowerCase().includes(q) ||
        shift.note.toLowerCase().includes(q)
      )
    })
  }

  if (statusFilter.value) {
    result = result.filter((shift) => shift.status === statusFilter.value)
  }

  if (dateFilter.value) {
    result = result.filter((shift) => shift.opened_at.slice(0, 10) === dateFilter.value)
  }

  return result
})

const openShiftsCount = computed(() => {
  return shifts.value.filter((shift) => shift.status === 'Open').length
})

const filteredSalesTotal = computed(() => {
  const total = filteredShifts.value.reduce((sum, shift) => sum + Number(shift.total_sales || 0), 0)
  return formatMoney(total)
})

function resetForm() {
  form.id = 0
  form.cashier = ''
  form.status = 'Open'
  form.opened_at = ''
  form.closed_at = ''
  form.opening_cash = 0
  form.closing_cash = 0
  form.total_sales = 0
  form.total_refunds = 0
  form.total_expenses = 0
  form.expected_cash = 0
  form.cash_difference = 0
  form.note = ''

  openedDate.value = ''
  openedTime.value = ''
  closedDate.value = ''
  closedTime.value = ''
}

function fillForm(shift: Shift) {
  form.id = shift.id
  form.cashier = shift.cashier
  form.status = shift.status
  form.opened_at = shift.opened_at
  form.closed_at = shift.closed_at
  form.opening_cash = shift.opening_cash
  form.closing_cash = shift.closing_cash
  form.total_sales = shift.total_sales
  form.total_refunds = shift.total_refunds
  form.total_expenses = shift.total_expenses
  form.expected_cash = shift.expected_cash
  form.cash_difference = shift.cash_difference
  form.note = shift.note

  if (shift.opened_at) {
    openedDate.value = shift.opened_at.slice(0, 10)
    openedTime.value = shift.opened_at.slice(11, 19) || '00:00:00'
  } else {
    openedDate.value = ''
    openedTime.value = ''
  }

  if (shift.closed_at) {
    closedDate.value = shift.closed_at.slice(0, 10)
    closedTime.value = shift.closed_at.slice(11, 19) || '00:00:00'
  } else {
    closedDate.value = ''
    closedTime.value = ''
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  resetForm()
  form.status = 'Open'
  setTodayOpened()
  setNowOpened()
  recalculateCashFields()
  showModal.value = true
}

function openEditModal(shift: Shift) {
  modalMode.value = 'edit'
  editingId.value = shift.id
  fillForm(shift)
  recalculateCashFields()
  showModal.value = true
}

function openViewModal(shift: Shift) {
  modalMode.value = 'view'
  editingId.value = shift.id
  fillForm(shift)
  recalculateCashFields()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  resetForm()
}

function saveShift() {
  syncOpenedAt()
  syncClosedAt()
  recalculateCashFields()

  if (!form.cashier.trim()) {
    alert('Cashier is required.')
    return
  }

  if (!form.opened_at.trim()) {
    alert('Opened date and time are required.')
    return
  }

  if (form.status === 'Closed' && !form.closed_at.trim()) {
    alert('Closed date and time are required when status is Closed.')
    return
  }

  const payload: Shift = {
    id: editingId.value ?? 0,
    cashier: form.cashier.trim(),
    status: form.status,
    opened_at: form.opened_at.trim(),
    closed_at: form.status === 'Closed' ? form.closed_at.trim() : '',
    opening_cash: Number(form.opening_cash) || 0,
    closing_cash: Number(form.closing_cash) || 0,
    total_sales: Number(form.total_sales) || 0,
    total_refunds: Number(form.total_refunds) || 0,
    total_expenses: Number(form.total_expenses) || 0,
    expected_cash: Number(form.expected_cash) || 0,
    cash_difference: Number(form.cash_difference) || 0,
    note: form.note.trim(),
  }

  if (modalMode.value === 'create') {
    const nextId =
      shifts.value.length > 0
        ? Math.max(...shifts.value.map((shift) => shift.id)) + 1
        : 1

    shifts.value.unshift({
      ...payload,
      id: nextId,
    })
  } else if (modalMode.value === 'edit' && editingId.value !== null) {
    const index = shifts.value.findIndex((shift) => shift.id === editingId.value)
    if (index !== -1) {
      shifts.value[index] = {
        ...payload,
        id: editingId.value,
      }
    }
  }

  closeModal()
}

function removeShift(id: number) {
  const ok = window.confirm('Delete this shift?')
  if (!ok) return
  shifts.value = shifts.value.filter((shift) => shift.id !== id)
}

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  dateFilter.value = ''
}

function syncOpenedAt() {
  if (!openedDate.value) {
    form.opened_at = ''
    return
  }

  const time = openedTime.value || '00:00:00'
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  form.opened_at = `${openedDate.value}T${normalizedTime}`
}

function syncClosedAt() {
  if (form.status === 'Open') {
    form.closed_at = ''
    closedDate.value = ''
    closedTime.value = ''
    return
  }

  if (!closedDate.value) {
    form.closed_at = ''
    return
  }

  const time = closedTime.value || '00:00:00'
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  form.closed_at = `${closedDate.value}T${normalizedTime}`
}

function handleStatusChange() {
  if (form.status === 'Open') {
    form.closed_at = ''
    closedDate.value = ''
    closedTime.value = ''
    form.closing_cash = 0
  } else if (modalMode.value !== 'view' && !closedDate.value && !closedTime.value) {
    setTodayClosed()
    setNowClosed()
  }

  recalculateCashFields()
}

function setTodayOpened() {
  openedDate.value = new Date().toISOString().slice(0, 10)
  syncOpenedAt()
}

function setNowOpened() {
  openedTime.value = currentTimeString()
  syncOpenedAt()
}

function setTodayClosed() {
  closedDate.value = new Date().toISOString().slice(0, 10)
  syncClosedAt()
}

function setNowClosed() {
  closedTime.value = currentTimeString()
  syncClosedAt()
}

function currentTimeString() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function recalculateCashFields() {
  const openingCash = Number(form.opening_cash) || 0
  const totalSales = Number(form.total_sales) || 0
  const totalRefunds = Number(form.total_refunds) || 0
  const totalExpenses = Number(form.total_expenses) || 0

  form.expected_cash = Math.max(openingCash + totalSales - totalRefunds - totalExpenses, 0)
  recalculateCashDifference()
}

function recalculateCashDifference() {
  const closingCash = Number(form.closing_cash) || 0
  const expectedCash = Number(form.expected_cash) || 0
  form.cash_difference = closingCash - expectedCash
}

function formatMoney(value: number) {
  return Number(value || 0).toFixed(2)
}

function formatDateTimeDisplay(value: string) {
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NA'
}
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
.table-card {
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

.toolbar-search {
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

.mobile-info-grid {
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

.info-item.full {
  grid-column: 1 / -1;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.form-group.full {
  grid-column: 1 / -1;
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

.quick-link {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
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

  .stats-grid {
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

  .add-btn {
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
  .stat-card {
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

  .mobile-info-grid {
    grid-template-columns: 1fr;
  }

  .mobile-actions {
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

  .stat-card {
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