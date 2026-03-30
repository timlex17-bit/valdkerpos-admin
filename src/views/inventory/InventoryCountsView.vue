<template>
  <div class="inventory-counts-page">
    <!-- Header -->
    <section class="page-header">
      <div>
        <h1 class="page-title">Inventory Counts</h1>
        <p class="page-subtitle">
          Manage inventory count sessions for your current shop.
        </p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Inventory</span>
          <span>/</span>
          <span class="active">Inventory Counts</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="add-btn" @click="openAddModal">
          <span>+</span>
          Add Inventory Count
        </button>
      </div>
    </section>

    <!-- Summary -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Counts</div>
        <div class="stat-value">{{ filteredItems.length }}</div>
        <div class="stat-note">Counts shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Draft Counts</div>
        <div class="stat-value">{{ draftCount }}</div>
        <div class="stat-note">Inventory counts still in draft status</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Completed Counts</div>
        <div class="stat-value">{{ completedCount }}</div>
        <div class="stat-note">Counts already finalized / completed</div>
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
            placeholder="Search by title, note, counted by..."
          />
        </div>

        <input v-model="countDateFilter" type="date" class="filter-input" />

        <select v-model="statusFilter" class="filter-select">
          <option value="">All status</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
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

        <button
          class="refresh-btn"
          @click="fetchInventoryCounts"
          :disabled="loading"
        >
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="error" class="alert-error">
        {{ error }}
      </div>

      <div class="table-wrap" v-if="filteredItems.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Status</th>
              <th>Items</th>
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
                  <div class="title-main">{{ item.title || '-' }}</div>
                </div>
              </td>

              <td>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ formatStatus(item.status) }}
                </span>
              </td>

              <td>
                <div class="items-cell">
                  <div class="items-main">{{ getItemCount(item) }} item(s)</div>
                  <div class="items-sub">Count lines</div>
                </div>
              </td>

              <td>
                {{ getCountedByName(item.counted_by) }}
              </td>

              <td>{{ formatDateTime(item.counted_at) }}</td>
              <td>{{ item.note || '-' }}</td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openViewModal(item)">View</button>
                  <button class="btn-edit" @click="openEditModal(item)">Edit</button>
                  <button
                    v-if="item.status !== 'COMPLETED'"
                    class="btn-finalize"
                    @click="finalizeItem(item)"
                  >
                    Finalize
                  </button>
                  <button class="btn-delete" @click="deleteItem(item.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <h3>No inventory counts found</h3>
        <p>Try another keyword or create a new inventory count.</p>
      </div>

      <div v-if="loading" class="loading-state">
        Loading inventory counts...
      </div>
    </section>

    <!-- Add/Edit Modal -->
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
              <label>Title <span class="required">*</span></label>
              <input
                v-model="form.title"
                type="text"
                class="form-input"
                placeholder="Enter title"
              />
            </div>

            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status" class="form-input">
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
              </select>
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
            <button class="save-btn" @click="saveItem" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <div>
            <h2>Inventory Count Detail</h2>
            <p>Review inventory count information and counted items.</p>
          </div>

          <button class="close-btn" @click="closeViewModal">×</button>
        </div>

        <div class="modal-body" v-if="viewItem">
          <div class="detail-grid">
            <div class="detail-box">
              <div class="detail-label">Reference</div>
              <div class="detail-value">
                IC{{ String(viewItem.id).padStart(10, '0') }}
              </div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Status</div>
              <div class="detail-value">
                <span class="status-badge" :class="statusClass(viewItem.status)">
                  {{ formatStatus(viewItem.status) }}
                </span>
              </div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Title</div>
              <div class="detail-value">{{ viewItem.title || '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Counted By</div>
              <div class="detail-value">{{ getCountedByName(viewItem.counted_by) }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Counted At</div>
              <div class="detail-value">{{ formatDateTime(viewItem.counted_at) }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Items</div>
              <div class="detail-value">{{ getItemCount(viewItem) }} item(s)</div>
            </div>

            <div class="detail-box detail-box-full">
              <div class="detail-label">Note</div>
              <div class="detail-value">{{ viewItem.note || '-' }}</div>
            </div>
          </div>

          <div class="items-table-card">
            <div class="items-table-header">
              <h3>Counted Items</h3>
              <p>{{ getItemCount(viewItem) }} line(s)</p>
            </div>

            <div v-if="getItemCount(viewItem)" class="table-wrap">
              <table class="data-table detail-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>System Stock</th>
                    <th>Physical Stock</th>
                    <th>Difference</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in viewItem.items" :key="row.id || index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ getProductName(row.product) }}</td>
                    <td>{{ displayNumber(row.system_stock) }}</td>
                    <td>{{ displayNumber(row.physical_stock) }}</td>
                    <td>{{ displayDifference(row) }}</td>
                    <td>{{ row.note || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="empty-state small-empty">
              <h3>No counted items</h3>
              <p>This inventory count does not contain item rows yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

type CountedBy = {
  id?: number
  username?: string
  display_name?: string
} | null

type InventoryCountItem = {
  id?: number
  product?: number | string | Record<string, any> | null
  system_stock?: number | string | null
  physical_stock?: number | string | null
  note?: string
  [key: string]: any
}

type InventoryCount = {
  id: number
  title: string
  note: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'COMPLETED'
  counted_at: string
  counted_by: CountedBy
  items: InventoryCountItem[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const inventoryCounts = ref<InventoryCount[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const search = ref('')
const statusFilter = ref('')
const countDateFilter = ref('')

const showModal = ref(false)
const showViewModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)
const viewItem = ref<InventoryCount | null>(null)

const form = reactive({
  title: '',
  note: '',
  status: 'DRAFT' as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'COMPLETED',
})

const filteredItems = computed(() => {
  let items = [...inventoryCounts.value]

  const keyword = search.value.trim().toLowerCase()
  if (keyword) {
    items = items.filter((item) => {
      const countedBy = getCountedByName(item.counted_by).toLowerCase()
      return (
        (item.title || '').toLowerCase().includes(keyword) ||
        (item.note || '').toLowerCase().includes(keyword) ||
        countedBy.includes(keyword)
      )
    })
  }

  if (statusFilter.value) {
    items = items.filter((item) => item.status === statusFilter.value)
  }

  if (countDateFilter.value) {
    items = items.filter((item) =>
      (item.counted_at || '').startsWith(countDateFilter.value)
    )
  }

  return items
})

const draftCount = computed(
  () => filteredItems.value.filter((item) => item.status === 'DRAFT').length
)

const completedCount = computed(
  () => filteredItems.value.filter((item) => item.status === 'COMPLETED').length
)

function getAuthHeaders() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token')

  return token
    ? {
        Authorization: `Token ${token}`,
      }
    : {}
}

async function fetchInventoryCounts() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`${API_BASE_URL}/api/inventorycounts/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    const data = Array.isArray(response.data) ? response.data : []
    inventoryCounts.value = data.map(normalizeInventoryCount)
  } catch (err: any) {
    console.error('Failed to fetch inventory counts:', err)
    error.value =
      err?.response?.data?.detail ||
      'Failed to load inventory counts. Please check your API and token.'
    inventoryCounts.value = []
  } finally {
    loading.value = false
  }
}

function normalizeInventoryCount(raw: any): InventoryCount {
  return {
    id: Number(raw?.id ?? 0),
    title: raw?.title ?? '',
    note: raw?.note ?? '',
    status: normalizeStatus(raw?.status),
    counted_at: raw?.counted_at ?? '',
    counted_by: raw?.counted_by ?? null,
    items: Array.isArray(raw?.items) ? raw.items : [],
  }
}

function normalizeStatus(value: any): InventoryCount['status'] {
  const allowed = ['DRAFT', 'SUBMITTED', 'APPROVED', 'COMPLETED']
  const normalized = String(value || 'DRAFT').toUpperCase()
  return (allowed.includes(normalized) ? normalized : 'DRAFT') as InventoryCount['status']
}

function formatStatus(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'Draft'
    case 'SUBMITTED':
      return 'Submitted'
    case 'APPROVED':
      return 'Approved'
    case 'COMPLETED':
      return 'Completed'
    default:
      return status || '-'
  }
}

function statusClass(status: string) {
  return {
    draft: status === 'DRAFT',
    submitted: status === 'SUBMITTED',
    approved: status === 'APPROVED',
    completed: status === 'COMPLETED',
  }
}

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  countDateFilter.value = ''
}

function resetForm() {
  form.title = ''
  form.note = ''
  form.status = 'DRAFT'
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

  form.title = item.title || ''
  form.note = item.note || ''
  form.status = normalizeStatus(item.status)

  showModal.value = true
}

function openViewModal(item: InventoryCount) {
  viewItem.value = item
  showViewModal.value = true
}

function closeModal() {
  showModal.value = false
}

function closeViewModal() {
  showViewModal.value = false
  viewItem.value = null
}

async function saveItem() {
  if (!form.title.trim()) {
    alert('Title is required')
    return
  }

  saving.value = true

  const payload = {
    title: form.title.trim(),
    note: form.note.trim(),
    status: form.status,
    items: [],
  }

  try {
    if (isEditMode.value && editingId.value !== null) {
      await axios.put(
        `${API_BASE_URL}/api/inventorycounts/${editingId.value}/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      )
    } else {
      await axios.post(`${API_BASE_URL}/api/inventorycounts/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
    }

    closeModal()
    await fetchInventoryCounts()
  } catch (err: any) {
    console.error('Failed to save inventory count:', err)
    alert(
      err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        'Failed to save inventory count.'
    )
  } finally {
    saving.value = false
  }
}

async function deleteItem(id: number) {
  const confirmed = window.confirm('Delete this inventory count?')
  if (!confirmed) return

  try {
    await axios.delete(`${API_BASE_URL}/api/inventorycounts/${id}/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    await fetchInventoryCounts()
  } catch (err: any) {
    console.error('Failed to delete inventory count:', err)
    alert(
      err?.response?.data?.detail ||
        'Failed to delete inventory count.'
    )
  }
}

async function finalizeItem(item: InventoryCount) {
  const confirmed = window.confirm(
    `Finalize inventory count "${item.title}"?`
  )
  if (!confirmed) return

  try {
    await axios.post(
      `${API_BASE_URL}/api/inventorycounts/${item.id}/finalize/`,
      {
        title: item.title,
        note: item.note || '',
        status: item.status,
        items: item.items || [],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      }
    )

    await fetchInventoryCounts()
  } catch (err: any) {
    console.error('Failed to finalize inventory count:', err)
    alert(
      err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        'Failed to finalize inventory count.'
    )
  }
}

function getCountedByName(user: CountedBy) {
  if (!user) return '-'
  return user.display_name || user.username || '-'
}

function getItemCount(item: InventoryCount | null) {
  if (!item || !Array.isArray(item.items)) return 0
  return item.items.length
}

function getProductName(product: any) {
  if (!product) return '-'
  if (typeof product === 'string' || typeof product === 'number') return String(product)
  return product.name || product.title || product.sku || `#${product.id ?? '-'}`
}

function displayNumber(value: any) {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

function displayDifference(row: InventoryCountItem) {
  const system = Number(row?.system_stock ?? 0)
  const physical = Number(row?.physical_stock ?? 0)

  if (Number.isNaN(system) || Number.isNaN(physical)) return '-'
  return physical - system
}

function formatDateTime(value: string) {
  if (!value) return '-'

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

onMounted(() => {
  fetchInventoryCounts()
})
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-btn,
.refresh-btn {
  border: none;
  color: white;
  padding: 14px 22px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.add-btn {
  background: #22c55e;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.18);
}

.refresh-btn {
  background: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
  min-width: 1280px;
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

.ref-sub,
.items-sub {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 4px;
}

.title-main,
.items-main {
  font-weight: 700;
  color: #1f2937;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
}

.status-badge.draft {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.submitted {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.approved {
  background: #ede9fe;
  color: #7c3aed;
}

.status-badge.completed {
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
.btn-delete,
.btn-finalize {
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

.btn-finalize {
  border: 1px solid #86efac;
  color: #16a34a;
}

.btn-delete {
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.empty-state,
.loading-state {
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

.loading-state {
  color: #475569;
  font-weight: 600;
}

.small-empty {
  padding: 28px 16px;
}

.alert-error {
  margin: 0 20px 16px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 14px 16px;
  border-radius: 14px;
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

.modal-card-lg {
  width: min(1180px, 100%);
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

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.required {
  color: #dc2626;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.detail-box {
  background: #f8fafc;
  border: 1px solid #e5edf5;
  border-radius: 16px;
  padding: 16px;
}

.detail-box-full {
  grid-column: 1 / -1;
}

.detail-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.detail-value {
  color: #1f2937;
  font-size: 1rem;
  font-weight: 700;
}

.items-table-card {
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 18px;
  overflow: hidden;
}

.items-table-header {
  padding: 18px 18px 0;
}

.items-table-header h3 {
  margin: 0;
  color: #1f2a44;
  font-size: 1.05rem;
}

.items-table-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.detail-table {
  min-width: 900px;
}

@media (max-width: 1100px) {
  .toolbar-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-box-full {
    grid-column: auto;
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

  .add-btn,
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
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