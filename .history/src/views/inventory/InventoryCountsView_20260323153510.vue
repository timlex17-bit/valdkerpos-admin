<template>
  <div class="page">
    <!-- Header -->
    <section class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">Inventory Counts</h1>
        <div class="breadcrumb">
          <span>Dashboard</span>
          <span>/</span>
          <span>Inventory</span>
          <span>/</span>
          <span class="active">Inventory Counts</span>
        </div>
      </div>

      <button class="btn btn-primary" @click="openAddModal">+ Add Inventory Count</button>
    </section>

    <!-- Toolbar -->
    <section class="toolbar-card toolbar-card--modern">
      <div class="toolbar-modern">
        <div class="toolbar-field toolbar-field--search">
          <span class="toolbar-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>

          <input
            v-model="search"
            type="text"
            class="toolbar-input"
            placeholder="Search by title, counted by, or note..."
            @keyup.enter="applyFilters"
          />
        </div>

        <div class="toolbar-field toolbar-field--date">
          <input
            v-model="countDateFilter"
            type="date"
            class="toolbar-input toolbar-input--date"
          />
        </div>

        <div class="toolbar-field toolbar-field--select">
          <select v-model="statusFilter" class="toolbar-select">
            <option value="">All status</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button class="toolbar-reset-btn" @click="resetFilters">Reset</button>
      </div>
    </section>

    <!-- Summary -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Counts</div>
        <div class="stat-value">{{ filteredItems.length }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Draft</div>
        <div class="stat-value">{{ draftCount }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Completed</div>
        <div class="stat-value">{{ completedCount }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Cancelled</div>
        <div class="stat-value">{{ cancelledCount }}</div>
      </div>
    </section>

    <!-- Table -->
    <section class="table-card">
      <div class="table-card__top">
        <div>
          <h2>Inventory Count List</h2>
          <p>Manage stock count sessions with a cleaner and modern layout.</p>
        </div>

        <div class="table-meta">{{ filteredItems.length }} item(s)</div>
      </div>

      <div v-if="filteredItems.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th>Title</th>
              <th>Note</th>
              <th style="width: 220px">Counted At</th>
              <th style="width: 160px">Counted By</th>
              <th style="width: 150px">Status</th>
              <th style="width: 160px">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>
                <div class="title-cell">
                  <div class="title-main">{{ item.title }}</div>
                </div>
              </td>
              <td>
                <div class="note-text">
                  {{ item.note || '-' }}
                </div>
              </td>
              <td>{{ formatDateTime(item.countedAt) }}</td>
              <td>{{ item.countedBy }}</td>
              <td>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td>
                <div class="action-group">
                  <button class="icon-btn edit" @click="openEditModal(item)">Edit</button>
                  <button class="icon-btn delete" @click="deleteItem(item.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No inventory counts found</h3>
        <p>Try changing the search keyword or filters, or create a new inventory count.</p>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit Inventory Count' : 'Add Inventory Count' }}</h2>
            <p>Fill in the details below to save inventory count information.</p>
          </div>

          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-layout">
            <div class="form-card">
              <div class="form-row">
                <label>Title <span class="required">*</span></label>
                <div class="form-control">
                  <input
                    v-model="form.title"
                    type="text"
                    class="form-input"
                    placeholder="Inventory count title"
                  />
                </div>
              </div>

              <div class="form-row form-row--top">
                <label>Note</label>
                <div class="form-control">
                  <textarea
                    v-model="form.note"
                    rows="5"
                    class="form-textarea"
                    placeholder="Write note here..."
                  />
                </div>
              </div>

              <div class="form-row">
                <label>Counted by</label>
                <div class="form-control">
                  <input
                    v-model="form.countedBy"
                    type="text"
                    class="form-input"
                    placeholder="Admin / Owner"
                  />
                </div>
              </div>

              <div class="form-row">
                <label>Status <span class="required">*</span></label>
                <div class="form-control">
                  <select v-model="form.status" class="form-select">
                    <option value="Draft">Draft</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <label>Counted at <span class="required">*</span></label>
                <div class="datetime-grid">
                  <div>
                    <div class="field-label">Date</div>
                    <input v-model="form.date" type="date" class="form-input" />
                  </div>
                  <div>
                    <div class="field-label">Time</div>
                    <input v-model="form.time" type="time" class="form-input" />
                  </div>
                </div>
              </div>
            </div>

            <div class="side-actions">
              <button class="btn btn-success full-btn" @click="saveItem">Save</button>

              <button class="btn btn-info full-btn" @click="saveAndAddAnother">
                Save and add another
              </button>

              <button class="btn btn-info full-btn" @click="saveAndContinueEditing">
                Save and continue editing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

type InventoryCountStatus = 'Draft' | 'Completed' | 'Cancelled'

type InventoryCount = {
  id: number
  title: string
  note: string
  countedAt: string
  countedBy: string
  status: InventoryCountStatus
}

const inventoryCounts = ref<InventoryCount[]>([
  {
    id: 3,
    title: 'Beverage March Count',
    note: 'Monthly stock check for beverage products.',
    countedAt: '2026-03-18T10:30',
    countedBy: 'admin',
    status: 'Draft',
  },
  {
    id: 2,
    title: 'Snack Rack Verification',
    note: 'Shelf stock review before weekend promotion.',
    countedAt: '2026-03-10T17:31',
    countedBy: 'owner',
    status: 'Completed',
  },
  {
    id: 1,
    title: 'Opening Stock Verification',
    note: 'Opening stock count before store operation.',
    countedAt: '2026-03-02T12:56',
    countedBy: 'admin',
    status: 'Cancelled',
  },
])

const search = ref('')
const statusFilter = ref('')
const countDateFilter = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  title: '',
  note: '',
  date: '',
  time: '',
  countedBy: 'admin',
  status: 'Draft' as InventoryCountStatus,
})

const filteredItems = computed(() => {
  let results = [...inventoryCounts.value]

  const keyword = search.value.trim().toLowerCase()
  if (keyword) {
    results = results.filter((item) => {
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.note.toLowerCase().includes(keyword) ||
        item.countedBy.toLowerCase().includes(keyword)
      )
    })
  }

  if (statusFilter.value) {
    results = results.filter((item) => item.status === statusFilter.value)
  }

  if (countDateFilter.value) {
    results = results.filter((item) => item.countedAt.startsWith(countDateFilter.value))
  }

  return results
})

