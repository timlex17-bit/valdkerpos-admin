<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Stock Movements</h1>
        <p class="page-subtitle">Manage stock movement history for your current shop.</p>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>POS</span>
          <span>/</span>
          <span class="active">Stock Movements</span>
        </div>
      </div>

      <button class="add-btn" @click="openAddModal">
        <span>+</span>
        Add Stock Movement
      </button>
    </section>

    <section class="stats-grid stats-grid-4">
      <div class="stat-card">
        <div class="stat-label">Visible Movements</div>
        <div class="stat-value">{{ filteredItems.length }}</div>
        <div class="stat-note">Movements shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Sales</div>
        <div class="stat-value">{{ totalByType('Sale') }}</div>
        <div class="stat-note">Outgoing sales movements</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Purchases</div>
        <div class="stat-value">{{ totalByType('Purchase') }}</div>
        <div class="stat-note">Incoming purchase movements</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Adjustments</div>
        <div class="stat-value">{{ totalByType('Adjustment') }}</div>
        <div class="stat-note">Manual stock corrections</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid toolbar-grid-4">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by product, ref model, created by..."
          />
        </div>

        <select v-model="movementTypeFilter" class="filter-select">
          <option value="">All movement types</option>
          <option value="Sale">Sale</option>
          <option value="Purchase">Purchase</option>
          <option value="Adjustment">Adjustment</option>
          <option value="Sale Return">Sale Return</option>
        </select>

        <input v-model="dateFilter" type="date" class="filter-select" />

        <button class="reset-btn" @click="resetFilters">Reset</button>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Stock Movement List</h2>
          <p>{{ filteredItems.length }} movement(s) found</p>
        </div>
      </div>

      <div class="table-wrap" v-if="filteredItems.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Product</th>
              <th>Type</th>
              <th>Qty Delta</th>
              <th>Before</th>
              <th>After</th>
              <th>Reference Model</th>
              <th>Created At</th>
              <th>Created By</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>
                <div class="ref-cell">
                  <div class="ref-main">SM{{ String(item.id).padStart(10, '0') }}</div>
                  <div class="ref-sub">Movement</div>
                </div>
              </td>

              <td>
                <div class="title-main">{{ item.product }}</div>
              </td>

              <td>
                <span class="status-badge" :class="movementTypeClass(item.movementType)">
                  {{ item.movementType }}
                </span>
              </td>

              <td>
                <span class="delta-text" :class="deltaClass(item.quantityDelta)">
                  {{ formatDelta(item.quantityDelta) }}
                </span>
              </td>

              <td>{{ item.beforeStock }}</td>
              <td>{{ item.afterStock }}</td>

              <td>
                <div class="ref-model">
                  <div>{{ item.refModel || '-' }}</div>
                  <div class="ref-sub" v-if="item.refId">#{{ item.refId }}</div>
                </div>
              </td>

              <td>{{ formatDateTime(item.createdAt) }}</td>
              <td>{{ item.createdBy || '-' }}</td>

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
        <h3>No stock movements found</h3>
        <p>Try another keyword or create a new stock movement.</p>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-card-wide">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit Stock Movement' : 'Add Stock Movement' }}</h2>
            <p>Fill in the form below to save stock movement data.</p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid two-col">
            <div class="form-group">
              <label>Product</label>
              <select v-model="form.product" class="form-input">
                <option value="">Select product</option>
                <option v-for="product in productOptions" :key="product" :value="product">
                  {{ product }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Movement Type</label>
              <select v-model="form.movementType" class="form-input">
                <option value="">Select movement type</option>
                <option value="Sale">Sale</option>
                <option value="Purchase">Purchase</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Sale Return">Sale Return</option>
              </select>
            </div>

            <div class="form-group">
              <label>Quantity Delta</label>
              <input v-model.number="form.quantityDelta" type="number" class="form-input" placeholder="-1 / +10" />
            </div>

            <div class="form-group">
              <label>Before Stock</label>
              <input v-model.number="form.beforeStock" type="number" min="0" class="form-input" placeholder="0" />
            </div>

            <div class="form-group">
              <label>After Stock</label>
              <input v-model.number="form.afterStock" type="number" min="0" class="form-input" placeholder="0" />
            </div>

            <div class="form-group">
              <label>Created By</label>
              <input v-model="form.createdBy" type="text" class="form-input" placeholder="Admin / Owner" />
            </div>

            <div class="form-group">
              <label>Reference Model</label>
              <input v-model="form.refModel" type="text" class="form-input" placeholder="Order, Purchase, Adjustment..." />
            </div>

            <div class="form-group">
              <label>Reference ID</label>
              <input v-model="form.refId" type="text" class="form-input" placeholder="Reference id" />
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

type MovementType = 'Sale' | 'Purchase' | 'Adjustment' | 'Sale Return'

type StockMovement = {
  id: number
  product: string
  movementType: MovementType
  quantityDelta: number
  beforeStock: number
  afterStock: number
  note: string
  refModel: string
  refId: string
  createdAt: string
  createdBy: string
}

const productOptions = ref<string[]>([
  'Oli Yamaha Lube (6937467600037)',
  'Pizza Sosis (74384393934393)',
  'Redbull (07B432024111604446)',
  'Ice Cemilds (2672838383)',
  'Donats (8363737373783)',
])

const stockMovements = ref<StockMovement[]>([
  {
    id: 43,
    product: 'Oli Yamaha Lube (6937467600037)',
    movementType: 'Adjustment',
    quantityDelta: 50,
    beforeStock: 450,
    afterStock: 500,
    note: 'Stock corrected after review.',
    refModel: 'StockAdjustment',
    refId: '3',
    createdAt: '2026-03-18T22:38',
    createdBy: 'admin',
  },
  {
    id: 42,
    product: 'Oli Yamaha Lube (6937467600037)',
    movementType: 'Sale',
    quantityDelta: -50,
    beforeStock: 500,
    afterStock: 450,
    note: 'Sales transaction.',
    refModel: 'Order',
    refId: '42',
    createdAt: '2026-03-18T22:34',
    createdBy: 'admin',
  },
  {
    id: 39,
    product: 'Ice Cemilds (2672838383)',
    movementType: 'Purchase',
    quantityDelta: 20,
    beforeStock: 35,
    afterStock: 55,
    note: 'Stock from supplier.',
    refModel: 'Purchase',
    refId: '19',
    createdAt: '2026-03-18T08:12',
    createdBy: 'admin',
  },
  {
    id: 38,
    product: 'Redbull (07B432024111604446)',
    movementType: 'Sale Return',
    quantityDelta: 2,
    beforeStock: 58,
    afterStock: 60,
    note: 'Returned item.',
    refModel: 'ProductReturn',
    refId: '7',
    createdAt: '2026-03-18T08:12',
    createdBy: 'admin',
  },
])

const search = ref('')
const movementTypeFilter = ref('')
const dateFilter = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  product: '',
  movementType: '' as '' | MovementType,
  quantityDelta: 0,
  beforeStock: 0,
  afterStock: 0,
  note: '',
  refModel: '',
  refId: '',
  createdBy: 'admin',
  date: '',
  time: '',
})

