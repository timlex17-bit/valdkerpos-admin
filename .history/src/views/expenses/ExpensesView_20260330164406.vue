<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Expenses</h1>
        <p class="page-subtitle">Manage shop expenses for your current shop.</p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>POS</span>
          <span>/</span>
          <span class="active">Expenses</span>
        </div>
      </div>

      <button class="add-btn" @click="openAddModal">
        <span>+</span>
        Add Expense
      </button>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Expenses</div>
        <div class="stat-value">{{ filteredExpenses.length }}</div>
        <div class="stat-note">Expenses shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Amount</div>
        <div class="stat-value">${{ totalAmount.toFixed(2) }}</div>
        <div class="stat-note">Total from visible expenses</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">This Month</div>
        <div class="stat-value">{{ currentMonthCount }}</div>
        <div class="stat-note">Expenses created this month</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid toolbar-grid-3">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by name or note..."
          />
        </div>

        <input v-model="dateFilter" type="date" class="filter-select" />

        <button class="reset-btn" @click="resetFilters">Reset</button>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Expense List</h2>
          <p>{{ filteredExpenses.length }} expense(s) found</p>
        </div>
      </div>

      <div v-if="loading" class="empty-state">
        <h3>Loading expenses...</h3>
        <p>Please wait a moment.</p>
      </div>

      <div v-else-if="errorMessage" class="empty-state">
        <h3>Failed to load expenses</h3>
        <p>{{ errorMessage }}</p>
      </div>

      <div class="table-wrap" v-else-if="filteredExpenses.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Note</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="expense in filteredExpenses" :key="expense.id">
              <td>
                <div class="ref-cell">
                  <div class="ref-main">EX{{ String(expense.id).padStart(10, '0') }}</div>
                  <div class="ref-sub">Expense</div>
                </div>
              </td>

              <td>
                <div class="title-main">{{ expense.name }}</div>
              </td>

              <td>
                <div class="note-text">
                  {{ expense.note || '-' }}
                </div>
              </td>

              <td>
                <span class="amount-text">${{ Number(expense.amount).toFixed(2) }}</span>
              </td>

              <td>{{ formatDate(expense.date) }}</td>
              <td>{{ formatTime(expense.time) }}</td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openEditModal(expense)">View</button>
                  <button class="btn-edit" @click="openEditModal(expense)">Edit</button>
                  <button
                    class="btn-delete"
                    :disabled="deletingId === expense.id"
                    @click="deleteExpense(expense.id)"
                  >
                    {{ deletingId === expense.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>No expenses found</h3>
        <p>Try another keyword or create a new expense.</p>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-card-wide">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit Expense' : 'Add Expense' }}</h2>
            <p>Fill in the form below to save expense data.</p>
          </div>

          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-layout">
            <div class="form-panel">
              <div class="form-grid two-col">
                <div class="form-group">
                  <label>Name</label>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-input"
                    placeholder="Enter expense name"
                    :disabled="saving"
                  />
                </div>

                <div class="form-group">
                  <label>Amount</label>
                  <input
                    v-model="form.amount"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                    :disabled="saving"
                  />
                </div>

                <div class="form-group">
                  <label>Date</label>
                  <input
                    v-model="form.date"
                    type="date"
                    class="form-input"
                    :disabled="saving"
                  />
                </div>

                <div class="form-group">
                  <label>Time</label>
                  <input
                    v-model="form.time"
                    type="time"
                    step="1"
                    class="form-input"
                    :disabled="saving"
                  />
                </div>

                <div class="form-group form-group-full">
                  <label>Note</label>
                  <textarea
                    v-model="form.note"
                    class="form-input textarea"
                    rows="5"
                    placeholder="Write note here..."
                    :disabled="saving"
                  ></textarea>
                </div>
              </div>

              <div v-if="formError" class="form-error">
                {{ formError }}
              </div>
            </div>

            <div class="side-actions">
              <button class="save-btn" :disabled="saving" @click="saveExpense">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button class="info-btn" :disabled="saving" @click="saveAndAddAnother">
                Save and add another
              </button>
              <button class="info-btn" :disabled="saving" @click="saveAndContinueEditing">
                Save and continue editing
              </button>
              <button class="secondary-btn full-width" :disabled="saving" @click="closeModal">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type Expense = {
  id: number
  name: string
  note: string
  amount: string
  date: string
  time: string
}

const expenses = ref<Expense[]>([])
const search = ref('')
const dateFilter = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const formError = ref('')

const form = reactive({
  name: '',
  note: '',
  amount: '0.00',
  date: '',
  time: '',
})

const filteredExpenses = computed(() => {
  let results = [...expenses.value]
  const keyword = search.value.trim().toLowerCase()

  if (keyword) {
    results = results.filter((item) =>
      (item.name || '').toLowerCase().includes(keyword) ||
      (item.note || '').toLowerCase().includes(keyword)
    )
  }

  if (dateFilter.value) {
    results = results.filter((item) => item.date === dateFilter.value)
  }

  return results.sort((a, b) => b.id - a.id)
})

const totalAmount = computed(() =>
  filteredExpenses.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
)

const currentMonthCount = computed(() => {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return expenses.value.filter((item) => (item.date || '').startsWith(ym)).length
})

function extractRows(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function normalizeExpense(raw: any): Expense {
  return {
    id: Number(raw?.id ?? 0),
    name: raw?.name ?? '',
    note: raw?.note ?? '',
    amount: String(raw?.amount ?? '0.00'),
    date: raw?.date ?? '',
    time: raw?.time ?? '',
  }
}

function resetFilters() {
  search.value = ''
  dateFilter.value = ''
}

function getNowDate() {
  return new Date().toISOString().slice(0, 10)
}

function getNowTime() {
  return new Date().toTimeString().slice(0, 8)
}

function resetForm() {
  form.name = ''
  form.note = ''
  form.amount = '0.00'
  form.date = getNowDate()
  form.time = getNowTime()
  formError.value = ''
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(expense: Expense) {
  form.name = expense.name || ''
  form.note = expense.note || ''
  form.amount = String(expense.amount || '0.00')
  form.date = expense.date || getNowDate()
  form.time = normalizeTime(expense.time || getNowTime())

  isEditMode.value = true
  editingId.value = expense.id
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formError.value = ''
}

function normalizeTime(value: string) {
  if (!value) return getNowTime()
  return value.length === 5 ? `${value}:00` : value
}

function validateForm() {
  formError.value = ''

  if (!form.name.trim()) {
    formError.value = 'Name is required.'
    return false
  }

  if (Number(form.amount) <= 0) {
    formError.value = 'Amount must be greater than 0.'
    return false
  }

  if (!form.date) {
    formError.value = 'Date is required.'
    return false
  }

  if (!form.time) {
    formError.value = 'Time is required.'
    return false
  }

  return true
}

function buildPayload() {
  return {
    name: form.name.trim(),
    note: form.note.trim(),
    amount: Number(form.amount).toFixed(2),
    date: form.date,
    time: normalizeTime(form.time),
  }
}

function getErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data

  if (typeof data === 'string') return data
  if (data?.detail) return String(data.detail)
  if (data?.message) return String(data.message)
  if (data?.error) return String(data.error)

  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0]
    const firstValue = data[firstKey]

    if (Array.isArray(firstValue) && firstValue.length) {
      return String(firstValue[0])
    }

    if (typeof firstValue === 'string') {
      return firstValue
    }
  }

  return error?.message || fallback
}

async function fetchExpenses() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(ENDPOINTS.EXPENSES)
    const rows = extractRows(response.data)
    expenses.value = rows.map(normalizeExpense)
  } catch (error: any) {
    console.error('Failed to fetch expenses:', error)
    errorMessage.value = getErrorMessage(error, 'Failed to load expenses.')
    expenses.value = []
  } finally {
    loading.value = false
  }
}

