<template>
  <div class="page">
    <section class="page-header">
      <div class="page-header__left">
        <div>
          <h1 class="page-title">Suppliers</h1>
          <p class="page-subtitle">Kelola data supplier dengan tampilan yang rapi, jelas, dan konsisten.</p>
        </div>
      </div>

      <div class="page-header__right">
        <button class="btn btn-refresh" @click="fetchSuppliers" :disabled="loading">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          + Add Supplier
        </button>
      </div>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Suppliers</div>
        <div class="stat-value">{{ suppliers.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">With Contact Person</div>
        <div class="stat-value">{{ suppliersWithContact }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">First Visible Supplier</div>
        <div class="stat-value stat-value--small">{{ firstSupplierName }}</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input
          v-model="search"
          type="text"
          class="search-input"
          placeholder="Search supplier name, contact person, phone, email..."
        />
      </div>
      <div class="toolbar-right">
        <button class="btn btn-light" @click="resetFilters">Reset</button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Supplier List</h2>
          <p>{{ filteredSuppliers.length }} supplier(s) found</p>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="empty-cell">Loading suppliers...</td>
            </tr>

            <tr v-else-if="filteredSuppliers.length === 0">
              <td colspan="6" class="empty-cell">No suppliers found.</td>
            </tr>

            <tr v-for="supplier in filteredSuppliers" :key="supplier.id">
              <td>
                <div class="entity-cell">
                  <div class="avatar">{{ getInitials(supplier.name) }}</div>
                  <div>
                    <div class="entity-name">{{ supplier.name || '-' }}</div>
                    <div class="entity-meta">ID #{{ supplier.id }}</div>
                  </div>
                </div>
              </td>
              <td>{{ supplier.contact_person || '-' }}</td>
              <td>{{ supplier.cell || '-' }}</td>
              <td>{{ supplier.email || '-' }}</td>
              <td class="wrap-text">{{ supplier.address || '-' }}</td>
              <td class="text-right">
                <div class="actions">
                  <button class="btn-action view" @click="openViewModal(supplier)">View</button>
                  <button class="btn-action edit" @click="openEditModal(supplier)">Edit</button>
                  <button
                    class="btn-action delete"
                    @click="removeSupplier(supplier.id)"
                    :disabled="deletingId === supplier.id"
                  >
                    {{ deletingId === supplier.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>
              {{
                modalMode === 'create'
                  ? 'Add Supplier'
                  : modalMode === 'edit'
                  ? 'Edit Supplier'
                  : 'Supplier Detail'
              }}
            </h3>
            <p>Lengkapi informasi supplier di bawah ini.</p>
          </div>
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">
            {{ formError }}
          </div>

          <div class="form-grid">
            <div class="form-group full">
              <label>Name <span>*</span></label>
              <input
                v-model="form.name"
                class="form-input"
                type="text"
                :disabled="modalMode === 'view'"
                placeholder="Supplier name"
              />
            </div>

            <div class="form-group">
              <label>Contact Person</label>
              <input
                v-model="form.contact_person"
                class="form-input"
                type="text"
                :disabled="modalMode === 'view'"
                placeholder="Contact person"
              />
            </div>

            <div class="form-group">
              <label>Phone</label>
              <input
                v-model="form.cell"
                class="form-input"
                type="text"
                :disabled="modalMode === 'view'"
                placeholder="Phone number"
              />
            </div>

            <div class="form-group full">
              <label>Email</label>
              <input
                v-model="form.email"
                class="form-input"
                type="email"
                :disabled="modalMode === 'view'"
                placeholder="Email address"
              />
            </div>

            <div class="form-group full">
              <label>Address</label>
              <textarea
                v-model="form.address"
                class="form-textarea"
                rows="4"
                :disabled="modalMode === 'view'"
                placeholder="Address"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-light" @click="closeModal">Close</button>
          <button
            v-if="modalMode !== 'view'"
            class="btn btn-primary"
            @click="saveSupplier"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios, { AxiosError } from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

type Supplier = {
  id: number
  name: string
  contact_person: string
  cell: string
  email: string
  address: string
}

type ModalMode = 'create' | 'edit' | 'view'

function normalizeBaseUrl(url?: string) {
  return (url || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('auth_token') ||
    ''
  )
}

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()

  config.headers = config.headers || {}

  if (token) {
    config.headers.Authorization = `Token ${token}`
  }

  if (!config.url?.startsWith('/')) {
    config.url = `/${config.url || ''}`
  }

  return config
})

function extractList(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function getApiError(error: unknown, fallback: string) {
  const err = error as AxiosError<any>
  const status = err?.response?.status
  const data = err?.response?.data

  if (status === 401) return 'Unauthorized. Token login tidak valid atau sudah expired.'
  if (status === 403) return 'Forbidden. Anda tidak punya akses ke data ini.'
  if (typeof data?.detail === 'string') return data.detail
  if (typeof data?.message === 'string') return data.message
  if (typeof err?.message === 'string') return err.message

  return fallback
}

const search = ref('')
const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)

const suppliers = ref<Supplier[]>([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const formError = ref('')

const form = reactive<Supplier>({
  id: 0,
  name: '',
  contact_person: '',
  cell: '',
  email: '',
  address: '',
})

const filteredSuppliers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return suppliers.value

  return suppliers.value.filter((supplier) => {
    return (
      (supplier.name || '').toLowerCase().includes(q) ||
      (supplier.contact_person || '').toLowerCase().includes(q) ||
      (supplier.cell || '').toLowerCase().includes(q) ||
      (supplier.email || '').toLowerCase().includes(q) ||
      (supplier.address || '').toLowerCase().includes(q)
    )
  })
})

const suppliersWithContact = computed(() => {
  return suppliers.value.filter((s) => (s.contact_person || '').trim().length > 0).length
})

const firstSupplierName = computed(() => {
  return filteredSuppliers.value[0]?.name || '-'
})

function resetForm() {
  form.id = 0
  form.name = ''
  form.contact_person = ''
  form.cell = ''
  form.email = ''
  form.address = ''
  formError.value = ''
}

function fillForm(supplier: Supplier) {
  form.id = supplier.id
  form.name = supplier.name || ''
  form.contact_person = supplier.contact_person || ''
  form.cell = supplier.cell || ''
  form.email = supplier.email || ''
  form.address = supplier.address || ''
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(supplier: Supplier) {
  modalMode.value = 'edit'
  editingId.value = supplier.id
  fillForm(supplier)
  showModal.value = true
}

function openViewModal(supplier: Supplier) {
  modalMode.value = 'view'
  editingId.value = supplier.id
  fillForm(supplier)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  resetForm()
}

function resetFilters() {
  search.value = ''
}

function getInitials(name: string) {
  const safe = String(name || '').trim()
  return (
    safe
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SP'
  )
}

function validateForm() {
  formError.value = ''

  if (!form.name.trim()) {
    formError.value = 'Supplier name is required.'
    return false
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    formError.value = 'Email format is invalid.'
    return false
  }

  return true
}

function buildPayload() {
  return {
    name: form.name.trim(),
    contact_person: form.contact_person.trim(),
    cell: form.cell.trim(),
    email: form.email.trim() || null,
    address: form.address.trim(),
  }
}

async function fetchSuppliers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/api/suppliers/')
    suppliers.value = extractList(response.data)
  } catch (error) {
    errorMessage.value = getApiError(error, 'Failed to load suppliers.')
    suppliers.value = []
  } finally {
    loading.value = false
  }
}

async function saveSupplier() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()

    if (modalMode.value === 'create') {
      await api.post('/api/suppliers/', payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } else if (modalMode.value === 'edit' && editingId.value !== null) {
      await api.patch(`/api/suppliers/${editingId.value}/`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await fetchSuppliers()
    closeModal()
  } catch (error: any) {
    const data = error?.response?.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const firstKey = Object.keys(data)[0]
      if (firstKey) {
        const firstValue = data[firstKey]
        formError.value = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
      } else {
        formError.value = getApiError(error, 'Failed to save supplier.')
      }
    } else {
      formError.value = getApiError(error, 'Failed to save supplier.')
    }
  } finally {
    saving.value = false
  }
}

async function removeSupplier(id: number) {
  const ok = window.confirm('Delete this supplier?')
  if (!ok) return

  deletingId.value = id

  try {
    await api.delete(`/api/suppliers/${id}/`)
    suppliers.value = suppliers.value.filter((s) => s.id !== id)
  } catch (error) {
    window.alert(getApiError(error, 'Failed to delete supplier.'))
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchSuppliers()
})
</script>

<style scoped>
.page {
  padding: 24px;
  background: #f6f8fb;
  min-height: 100%;
  color: #0f172a;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 32px;
  line-height: 1.1;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.page-header__right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.stat-card {
  padding: 18px 20px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.stat-value--small {
  font-size: 20px;
}

.toolbar-card {
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  flex: 1;
  min-width: 260px;
}

.search-input,
.form-input,
.form-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  transition: 0.2s ease;
}

.search-input:focus,
.form-input:focus,
.form-textarea:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.form-textarea {
  resize: vertical;
  min-height: 110px;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary {
  background: #22c55e;
  color: #fff;
}

.btn-primary:hover {
  background: #16a34a;
}

.btn-refresh,
.btn-light {
  background: #eef2f7;
  color: #0f172a;
}

.btn-refresh:hover,
.btn-light:hover {
  background: #e2e8f0;
}

.alert {
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 14px;
}

.alert-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.table-card {
  overflow: hidden;
}

.table-header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.table-header h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.table-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
}

.data-table thead th {
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
  text-align: left;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 800;
}

.data-table tbody td {
  padding: 16px;
  border-bottom: 1px solid #eef2f7;
  color: #0f172a;
  vertical-align: middle;
  font-size: 14px;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.empty-cell {
  text-align: center;
  color: #64748b !important;
  padding: 32px !important;
}

.entity-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.entity-name {
  font-weight: 700;
  color: #0f172a;
}

.entity-meta {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.wrap-text {
  white-space: normal;
  word-break: break-word;
}

.text-right {
  text-align: right;
}

.actions {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-action {
  border: none;
  border-radius: 10px;
  padding: 8px 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-action.view {
  background: #eff6ff;
  color: #1d4ed8;
}

.btn-action.edit {
  background: #ecfdf3;
  color: #15803d;
}

.btn-action.delete {
  background: #fef2f2;
  color: #b91c1c;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal-card {
  width: 100%;
  max-width: 760px;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.modal-header {
  padding: 20px 22px 14px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.modal-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.modal-close {
  border: none;
  background: #f1f5f9;
  color: #0f172a;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
}

.modal-body {
  padding: 20px 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.form-group label span {
  color: #dc2626;
}

.modal-footer {
  padding: 16px 22px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 16px;
  }

  .page-title {
    font-size: 26px;
  }

  .page-header__right {
    width: 100%;
  }

  .page-header__right .btn {
    flex: 1;
  }

  .toolbar-card {
    flex-direction: column;
  }
}
</style>