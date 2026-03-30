<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Stock Adjustments</h1>
        <p class="page-subtitle">
          Manage stock adjustment history for your current shop.
        </p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>POS</span>
          <span>/</span>
          <span class="active">Stock Adjustments</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="refresh-btn" @click="fetchStockAdjustments" :disabled="loading">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>

        <button class="add-btn" @click="openAddModal">
          <span>+</span>
          Add Stock Adjustment
        </button>
      </div>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Adjustments</div>
        <div class="stat-value">{{ filteredItems.length }}</div>
        <div class="stat-note">Adjustments shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Lost</div>
        <div class="stat-value">{{ countByReason('LOST') }}</div>
        <div class="stat-note">Items marked as lost</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Damaged</div>
        <div class="stat-value">{{ countByReason('DAMAGED') }}</div>
        <div class="stat-note">Items marked as damaged</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid toolbar-grid-4">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by product, adjusted by, reason..."
          />
        </div>

        <select v-model="reasonFilter" class="filter-select">
          <option value="">All reasons</option>
          <option value="LOST">LOST</option>
          <option value="DAMAGED">DAMAGED</option>
          <option value="OTHER">OTHER</option>
        </select>

        <input v-model="dateFilter" type="date" class="filter-select" />

        <button class="reset-btn" @click="resetFilters">Reset</button>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Stock Adjustment List</h2>
          <p>{{ filteredItems.length }} adjustment(s) found</p>
        </div>
      </div>

      <div v-if="error" class="alert-error">
        {{ error }}
      </div>

      <div class="table-wrap" v-if="filteredItems.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Product</th>
              <th>Old Stock</th>
              <th>New Stock</th>
              <th>Difference</th>
              <th>Reason</th>
              <th>Adjusted By</th>
              <th>Adjusted At</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>
                <div class="ref-cell">
                  <div class="ref-main">SA{{ String(item.id).padStart(10, '0') }}</div>
                  <div class="ref-sub">Adjustment</div>
                </div>
              </td>

              <td>
                <div class="title-main">{{ item.product_name || '-' }}</div>
              </td>

              <td>{{ item.old_stock }}</td>
              <td>{{ item.new_stock }}</td>
              <td>
                <span :class="['diff-badge', diffClass(item)]">
                  {{ formatDifference(item) }}
                </span>
              </td>

              <td>
                <span class="status-badge" :class="reasonClass(item.reason)">
                  {{ item.reason || '-' }}
                </span>
              </td>

              <td>{{ item.adjusted_by_name || '-' }}</td>
              <td>{{ formatDateTime(item.adjusted_at) }}</td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openViewModal(item)">View</button>
                  <button class="btn-edit" @click="openEditModal(item)">Edit</button>
                  <button class="btn-delete" @click="deleteItem(item.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <h3>No stock adjustments found</h3>
        <p>Try another keyword or create a new stock adjustment.</p>
      </div>

      <div v-if="loading" class="loading-state">
        Loading stock adjustments...
      </div>
    </section>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-card-wide">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit Stock Adjustment' : 'Add Stock Adjustment' }}</h2>
            <p>Fill in the form below to save stock adjustment data.</p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid two-col">
            <div class="form-group">
              <label>Product <span class="required">*</span></label>
              <select v-model="form.product" class="form-input">
                <option value="">Select product</option>
                <option
                  v-for="product in productOptions"
                  :key="product.id"
                  :value="product.id"
                >
                  {{ product.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Reason <span class="required">*</span></label>
              <select v-model="form.reason" class="form-input">
                <option value="">Select reason</option>
                <option value="LOST">LOST</option>
                <option value="DAMAGED">DAMAGED</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div class="form-group">
              <label>Current / Old Stock</label>
              <input
                :value="displayOldStock"
                type="text"
                class="form-input readonly-input"
                readonly
              />
            </div>

            <div class="form-group">
              <label>New Stock <span class="required">*</span></label>
              <input
                v-model.number="form.new_stock"
                type="number"
                class="form-input"
                placeholder="0"
              />
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
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>Stock Adjustment Detail</h2>
            <p>Review stock adjustment information.</p>
          </div>
          <button class="close-btn" @click="closeViewModal">×</button>
        </div>

        <div class="modal-body" v-if="viewItem">
          <div class="detail-grid">
            <div class="detail-box">
              <div class="detail-label">Reference</div>
              <div class="detail-value">
                SA{{ String(viewItem.id).padStart(10, '0') }}
              </div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Product</div>
              <div class="detail-value">{{ viewItem.product_name || '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Old Stock</div>
              <div class="detail-value">{{ viewItem.old_stock }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">New Stock</div>
              <div class="detail-value">{{ viewItem.new_stock }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Difference</div>
              <div class="detail-value">{{ formatDifference(viewItem) }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Reason</div>
              <div class="detail-value">
                <span class="status-badge" :class="reasonClass(viewItem.reason)">
                  {{ viewItem.reason || '-' }}
                </span>
              </div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Adjusted By</div>
              <div class="detail-value">{{ viewItem.adjusted_by_name || '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">Adjusted At</div>
              <div class="detail-value">{{ formatDateTime(viewItem.adjusted_at) }}</div>
            </div>

            <div class="detail-box detail-box-full">
              <div class="detail-label">Note</div>
              <div class="detail-value">{{ viewItem.note || '-' }}</div>
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

type ReasonType = 'LOST' | 'DAMAGED' | 'OTHER' | string

type StockAdjustment = {
  id: number
  product: number | null
  product_name: string
  old_stock: number
  new_stock: number
  reason: string
  note: string
  adjusted_at: string
  adjusted_by: number | null
  adjusted_by_name: string
}

type ProductOption = {
  id: number
  name: string
  barcode?: string
  stock?: number | string | null
  label: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const stockAdjustments = ref<StockAdjustment[]>([])
const productOptions = ref<ProductOption[]>([])

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const search = ref('')
const reasonFilter = ref('')
const dateFilter = ref('')

const showModal = ref(false)
const showViewModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)
const viewItem = ref<StockAdjustment | null>(null)

const form = reactive({
  product: '' as number | '' | string,
  new_stock: 0 as number | string,
  reason: '' as ReasonType | '',
  note: '',
})

const filteredItems = computed(() => {
  let results = [...stockAdjustments.value]
  const keyword = search.value.trim().toLowerCase()

  if (keyword) {
    results = results.filter((item) =>
      (item.product_name || '').toLowerCase().includes(keyword) ||
      (item.adjusted_by_name || '').toLowerCase().includes(keyword) ||
      (item.reason || '').toLowerCase().includes(keyword)
    )
  }

  if (reasonFilter.value) {
    results = results.filter((item) => item.reason === reasonFilter.value)
  }

  if (dateFilter.value) {
    results = results.filter((item) =>
      (item.adjusted_at || '').startsWith(dateFilter.value)
    )
  }

  return results
})

const selectedProduct = computed(() => {
  const productId = Number(form.product)
  if (!productId) return null
  return productOptions.value.find((item) => item.id === productId) || null
})

const displayOldStock = computed(() => {
  if (isEditMode.value && editingId.value !== null) {
    const existing = stockAdjustments.value.find((item) => item.id === editingId.value)
    if (existing) return String(existing.old_stock)
  }

  if (selectedProduct.value?.stock !== undefined && selectedProduct.value?.stock !== null) {
    return String(selectedProduct.value.stock)
  }

  return '-'
})

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

function normalizeStockAdjustment(raw: any): StockAdjustment {
  return {
    id: Number(raw?.id ?? 0),
    product: raw?.product ?? null,
    product_name: raw?.product_name ?? '',
    old_stock: Number(raw?.old_stock ?? 0),
    new_stock: Number(raw?.new_stock ?? 0),
    reason: raw?.reason ?? '',
    note: raw?.note ?? '',
    adjusted_at: raw?.adjusted_at ?? '',
    adjusted_by: raw?.adjusted_by ?? null,
    adjusted_by_name: raw?.adjusted_by_name ?? '',
  }
}

function normalizeProducts(payload: any): ProductOption[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : []

  return rows.map((item: any) => {
    const id = Number(item?.id ?? 0)
    const name = item?.name ?? item?.product_name ?? `Product #${id}`
    const barcode = item?.barcode ?? ''
    const stock = item?.stock ?? item?.current_stock ?? item?.quantity ?? null

    return {
      id,
      name,
      barcode,
      stock,
      label: barcode ? `${name} (${barcode})` : name,
    }
  })
}

async function fetchProducts() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    productOptions.value = normalizeProducts(response.data)
  } catch (err) {
    console.error('Failed to fetch products:', err)
    productOptions.value = []
  }
}

async function fetchStockAdjustments() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`${API_BASE_URL}/api/stockadjustments/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    const rows = Array.isArray(response.data) ? response.data : []
    stockAdjustments.value = rows.map(normalizeStockAdjustment)
  } catch (err: any) {
    console.error('Failed to fetch stock adjustments:', err)
    error.value =
      err?.response?.data?.detail ||
      'Failed to load stock adjustments. Please check API and token.'
    stockAdjustments.value = []
  } finally {
    loading.value = false
  }
}

function countByReason(reason: ReasonType) {
  return filteredItems.value.filter((item) => item.reason === reason).length
}

function resetFilters() {
  search.value = ''
  reasonFilter.value = ''
  dateFilter.value = ''
}

function resetForm() {
  form.product = ''
  form.new_stock = 0
  form.reason = ''
  form.note = ''
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(item: StockAdjustment) {
  form.product = item.product ?? ''
  form.new_stock = item.new_stock
  form.reason = item.reason || ''
  form.note = item.note || ''

  editingId.value = item.id
  isEditMode.value = true
  showModal.value = true
}

function openViewModal(item: StockAdjustment) {
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

function validateForm() {
  if (!form.product) {
    alert('Product is required.')
    return false
  }

  if (form.new_stock === '' || form.new_stock === null || form.new_stock === undefined) {
    alert('New stock is required.')
    return false
  }

  if (!form.reason || !String(form.reason).trim()) {
    alert('Reason is required.')
    return false
  }

  return true
}

async function saveItem() {
  if (!validateForm()) return

  saving.value = true

  const payload = {
    product: Number(form.product),
    new_stock: Number(form.new_stock),
    reason: String(form.reason).trim(),
    note: form.note.trim(),
  }

  try {
    if (isEditMode.value && editingId.value !== null) {
      await axios.put(
        `${API_BASE_URL}/api/stockadjustments/${editingId.value}/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      )
    } else {
      await axios.post(`${API_BASE_URL}/api/stockadjustments/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
    }

    closeModal()
    await Promise.all([fetchStockAdjustments(), fetchProducts()])
  } catch (err: any) {
    console.error('Failed to save stock adjustment:', err)
    alert(
      err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        'Failed to save stock adjustment.'
    )
  } finally {
    saving.value = false
  }
}

async function deleteItem(id: number) {
  if (!window.confirm('Delete this stock adjustment?')) return

  try {
    await axios.delete(`${API_BASE_URL}/api/stockadjustments/${id}/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    await Promise.all([fetchStockAdjustments(), fetchProducts()])
  } catch (err: any) {
    console.error('Failed to delete stock adjustment:', err)
    alert(
      err?.response?.data?.detail ||
        'Failed to delete stock adjustment.'
    )
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDifference(item: StockAdjustment) {
  const diff = Number(item.new_stock) - Number(item.old_stock)
  if (diff > 0) return `+${diff}`
  return `${diff}`
}

function diffClass(item: StockAdjustment) {
  const diff = Number(item.new_stock) - Number(item.old_stock)
  return {
    positive: diff > 0,
    negative: diff < 0,
    neutral: diff === 0,
  }
}

function reasonClass(reason: ReasonType) {
  return {
    cancelled: reason === 'LOST',
    unpaid: reason === 'DAMAGED',
    info: reason === 'OTHER',
  }
}

onMounted(async () => {
  await Promise.all([fetchProducts(), fetchStockAdjustments()])
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
  margin-top: 12px;
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
  gap: 14px;
  align-items: center;
}

.toolbar-grid-4 {
  grid-template-columns: 1.8fr 1fr 0.9fr auto;
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
  min-width: 1200px;
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

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.unpaid {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.info {
  background: #dbeafe;
  color: #2563eb;
}

.diff-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
}

.diff-badge.positive {
  background: #dcfce7;
  color: #15803d;
}

.diff-badge.negative {
  background: #fee2e2;
  color: #dc2626;
}

.diff-badge.neutral {
  background: #e5e7eb;
  color: #475569;
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

.modal-card-wide {
  width: min(920px, 100%);
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

.readonly-input {
  color: #64748b;
  background: #f1f5f9;
}

.textarea {
  min-height: 110px;
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
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

@media (max-width: 1100px) {
  .toolbar-grid-4,
  .stats-grid,
  .two-col,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-box-full {
    grid-column: auto;
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

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .add-btn,
  .refresh-btn {
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