const filteredItems = computed(() => {
  let results = [...stockMovements.value]
  const keyword = search.value.trim().toLowerCase()

  if (keyword) {
    results = results.filter((item) =>
      item.product.toLowerCase().includes(keyword) ||
      item.refModel.toLowerCase().includes(keyword) ||
      item.createdBy.toLowerCase().includes(keyword)
    )
  }

  if (movementTypeFilter.value) {
    results = results.filter((item) => item.movementType === movementTypeFilter.value)
  }

  if (dateFilter.value) {
    results = results.filter((item) => item.createdAt.startsWith(dateFilter.value))
  }

  return results
})

function totalByType(type: MovementType) {
  return stockMovements.value.filter((item) => item.movementType === type).length
}

function getNowDate() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

function getNowTime() {
  const now = new Date()
  return now.toTimeString().slice(0, 5)
}

function resetFilters() {
  search.value = ''
  movementTypeFilter.value = ''
  dateFilter.value = ''
}

function resetForm() {
  form.product = ''
  form.movementType = ''
  form.quantityDelta = 0
  form.beforeStock = 0
  form.afterStock = 0
  form.note = ''
  form.refModel = ''
  form.refId = ''
  form.createdBy = 'admin'
  form.date = getNowDate()
  form.time = getNowTime()
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(item: StockMovement) {
  const [datePart, timePartRaw] = item.createdAt.split('T')
  const timePart = timePartRaw ? timePartRaw.slice(0, 5) : '00:00'

  form.product = item.product
  form.movementType = item.movementType
  form.quantityDelta = item.quantityDelta
  form.beforeStock = item.beforeStock
  form.afterStock = item.afterStock
  form.note = item.note
  form.refModel = item.refModel
  form.refId = item.refId
  form.createdBy = item.createdBy
  form.date = datePart || getNowDate()
  form.time = timePart

  editingId.value = item.id
  isEditMode.value = true
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function validateForm() {
  if (!form.product.trim()) {
    alert('Product is required.')
    return false
  }
  if (!form.movementType) {
    alert('Movement type is required.')
    return false
  }
  if (!form.date || !form.time) {
    alert('Date and time are required.')
    return false
  }
  return true
}

function buildCreatedAt() {
  return `${form.date}T${form.time}`
}

function getNextId() {
  return stockMovements.value.length > 0 ? Math.max(...stockMovements.value.map((item) => item.id)) + 1 : 1
}

function saveItem() {
  if (!validateForm()) return

  const payload: StockMovement = {
    id: editingId.value ?? getNextId(),
    product: form.product,
    movementType: form.movementType as MovementType,
    quantityDelta: Number(form.quantityDelta),
    beforeStock: Number(form.beforeStock),
    afterStock: Number(form.afterStock),
    note: form.note.trim(),
    refModel: form.refModel.trim(),
    refId: form.refId.trim(),
    createdAt: buildCreatedAt(),
    createdBy: form.createdBy.trim() || 'admin',
  }

  if (isEditMode.value && editingId.value !== null) {
    const index = stockMovements.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) stockMovements.value[index] = payload
  } else {
    stockMovements.value.unshift(payload)
  }

  closeModal()
  resetForm()
}

function deleteItem(id: number) {
  if (!window.confirm('Delete this stock movement?')) return
  stockMovements.value = stockMovements.value.filter((item) => item.id !== id)
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

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

function deltaClass(value: number) {
  return {
    positive: value > 0,
    negative: value < 0,
    neutral: value === 0,
  }
}

function movementTypeClass(type: MovementType) {
  return {
    paid: type === 'Purchase',
    unpaid: type === 'Sale Return',
    cancelled: type === 'Sale',
    info: type === 'Adjustment',
  }
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
  gap: 18px;
  margin-bottom: 22px;
}
.stats-grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
.ref-sub {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 4px;
}
.title-main {
  font-weight: 700;
  color: #1f2937;
}
.delta-text {
  font-weight: 800;
}
.delta-text.positive {
  color: #16a34a;
}
.delta-text.negative {
  color: #dc2626;
}
.delta-text.neutral {
  color: #64748b;
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
.status-badge.info {
  background: #dbeafe;
  color: #2563eb;
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
.modal-card-wide {
  width: min(980px, 100%);
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
@media (max-width: 1100px) {
  .toolbar-grid-4,
  .stats-grid-4,
  .two-col {
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