async function saveExpense() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()

    if (isEditMode.value && editingId.value !== null) {
      await api.patch(`${ENDPOINTS.EXPENSES}${editingId.value}/`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      await api.post(ENDPOINTS.EXPENSES, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await fetchExpenses()
    closeModal()
    resetForm()
  } catch (error: any) {
    formError.value = getErrorMessage(error, 'Failed to save expense.')
  } finally {
    saving.value = false
  }
}

async function saveAndAddAnother() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()

    await api.post(ENDPOINTS.EXPENSES, payload, {
      headers: { 'Content-Type': 'application/json' },
    })

    await fetchExpenses()
    resetForm()
  } catch (error: any) {
    formError.value = getErrorMessage(error, 'Failed to save expense.')
  } finally {
    saving.value = false
  }
}

async function saveAndContinueEditing() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()

    if (isEditMode.value && editingId.value !== null) {
      await api.patch(`${ENDPOINTS.EXPENSES}${editingId.value}/`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      const response = await api.post(ENDPOINTS.EXPENSES, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
      editingId.value = response?.data?.id ?? null
      isEditMode.value = true
    }

    await fetchExpenses()
  } catch (error: any) {
    formError.value = getErrorMessage(error, 'Failed to save expense.')
  } finally {
    saving.value = false
  }
}

