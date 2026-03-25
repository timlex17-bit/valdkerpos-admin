<template>
  <div class="inventory-counts-page">
    <!-- Page header -->
    <section class="page-header">
      <div>
        <h1 class="page-title">Inventory Counts</h1>
        <p class="page-subtitle">Manage inventory count sessions for your current shop.</p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Inventory</span>
          <span>/</span>
          <span class="active">Inventory Counts</span>
        </div>
      </div>

      <button class="add-btn" @click="openAddModal">
        <span>+</span>
        Add Inventory Count
      </button>
    </section>

    <!-- Summary cards -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Counts</div>
        <div class="stat-value">{{ filteredItems.length }}</div>
        <div class="stat-note">Counts shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Completed Counts</div>
        <div class="stat-value">{{ completedCount }}</div>
        <div class="stat-note">Counts marked as completed</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Draft Counts</div>
        <div class="stat-value">{{ draftCount }}</div>
        <div class="stat-note">Counts still in draft status</div>
      </div>
    </section>

    <!-- Toolbar -->
    <section class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by title, counted by, note..."
            @keyup.enter="applyFilters"
          />
        </div>

        <input v-model="countDateFilter" type="date" class="filter-input" />

        <select v-model="statusFilter" class="filter-select">
          <option value="">All status</option>
          <option value="Draft">Draft</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button class="reset-btn" @click="resetFilters">Reset</button>
      </div>
    </section>

    <!-- Table -->
    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Inventory Count List</h2>
          <p>{{ filteredItems.length }} count(s) found</p>
        </div>
      </div>

      <div class="table-wrap" v-if="filteredItems.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Status</th>
              <th>Counted By</th>
              <th>Counted At</th>
              <th>Note</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>
                <div class="ref-cell">
                  <div class="ref-main">IC{{ String(item.id).padStart(10, '0') }}</div>
                  <div class="ref-sub">Stock count</div>
                </div>
              </td>

              <td>
                <div class="title-cell">
                  <div class="title-main">{{ item.title }}</div>
                </div>
              </td>

              <td>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>

              <td>{{ item.countedBy }}</td>
              <td>{{ formatDateTime(item.countedAt) }}</td>
              <td>{{ item.note || '-' }}</td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openEditModal(item)">View</button>
                  <button class="btn-edit" @click="openEditModal(item)">Edit</button>
                  <button class="btn-delete" @click="deleteItem(item.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>No inventory counts found</h3>
        <p>Try another keyword or create a new inventory count.</p>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit Inventory Count' : 'Add Inventory Count' }}</h2>
            <p>Fill in the form below to save inventory count data.</p>
          </div>

          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Title</label>
              <input v-model="form.title" type="text" class="form-input" placeholder="Enter title" />
            </div>

            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status" class="form-input">
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div class="form-group">
              <label>Counted By</label>
              <input v-model="form.countedBy" type="text" class="form-input" placeholder="Enter counted by" />
            </div>

            <div class="form-group">
              <label>Date</label>
              <input v-model="form.date" type="date" class="form-input" />
            </div>

            <div class="form-group">
              <label>Time</label>
              <input v-model="form.time" type="time" class="form-input" />
            </div>

            <div class="form-group form-group-full">
              <label>Note</label>
              <textarea
                v-model="form.note"
                class="form-input textarea"
                rows="4"
                placeholder="Write note here..."
              ></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="closeModal">Cancel</button>
            <button class="save-btn" @click="saveItem">Save</button>
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
    id: 4,
    title: 'Warehouse Opening Count',
    note: 'Initial morning stock count.',
    countedAt: '2026-03-23T08:45',
    countedBy: 'Rivaldo',
    status: 'Completed',
  },
  {
    id: 3,
    title: 'Weekend Beverage Count',
    note: 'Recheck beverage stock before weekend sales.',
    countedAt: '2026-03-22T14:30',
    countedBy: 'Admin',
    status: 'Draft',
  },
  {
    id: 2,
    title: 'Snack Shelf Count',
    note: 'Shelf adjustment verification.',
    countedAt: '2026-03-21T11:10',
    countedBy: 'Jeffri',
    status: 'Completed',
  },
  {
    id: 1,
    title: 'Damaged Item Audit',
    note: 'Cancelled due to incomplete item list.',
    countedAt: '2026-03-20T16:20',
    countedBy: 'Julio',
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
  countedBy: '',
  status: 'Draft' as InventoryCountStatus,
})

