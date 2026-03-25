<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Units</h1>
        <p class="page-subtitle">Manage product units for your current shop.</p>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>POS</span>
          <span>/</span>
          <span class="active">Units</span>
        </div>
      </div>

      <button class="add-btn" @click="openAddModal">
        <span>+</span>
        Add Unit
      </button>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Units</div>
        <div class="stat-value">{{ filteredUnits.length }}</div>
        <div class="stat-note">Units shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Active Units</div>
        <div class="stat-value">{{ activeCount }}</div>
        <div class="stat-note">Units currently active</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Inactive Units</div>
        <div class="stat-value">{{ inactiveCount }}</div>
        <div class="stat-note">Units currently inactive</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search unit name or description..."
          />
        </div>

        <select v-model="statusFilter" class="filter-select">
          <option value="">All status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button class="reset-btn" @click="resetFilters">Reset</button>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Unit List</h2>
          <p>{{ filteredUnits.length }} unit(s) found</p>
        </div>
      </div>

      <div class="table-wrap" v-if="filteredUnits.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unit</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="unit in filteredUnits" :key="unit.id">
              <td>
                <div class="ref-cell">
                  <div class="ref-main">UN{{ String(unit.id).padStart(10, '0') }}</div>
                  <div class="ref-sub">Unit</div>
                </div>
              </td>

              <td>
                <div class="title-main">{{ unit.name }}</div>
              </td>

              <td>{{ unit.description || '-' }}</td>
              <td>{{ formatDate(unit.createdAt) }}</td>

              <td>
                <span
                  class="status-badge"
                  :class="unit.status === 'Active' ? 'paid' : 'cancelled'"
                >
                  {{ unit.status }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openEditModal(unit)">View</button>
                  <button class="btn-edit" @click="openEditModal(unit)">Edit</button>
                  <button class="btn-delete" @click="deleteUnit(unit.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>No units found</h3>
        <p>Try another keyword or create a new unit.</p>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit Unit' : 'Add Unit' }}</h2>
            <p>Fill in the form below to save unit data.</p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Unit Name</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="Enter unit name" />
            </div>

            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status" class="form-input">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div class="form-group form-group-full">
              <label>Description</label>
              <textarea
                v-model="form.description"
                class="form-input textarea"
                rows="4"
                placeholder="Write description here..."
              ></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="closeModal">Cancel</button>
            <button class="save-btn" @click="saveUnit">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

type Unit = {
  id: number
  name: string
  description: string
  createdAt: string
  status: 'Active' | 'Inactive'
}

const units = ref<Unit[]>([
  {
    id: 3,
    name: 'PCS',
    description: 'Piece unit for general product items.',
    createdAt: '2026-03-20T10:00:00',
    status: 'Active',
  },
  {
    id: 2,
    name: 'BOX',
    description: 'Box packaging unit.',
    createdAt: '2026-03-18T09:20:00',
    status: 'Active',
  },
  {
    id: 1,
    name: 'KG',
    description: 'Weight unit in kilogram.',
    createdAt: '2026-03-15T08:10:00',
    status: 'Inactive',
  },
])

const search = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  description: '',
  status: 'Active' as 'Active' | 'Inactive',
})

const filteredUnits = computed(() => {
  let results = [...units.value]

  const keyword = search.value.trim().toLowerCase()
  if (keyword) {
    results = results.filter((item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter.value) {
    results = results.filter((item) => item.status === statusFilter.value)
  }

  return results.sort((a, b) => b.id - a.id)
})

const activeCount = computed(() => filteredUnits.value.filter((i) => i.status === 'Active').length)
const inactiveCount = computed(() => filteredUnits.value.filter((i) => i.status === 'Inactive').length)

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.status = 'Active'
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(unit: Unit) {
  form.name = unit.name
  form.description = unit.description
  form.status = unit.status
  isEditMode.value = true
  editingId.value = unit.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function validateForm() {
  if (!form.name.trim()) {
    alert('Unit name is required.')
    return false
  }
  return true
}

function getNextId() {
  return units.value.length > 0 ? Math.max(...units.value.map((item) => item.id)) + 1 : 1
}

function saveUnit() {
  if (!validateForm()) return

  if (isEditMode.value && editingId.value !== null) {
    const index = units.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      units.value[index] = {
        ...units.value[index],
        name: form.name.trim().toUpperCase(),
        description: form.description.trim(),
        status: form.status,
      }
    }
  } else {
    units.value.unshift({
      id: getNextId(),
      name: form.name.trim().toUpperCase(),
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
      status: form.status,
    })
  }

  closeModal()
  resetForm()
}

function deleteUnit(id: number) {
  if (!window.confirm('Delete this unit?')) return
  units.value = units.value.filter((item) => item.id !== id)
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
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
  grid-template-columns: 1.8fr 0.9fr auto;
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
  min-width: 980px;
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
  .toolbar-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .dashboard-page {
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