const draftCount = computed(
  () => filteredItems.value.filter((item) => item.status === 'Draft').length
)

const completedCount = computed(
  () => filteredItems.value.filter((item) => item.status === 'Completed').length
)

const cancelledCount = computed(
  () => filteredItems.value.filter((item) => item.status === 'Cancelled').length
)

function applyFilters() {
  // Filters are reactive; this keeps enter key behavior consistent.
}

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  countDateFilter.value = ''
}

function getNowDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getNowTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function resetForm() {
  form.title = ''
  form.note = ''
  form.date = getNowDate()
  form.time = getNowTime()
  form.countedBy = 'admin'
  form.status = 'Draft'
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(item: InventoryCount) {
  const [datePart, timePartRaw] = item.countedAt.split('T')
  const timePart = timePartRaw ? timePartRaw.slice(0, 5) : '00:00'

  form.title = item.title
  form.note = item.note
  form.date = datePart || getNowDate()
  form.time = timePart
  form.countedBy = item.countedBy
  form.status = item.status

  isEditMode.value = true
  editingId.value = item.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function validateForm() {
  if (!form.title.trim()) {
    alert('Title is required.')
    return false
  }

  if (!form.date) {
    alert('Date is required.')
    return false
  }

  if (!form.time) {
    alert('Time is required.')
    return false
  }

  if (!form.status) {
    alert('Status is required.')
    return false
  }

  return true
}

function buildCountedAt() {
  return `${form.date}T${form.time}`
}

function getNextId() {
  return inventoryCounts.value.length > 0
    ? Math.max(...inventoryCounts.value.map((item) => item.id)) + 1
    : 1
}

function saveItem() {
  if (!validateForm()) return

  const payload: InventoryCount = {
    id: editingId.value ?? getNextId(),
    title: form.title.trim(),
    note: form.note.trim(),
    countedAt: buildCountedAt(),
    countedBy: form.countedBy.trim() || 'admin',
    status: form.status,
  }

  if (isEditMode.value && editingId.value !== null) {
    const index = inventoryCounts.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      inventoryCounts.value[index] = payload
    }
  } else {
    inventoryCounts.value.unshift(payload)
  }

  closeModal()
  resetForm()
}

function saveAndAddAnother() {
  if (!validateForm()) return

  inventoryCounts.value.unshift({
    id: getNextId(),
    title: form.title.trim(),
    note: form.note.trim(),
    countedAt: buildCountedAt(),
    countedBy: form.countedBy.trim() || 'admin',
    status: form.status,
  })

  resetForm()
}

function saveAndContinueEditing() {
  if (!validateForm()) return

  if (isEditMode.value && editingId.value !== null) {
    const index = inventoryCounts.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      inventoryCounts.value[index] = {
        ...inventoryCounts.value[index],
        title: form.title.trim(),
        note: form.note.trim(),
        countedAt: buildCountedAt(),
        countedBy: form.countedBy.trim() || 'admin',
        status: form.status,
      }
    }
  } else {
    const nextId = getNextId()

    inventoryCounts.value.unshift({
      id: nextId,
      title: form.title.trim(),
      note: form.note.trim(),
      countedAt: buildCountedAt(),
      countedBy: form.countedBy.trim() || 'admin',
      status: form.status,
    })

    editingId.value = nextId
    isEditMode.value = true
  }
}

function deleteItem(id: number) {
  const confirmed = window.confirm('Delete this inventory count?')
  if (!confirmed) return

  inventoryCounts.value = inventoryCounts.value.filter((item) => item.id !== id)
}