const filteredItems = computed(() => {
  let items = [...inventoryCounts.value]

  const keyword = search.value.trim().toLowerCase()
  if (keyword) {
    items = items.filter((item) =>
      item.title.toLowerCase().includes(keyword) ||
      item.note.toLowerCase().includes(keyword) ||
      item.countedBy.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter.value) {
    items = items.filter((item) => item.status === statusFilter.value)
  }

  if (countDateFilter.value) {
    items = items.filter((item) => item.countedAt.startsWith(countDateFilter.value))
  }

  return items
})

const completedCount = computed(
  () => filteredItems.value.filter((item) => item.status === 'Completed').length
)

const draftCount = computed(
  () => filteredItems.value.filter((item) => item.status === 'Draft').length
)

function applyFilters() {
  // reactive filter
}

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  countDateFilter.value = ''
}

function getNowDate() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

function getNowTime() {
  const now = new Date()
  return now.toTimeString().slice(0, 5)
}

function resetForm() {
  form.title = ''
  form.note = ''
  form.date = getNowDate()
  form.time = getNowTime()
  form.countedBy = ''
  form.status = 'Draft'
}

function openAddModal() {
  isEditMode.value = false
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(item: InventoryCount) {
  isEditMode.value = true
  editingId.value = item.id

  const [datePart, timePart] = item.countedAt.split('T')

  form.title = item.title
  form.note = item.note
  form.date = datePart || ''
  form.time = timePart ? timePart.slice(0, 5) : ''
  form.countedBy = item.countedBy
  form.status = item.status

  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function buildDateTime() {
  return `${form.date}T${form.time}`
}

function saveItem() {
  if (!form.title.trim()) {
    alert('Title is required')
    return
  }

  if (!form.date || !form.time) {
    alert('Date and time are required')
    return
  }

  const payload: InventoryCount = {
    id: editingId.value ?? nextId(),
    title: form.title.trim(),
    note: form.note.trim(),
    countedAt: buildDateTime(),
    countedBy: form.countedBy.trim() || 'Admin',
    status: form.status,
  }

  if (isEditMode.value && editingId.value !== null) {
    const index = inventoryCounts.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) inventoryCounts.value[index] = payload
  } else {
    inventoryCounts.value.unshift(payload)
  }

  closeModal()
}

function deleteItem(id: number) {
  if (!window.confirm('Delete this inventory count?')) return
  inventoryCounts.value = inventoryCounts.value.filter((item) => item.id !== id)
}

function nextId() {
  return inventoryCounts.value.length
    ? Math.max(...inventoryCounts.value.map((item) => item.id)) + 1
    : 1
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function statusClass(status: InventoryCountStatus) {
  return {
    paid: status === 'Completed',
    unpaid: status === 'Draft',
    cancelled: status === 'Cancelled',
  }
}
</script>

<style scoped>
.inventory-counts-page {
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
  grid-template-columns: 1.8fr 0.9fr 0.9fr auto;
  gap: 14px;
  align-items: center;
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

.filter-input,
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
  min-width: 1100px;
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  height: 46px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0 14px;
  outline: none;
  font-size: 0.96rem;
  color: #334155;
  box-sizing: border-box;
}

.textarea {
  height: auto;
  min-height: 110px;
  padding: 12px 14px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.secondary-btn,
.save-btn {
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

@media (max-width: 1100px) {
  .toolbar-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .inventory-counts-page {
    padding: 16px;
  }

  .page-title {
    font-size: 2.2rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .toolbar-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .secondary-btn,
  .save-btn {
    width: 100%;
  }
}
</style>