async function deleteExpense(id: number) {
  if (!window.confirm('Delete this expense?')) return

  deletingId.value = id

  try {
    await api.delete(`${ENDPOINTS.EXPENSES}${id}/`)
    expenses.value = expenses.value.filter((item) => item.id !== id)
  } catch (error: any) {
    alert(getErrorMessage(error, 'Failed to delete expense.'))
  } finally {
    deletingId.value = null
  }
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatTime(value: string) {
  if (!value) return '-'
  const parts = value.split(':')
  const hour = Number(parts[0] || 0)
  const minute = Number(parts[1] || 0)
  const second = Number(parts[2] || 0)

  const date = new Date()
  date.setHours(hour, minute, second)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

onMounted(() => {
  fetchExpenses()
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
  color: #2563eb;
  font-weight: 700;
}

.add-btn {
  border: none;
  background: #22c55e;
  color: white;
  padding: 14px 22px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.18);
}

.add-btn span {
  font-size: 1.3rem;
  line-height: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.stat-card {
  background: #fff;
  border-radius: 22px;
  padding: 20px 22px;
  border: 1px solid #edf0f5;
}

.stat-label {
  font-size: 0.98rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2a44;
  margin-bottom: 6px;
}

.stat-note {
  color: #94a3b8;
  font-size: 0.95rem;
}

.toolbar-card {
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 22px;
  border: 1px solid #edf0f5;
}

.toolbar-grid {
  display: grid;
  gap: 14px;
  align-items: center;
}

.toolbar-grid-3 {
  grid-template-columns: 1.8fr 1fr auto;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0 14px;
}

.search-icon {
  color: #94a3b8;
  font-size: 14px;
}

.search-box input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 0.96rem;
  color: #334155;
}

.filter-select {
  height: 48px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0 14px;
  font-size: 0.96rem;
  color: #334155;
  outline: none;
}

.reset-btn {
  height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  background: #eef2f7;
  color: #334155;
  font-weight: 700;
  cursor: pointer;
}

.table-card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid #edf0f5;
  overflow: hidden;
}

.table-header {
  padding: 20px 20px 8px;
}

.table-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2a44;
}

.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.table-wrap {
  overflow-x: auto;
  padding: 8px 18px 18px;
}

.data-table {
  width: 100%;
  min-width: 1000px;
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

.ref-sub {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 4px;
}

.title-main {
  font-weight: 700;
  color: #1f2937;
}

.note-text {
  color: #64748b;
  line-height: 1.5;
}

.amount-text {
  font-weight: 800;
  color: #16a34a;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-view,
.btn-edit,
.btn-delete {
  height: 38px;
  padding: 0 14px;
  border-radius: 14px;
  background: white;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.92rem;
}

.btn-view {
  border: 1px solid #bfdbfe;
  color: #2563eb;
}

.btn-edit {
  border: 1px solid #fdba74;
  color: #ea580c;
}

.btn-delete {
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.btn-delete:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #1f2937;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal-card {
  width: min(760px, 100%);
  background: white;
  border-radius: 22px;
  overflow: hidden;
}

.modal-card-wide {
  width: min(1100px, 100%);
}

.modal-header {
  padding: 20px 22px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf2f7;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.close-btn {
  border: none;
  background: #f1f5f9;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.4rem;
}

.modal-body {
  padding: 22px;
}

.modal-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}

.form-panel {
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 20px;
  padding: 20px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.two-col {
  grid-template-columns: 1fr 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 700;
  color: #334155;
  font-size: 0.95rem;
}

.form-input {
  min-height: 46px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 10px 14px;
  outline: none;
  font-size: 0.96rem;
  color: #334155;
  box-sizing: border-box;
}

.textarea {
  min-height: 140px;
  resize: vertical;
}

.side-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.secondary-btn,
.save-btn,
.info-btn {
  height: 46px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.secondary-btn {
  background: #eef2f7;
  color: #334155;
}

.save-btn {
  background: #22c55e;
  color: white;
}

.info-btn {
  background: #0ea5b7;
  color: white;
}

.full-width {
  width: 100%;
}

@media (max-width: 1100px) {
  .toolbar-grid-3,
  .stats-grid,
  .two-col,
  .modal-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .page-title {
    font-size: 32px;
    line-height: 1.15;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>