function formatDateTime(value: string) {
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

function statusClass(status: InventoryCountStatus) {
  return {
    draft: status === 'Draft',
    completed: status === 'Completed',
    cancelled: status === 'Cancelled',
  }
}
</script>

<style scoped>
.page {
  min-height: 100%;
  padding: 24px;
  background: #f4f6f9;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 22px 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  padding-right: 18px;
  border-right: 1px solid #e5e7eb;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.98rem;
  color: #6b7280;
}

.breadcrumb .active,
.breadcrumb span:nth-child(1),
.breadcrumb span:nth-child(3) {
  color: #2563eb;
  font-weight: 700;
}

.toolbar-card,
.table-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  margin-bottom: 20px;
}

.toolbar-card--modern {
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
  border: 1px solid #e7ebf3;
}

.toolbar-modern {
  display: grid;
  grid-template-columns: minmax(280px, 1.8fr) minmax(180px, 0.9fr) minmax(180px, 0.9fr) auto;
  gap: 14px;
  align-items: center;
}

.toolbar-field {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 54px;
  border: 1px solid #dbe3ef;
  background: #f8fafc;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.toolbar-field:hover {
  border-color: #c9d5e7;
  background: #ffffff;
}

.toolbar-field:focus-within {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.toolbar-field--search {
  padding-left: 44px;
  padding-right: 14px;
}

.toolbar-field--date,
.toolbar-field--select {
  padding: 0 14px;
}

.toolbar-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.toolbar-icon svg {
  width: 18px;
  height: 18px;
}

.toolbar-input,
.toolbar-select {
  width: 100%;
  min-height: 52px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.96rem;
  color: #0f172a;
  font-weight: 500;
}

.toolbar-input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.toolbar-select {
  appearance: none;
  cursor: pointer;
}

.toolbar-reset-btn {
  min-height: 54px;
  padding: 0 20px;
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  background: #eef2f7;
  color: #334155;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-reset-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  border: 1px solid #e5eaf3;
  border-radius: 20px;
  padding: 18px 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 600;
}

.stat-value {
  font-size: 1.9rem;
  font-weight: 800;
  color: #111827;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #edf1f7;
  flex-wrap: wrap;
}

.table-card__top h2 {
  margin: 0;
  font-size: 1.28rem;
  color: #111827;
}

.table-card__top p {
  margin: 6px 0 0;
  color: #6b7280;
}

.table-meta {
  padding: 10px 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
  border: 1px solid #e2e8f0;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.data-table thead th {
  text-align: left;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #64748b;
  background: #f8fafc;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
  text-transform: uppercase;
}

.data-table tbody td {
  padding: 18px;
  border-bottom: 1px solid #eef2f7;
  color: #111827;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #fbfdff;
}

.title-main {
  font-weight: 700;
  color: #111827;
}

.note-text {
  color: #475569;
  line-height: 1.5;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  border: 1px solid transparent;
}

.status-badge.draft {
  background: #fff7ed;
  color: #c2410c;
  border-color: #fdba74;
}

.status-badge.completed {
  background: #ecfdf3;
  color: #15803d;
  border-color: #86efac;
}

.status-badge.cancelled {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fca5a5;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  border: none;
  border-radius: 12px;
  padding: 9px 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.icon-btn.edit {
  background: #eff6ff;
  color: #2563eb;
}

.icon-btn.edit:hover {
  background: #dbeafe;
}

.icon-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.icon-btn.delete:hover {
  background: #fee2e2;
}

.empty-state {
  padding: 50px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 2.4rem;
  margin-bottom: 12px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #111827;
  font-size: 1.2rem;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

.btn {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.22);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 22px rgba(37, 99, 235, 0.24);
}

.btn-success {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: #fff;
}

.btn-info {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: min(1100px, 100%);
  max-height: 92vh;
  overflow: auto;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid #eef2f7;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.close-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: #f3f4f6;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.modal-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 18px;
  align-items: start;
}

.form-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 18px;
  align-items: center;
  margin-bottom: 20px;
}

.form-row--top {
  align-items: start;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row label {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.form-control {
  width: 100%;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #fff;
  padding: 12px 14px;
  font-size: 0.96rem;
  color: #111827;
  outline: none;
  transition: 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.datetime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 8px;
}

.side-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.full-btn {
  width: 100%;
  min-height: 48px;
}

.required {
  color: #ef4444;
}

@media (max-width: 1100px) {
  .toolbar-modern {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar-reset-btn {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 992px) {
  .modal-layout {
    grid-template-columns: 1fr;
  }

  .side-actions {
    order: -1;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .page-title {
    font-size: 1.6rem;
    padding-right: 0;
    border-right: none;
  }

  .page-header__left {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .toolbar-card--modern {
    padding: 14px;
    border-radius: 18px;
  }

  .toolbar-modern {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .toolbar-field,
  .toolbar-reset-btn {
    min-height: 50px;
  }

  .toolbar-input,
  .toolbar-select {
    min-height: 48px;
    font-size: 0.94rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .datetime-grid {
    grid-template-columns: 1fr;
  }

  .table-card__top {
    padding: 18px 16px 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .form-card {
    padding: 18px;
  }
}
</style>