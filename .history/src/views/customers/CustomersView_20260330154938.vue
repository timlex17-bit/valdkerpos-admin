<template>
  <section class="customers-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <div>
          <h1 class="page-title">Customers</h1>
          <p class="page-subtitle">
            Manage customer data for your current shop.
          </p>
        </div>

        <nav class="breadcrumb">
          <span>Home</span>
          <span class="sep">/</span>
          <span>POS</span>
          <span class="sep">/</span>
          <span class="current">Customers</span>
        </nav>
      </div>

      <button class="btn btn-primary" @click="openCreateModal">
        <span class="btn-icon">＋</span>
        Add Customer
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Customers</div>
        <div class="stat-value">{{ filteredCustomers.length }}</div>
        <div class="stat-note">Current visible records</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Members with Points</div>
        <div class="stat-value">{{ customersWithPoints }}</div>
        <div class="stat-note">Customers with points above 0</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Top Customer</div>
        <div class="stat-value stat-truncate">{{ topCustomerName }}</div>
        <div class="stat-note">Highest points holder</div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-row">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by name, phone, email, or address..."
          />
        </div>

        <button class="btn btn-light" @click="resetFilters">
          Reset
        </button>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <div>
          <h2>Customer List</h2>
          <p>{{ filteredCustomers.length }} customer(s) found</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        Loading customers...
      </div>

      <div v-else-if="errorMessage" class="error-state">
        {{ errorMessage }}
      </div>

      <div v-else class="table-wrapper desktop-table">
        <table class="customer-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Cell</th>
              <th>Email</th>
              <th>Address</th>
              <th>Points</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="empty-cell">
                No customers found.
              </td>
            </tr>

            <tr v-for="customer in filteredCustomers" :key="customer.id">
              <td>
                <span class="id-badge">#{{ customer.id }}</span>
              </td>

              <td>
                <div class="customer-name-cell">
                  <div class="avatar">
                    {{ getInitials(customer.name) }}
                  </div>
                  <div>
                    <div class="customer-name">{{ customer.name }}</div>
                    <div class="customer-meta">
                      {{ customer.email || 'No email' }}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <span class="cell-text">
                  {{ customer.cell || '-' }}
                </span>
              </td>

              <td>
                <span class="email-text">
                  {{ customer.email || '-' }}
                </span>
              </td>

              <td class="address-cell">
                <span class="address-text">
                  {{ customer.address || '-' }}
                </span>
              </td>

              <td>
                <span class="points-badge">{{ customer.points }}</span>
              </td>

              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(customer)">
                    View
                  </button>
                  <button class="btn btn-sm btn-warning" @click="openEditModal(customer)">
                    Edit
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    :disabled="deletingId === customer.id"
                    @click="removeCustomer(customer.id)"
                  >
                    {{ deletingId === customer.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !errorMessage" class="mobile-list">
        <div
          v-if="filteredCustomers.length === 0"
          class="mobile-empty"
        >
          No customers found.
        </div>

        <div
          v-for="customer in filteredCustomers"
          :key="customer.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div class="customer-name-cell">
              <div class="avatar">
                {{ getInitials(customer.name) }}
              </div>
              <div>
                <div class="customer-name">{{ customer.name }}</div>
                <div class="customer-meta">ID #{{ customer.id }}</div>
              </div>
            </div>

            <span class="points-badge">{{ customer.points }} pts</span>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">Cell</span>
              <span class="cell-text">{{ customer.cell || '-' }}</span>
            </div>

            <div class="info-item">
              <span class="label">Email</span>
              <span class="email-text">{{ customer.email || '-' }}</span>
            </div>

            <div class="info-item full">
              <span class="label">Address</span>
              <span class="address-text">{{ customer.address || '-' }}</span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(customer)">
              View
            </button>
            <button class="btn btn-sm btn-warning" @click="openEditModal(customer)">
              Edit
            </button>
            <button
              class="btn btn-sm btn-danger"
              :disabled="deletingId === customer.id"
              @click="removeCustomer(customer.id)"
            >
              {{ deletingId === customer.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h3>
                {{
                  modalMode === 'create'
                    ? 'Add Customer'
                    : modalMode === 'edit'
                    ? 'Edit Customer'
                    : 'Customer Detail'
                }}
              </h3>
              <p>
                {{
                  modalMode === 'view'
                    ? 'View customer information'
                    : 'Fill in the form below'
                }}
              </p>
            </div>

            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <form class="customer-form" @submit.prevent="saveCustomer">
              <div class="form-grid">
                <div class="form-group">
                  <label>Name <span>*</span></label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="Enter customer name"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group">
                  <label>Cell</label>
                  <input
                    v-model="form.cell"
                    type="text"
                    placeholder="Enter phone number"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group">
                  <label>Email</label>
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="Enter email address"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group">
                  <label>Points</label>
                  <input
                    v-model.number="form.points"
                    type="number"
                    min="0"
                    placeholder="0"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group full">
                  <label>Address</label>
                  <textarea
                    v-model="form.address"
                    rows="5"
                    placeholder="Enter customer address"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>
              </div>

              <div v-if="formError" class="form-error">
                {{ formError }}
              </div>

              <div v-if="modalMode !== 'view'" class="modal-footer">
                <button type="button" class="btn btn-light" @click="closeModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{
                    saving
                      ? (modalMode === 'create' ? 'Saving...' : 'Updating...')
                      : (modalMode === 'create' ? 'Save Customer' : 'Update Customer')
                  }}
                </button>
              </div>

              <div v-else class="modal-footer">
                <button type="button" class="btn btn-primary" @click="closeModal">
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
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type Customer = {
  id: number
  name: string
  cell: string
  email: string
  address: string
  points: number
}

type ModalMode = 'create' | 'edit' | 'view'

const search = ref('')
const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)

const customers = ref<Customer[]>([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const formError = ref('')

const form = reactive<Customer>({
  id: 0,
  name: '',
  cell: '',
  email: '',
  address: '',
  points: 0,
})

const filteredCustomers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return customers.value

  return customers.value.filter((customer) => {
    return (
      (customer.name || '').toLowerCase().includes(q) ||
      (customer.cell || '').toLowerCase().includes(q) ||
      (customer.email || '').toLowerCase().includes(q) ||
      (customer.address || '').toLowerCase().includes(q)
    )
  })
})

const customersWithPoints = computed(() => {
  return customers.value.filter((c) => Number(c.points) > 0).length
})

const topCustomerName = computed(() => {
  if (!customers.value.length) return '-'
  const sorted = [...customers.value].sort((a, b) => Number(b.points) - Number(a.points))
  return sorted[0]?.name || '-'
})

function normalizeCustomer(raw: any): Customer {
  return {
    id: Number(raw?.id ?? 0),
    name: raw?.name ?? '',
    cell: raw?.cell ?? '',
    email: raw?.email ?? '',
    address: raw?.address ?? '',
    points: Number(raw?.points ?? 0),
  }
}

function extractRows(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function resetForm() {
  form.id = 0
  form.name = ''
  form.cell = ''
  form.email = ''
  form.address = ''
  form.points = 0
  formError.value = ''
}

function fillForm(customer: Customer) {
  form.id = customer.id
  form.name = customer.name || ''
  form.cell = customer.cell || ''
  form.email = customer.email || ''
  form.address = customer.address || ''
  form.points = Number(customer.points) || 0
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(customer: Customer) {
  modalMode.value = 'edit'
  editingId.value = customer.id
  fillForm(customer)
  showModal.value = true
}

function openViewModal(customer: Customer) {
  modalMode.value = 'view'
  editingId.value = customer.id
  fillForm(customer)
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
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU'
}

function buildPayload() {
  return {
    name: form.name.trim(),
    cell: form.cell.trim(),
    email: form.email.trim() || null,
    address: form.address.trim(),
    points: Number(form.points) || 0,
  }
}

function validateForm() {
  formError.value = ''

  if (!form.name.trim()) {
    formError.value = 'Customer name is required.'
    return false
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    formError.value = 'Email format is invalid.'
    return false
  }

  if (Number(form.points) < 0) {
    formError.value = 'Points cannot be negative.'
    return false
  }

  return true
}

async function fetchCustomers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(ENDPOINTS.CUSTOMERS)
    const rows = extractRows(response.data)
    customers.value = rows.map(normalizeCustomer)
  } catch (error: any) {
    console.error('Failed to fetch customers:', error)
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to load customers.'
    customers.value = []
  } finally {
    loading.value = false
  }
}

async function saveCustomer() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()

    if (modalMode.value === 'create') {
      await api.post(ENDPOINTS.CUSTOMERS, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } else if (modalMode.value === 'edit' && editingId.value !== null) {
      await api.patch(`${ENDPOINTS.CUSTOMERS}${editingId.value}/`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await fetchCustomers()
    closeModal()
  } catch (error: any) {
    const data = error?.response?.data
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      if (firstKey) {
        const firstValue = data[firstKey]
        formError.value = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
      } else {
        formError.value = 'Failed to save customer.'
      }
    } else {
      formError.value = error?.message || 'Failed to save customer.'
    }
  } finally {
    saving.value = false
  }
}

async function removeCustomer(id: number) {
  const ok = window.confirm('Delete this customer?')
  if (!ok) return

  deletingId.value = id

  try {
    await api.delete(`${ENDPOINTS.CUSTOMERS}${id}/`)
    customers.value = customers.value.filter((c) => c.id !== id)
  } catch (error: any) {
    alert(
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to delete customer.'
    )
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.customers-page {
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

.stat-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-card {
  padding: 18px;
  margin-bottom: 20px;
}

.toolbar-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
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
  color: #162033;
}

.search-box input:focus {
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

.table-card {
  padding: 18px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
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

.customer-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.customer-table th,
.customer-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.customer-table th {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  background: #fbfcfe;
}

.customer-table td {
  color: #334155;
}

.customer-table tbody tr:hover {
  background: #fafcff;
}

.customer-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: white;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}

.customer-name {
  font-weight: 700;
  color: #162033;
  line-height: 1.4;
}

.customer-meta {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8798;
  line-height: 1.4;
}

.cell-text,
.email-text,
.address-text {
  color: #162033;
  font-weight: 600;
  line-height: 1.5;
}

.address-cell {
  max-width: 220px;
  color: #334155;
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

.points-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #16a34a;
  font-size: 12px;
  font-weight: 800;
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
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #334155;
}

.info-item .label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-item.full {
  grid-column: 1 / -1;
}

.mobile-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
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
  padding: 12px 14px;
  border-radius: 14px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
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
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
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
}

.modal-body {
  padding: 24px;
}

.customer-form {
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
.form-group textarea {
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

.form-group input:focus,
.form-group textarea:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .customers-page {
    padding: 16px;
  }

  .page-title {
    font-size: 26px;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-card {
    max-width: 100%;
    border-radius: 20px;
  }

  .modal-body,
  .modal-header {
    padding: 18px;
  }

  .btn-primary,
  .btn-light {
    width: 100%;
  }

  .page-header {
    align-items: stretch;
  }

  .page-header > .btn {
    width: 100%;
  }
}
</style>