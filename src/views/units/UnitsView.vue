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
        <div class="stat-label">Total Units</div>
        <div class="stat-value">{{ units.length }}</div>
        <div class="stat-note">All units from API</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Search Result</div>
        <div class="stat-value">{{ filteredUnits.length }}</div>
        <div class="stat-note">Filtered by current keyword</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search unit..."
          />
        </div>

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

      <div v-if="loading" class="empty-state">
        <h3>Loading units...</h3>
        <p>Please wait a moment.</p>
      </div>

      <div v-else-if="errorMessage" class="empty-state">
        <h3>Failed to load units</h3>
        <p>{{ errorMessage }}</p>
      </div>

      <div class="table-wrap" v-else-if="filteredUnits.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unit</th>
              <th>Display</th>
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

              <td>
                <div class="unit-avatar">
                  {{ getInitial(unit.name) }}
                </div>
              </td>

              <td>
                <span class="status-badge paid">Ready</span>
              </td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openEditModal(unit)">View</button>
                  <button class="btn-edit" @click="openEditModal(unit)">Edit</button>
                  <button
                    class="btn-delete"
                    :disabled="deletingId === unit.id"
                    @click="deleteUnit(unit.id)"
                  >
                    {{ deletingId === unit.id ? 'Deleting...' : 'Delete' }}
                  </button>
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
            <div class="form-group form-group-full">
              <label>Unit Name</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="Enter unit name"
              />
              <small v-if="formError" class="error-text">{{ formError }}</small>
            </div>
          </div>

          <div class="preview-box">
            <div class="preview-label">Preview</div>
            <div class="preview-avatar">
              {{ getInitial(form.name || 'U') }}
            </div>
            <div class="preview-name">{{ form.name || 'Unit Name' }}</div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="closeModal">Cancel</button>
            <button class="save-btn" :disabled="saving" @click="saveUnit">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

type Unit = {
  id: number
  name: string
}

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

const units = ref<Unit[]>([])
const search = ref('')
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
})

const filteredUnits = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  let results = [...units.value]

  if (keyword) {
    results = results.filter((item) =>
      item.name.toLowerCase().includes(keyword)
    )
  }

  return results.sort((a, b) => b.id - a.id)
})

function resetFilters() {
  search.value = ''
}

function resetForm() {
  form.name = ''
  formError.value = ''
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(unit: Unit) {
  resetForm()
  form.name = unit.name
  isEditMode.value = true
  editingId.value = unit.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formError.value = ''
}

function validateForm() {
  formError.value = ''

  if (!form.name.trim()) {
    formError.value = 'Unit name is required.'
    return false
  }

  return true
}

async function fetchUnits() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/api/units/')
    units.value = Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Unable to fetch units.'
  } finally {
    loading.value = false
  }
}

async function saveUnit() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    const payload = {
      name: form.name.trim().toUpperCase(),
    }

    if (isEditMode.value && editingId.value !== null) {
      await api.patch(`/api/units/${editingId.value}/`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } else {
      await api.post('/api/units/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    await fetchUnits()
    closeModal()
    resetForm()
  } catch (error: any) {
    const data = error?.response?.data
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      if (firstKey) {
        const firstValue = data[firstKey]
        formError.value = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
      } else {
        formError.value = 'Failed to save unit.'
      }
    } else {
      formError.value = error?.message || 'Failed to save unit.'
    }
  } finally {
    saving.value = false
  }
}

async function deleteUnit(id: number) {
  if (!window.confirm('Delete this unit?')) return

  deletingId.value = id

  try {
    await api.delete(`/api/units/${id}/`)
    units.value = units.value.filter((item) => item.id !== id)
  } catch (error: any) {
    alert(
      error?.response?.data?.detail ||
        error?.message ||
        'Failed to delete unit.'
    )
  } finally {
    deletingId.value = null
  }
}

function getInitial(value: string) {
  return value?.trim()?.charAt(0)?.toUpperCase() || 'U'
}

onMounted(() => {
  fetchUnits()
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
  grid-template-columns: 1.8fr auto;
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
  min-width: 900px;
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
.unit-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-weight: 800;
  font-size: 1rem;
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
  width: min(620px, 100%);
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
  grid-template-columns: 1fr;
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
.preview-box {
  margin-top: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.preview-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 700;
}
.preview-avatar {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  color: #2563eb;
  font-size: 1.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
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
.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.error-text {
  color: #dc2626;
  font-size: 0.88rem;
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
  .modal-actions {
    flex-direction: column;
  }
  .secondary-btn,
  .save-btn {
    width: 100%;
  }
}
</style>