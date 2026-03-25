<template>
    <div class="stock-movements-page">
      <!-- Header -->
      <section class="page-header">
        <div class="page-header__left">
          <div>
            <h1 class="page-title">Stock movements</h1>
            <div class="breadcrumb">
              <span>Home</span>
              <span>›</span>
              <span>Pos</span>
              <span>›</span>
              <span class="active">Stock movements</span>
            </div>
          </div>
        </div>
  
        <button class="btn btn-success" @click="openAddModal">
          <span class="btn-icon">＋</span>
          <span>Add stock movement</span>
        </button>
      </section>
  
      <!-- Summary -->
      <section class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Movements</div>
          <div class="summary-value">{{ stockMovements.length }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Sales</div>
          <div class="summary-value">{{ totalByType('Sale') }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Adjustments</div>
          <div class="summary-value">{{ totalByType('Adjustment') }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Purchases</div>
          <div class="summary-value">{{ totalByType('Purchase') }}</div>
        </div>
      </section>
  
      <!-- Toolbar -->
      <section class="toolbar-card">
        <div class="toolbar-top">
          <div class="toolbar-search">
            <input
              v-model="search"
              type="text"
              class="form-input"
              placeholder="Search product..."
            />
  
            <select v-model="movementTypeFilter" class="form-select">
              <option value="">Movement type</option>
              <option value="Sale">Sale</option>
              <option value="Purchase">Purchase</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Sale Return">Sale Return</option>
            </select>
  
            <button class="btn btn-primary" @click="applyFilters">Search</button>
          </div>
  
          <button class="btn btn-light" @click="resetFilters">Reset</button>
        </div>
  
        <div class="toolbar-bottom">
          <select v-model="bulkAction" class="form-select bulk-select">
            <option value="">Bulk action</option>
            <option value="delete">Delete selected</option>
          </select>
  
          <button class="btn btn-primary btn-sm" @click="handleBulkAction">Go</button>
  
          <span class="selection-text">
            {{ selectedIds.length }} of {{ filteredItems.length }} selected
          </span>
        </div>
      </section>
  
      <!-- Table -->
      <section class="table-card">
        <div class="table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>ID</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty Delta</th>
                <th>Before</th>
                <th>After</th>
                <th>Ref</th>
                <th>Created At</th>
                <th>Created By</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredItems.length === 0">
                <td colspan="11" class="empty-cell">No stock movements found.</td>
              </tr>
  
              <tr v-for="item in filteredItems" :key="item.id">
                <td>
                  <input type="checkbox" :value="item.id" v-model="selectedIds" />
                </td>
  
                <td class="id-cell">{{ item.id }}</td>
  
                <td>
                  <div class="product-cell">
                    <div class="product-name">{{ item.product }}</div>
                  </div>
                </td>
  
                <td>
                  <span class="type-badge" :class="typeClass(item.movementType)">
                    {{ item.movementType }}
                  </span>
                </td>
  
                <td>
                  <span
                    class="qty-delta"
                    :class="{
                      positive: item.quantityDelta > 0,
                      negative: item.quantityDelta < 0,
                      neutral: item.quantityDelta === 0,
                    }"
                  >
                    {{ formatDelta(item.quantityDelta) }}
                  </span>
                </td>
  
                <td>{{ item.beforeStock }}</td>
                <td>{{ item.afterStock }}</td>
  
                <td>
                  <div class="ref-cell">
                    <div>{{ item.refModel || '-' }}</div>
                    <small v-if="item.refId">#{{ item.refId }}</small>
                  </div>
                </td>
  
                <td>{{ formatDateTime(item.createdAt) }}</td>
                <td>{{ item.createdBy || '-' }}</td>
  
                <td>
                  <div class="actions">
                    <button class="icon-btn edit" @click="openEditModal(item)">Edit</button>
                    <button class="icon-btn delete" @click="deleteItem(item.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div class="table-footer">
          {{ filteredItems.length }} stock movements
        </div>
      </section>
  
      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h2>{{ isEditMode ? 'Edit stock movement' : 'Add stock movement' }}</h2>
              <p>
                {{
                  isEditMode
                    ? 'Update stock movement information'
                    : 'Create a new stock movement'
                }}
              </p>
            </div>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <div class="modal-body">
            <div class="modal-layout">
              <div class="form-panel">
                <div class="form-grid">
                  <div class="form-group">
                    <label>Product <span class="required">*</span></label>
                    <select v-model="form.product" class="form-select">
                      <option value="">Select product</option>
                      <option
                        v-for="product in productOptions"
                        :key="product"
                        :value="product"
                      >
                        {{ product }}
                      </option>
                    </select>
                  </div>
  
                  <div class="form-group">
                    <label>Movement type <span class="required">*</span></label>
                    <select v-model="form.movementType" class="form-select">
                      <option value="">Select movement type</option>
                      <option value="Sale">Sale</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Adjustment">Adjustment</option>
                      <option value="Sale Return">Sale Return</option>
                    </select>
                  </div>
  
                  <div class="form-group">
                    <label>Quantity delta <span class="required">*</span></label>
                    <input
                      v-model.number="form.quantityDelta"
                      type="number"
                      class="form-input"
                      placeholder="-1 / +10"
                    />
                  </div>
  
                  <div class="form-group">
                    <label>Before stock <span class="required">*</span></label>
                    <input
                      v-model.number="form.beforeStock"
                      type="number"
                      min="0"
                      class="form-input"
                      placeholder="0"
                    />
                  </div>
  
                  <div class="form-group">
                    <label>After stock <span class="required">*</span></label>
                    <input
                      v-model.number="form.afterStock"
                      type="number"
                      min="0"
                      class="form-input"
                      placeholder="0"
                    />
                  </div>
  
                  <div class="form-group">
                    <label>Ref model</label>
                    <input
                      v-model="form.refModel"
                      type="text"
                      class="form-input"
                      placeholder="Order, Purchase, Adjustment..."
                    />
                  </div>
  
                  <div class="form-group">
                    <label>Ref id</label>
                    <input
                      v-model="form.refId"
                      type="text"
                      class="form-input"
                      placeholder="Reference id"
                    />
                  </div>
  
                  <div class="form-group">
                    <label>Created by</label>
                    <input
                      v-model="form.createdBy"
                      type="text"
                      class="form-input"
                      placeholder="Admin / Owner"
                    />
                  </div>
  
                  <div class="form-group form-group--full">
                    <label>Note</label>
                    <textarea
                      v-model="form.note"
                      rows="5"
                      class="form-textarea"
                      placeholder="Write note here..."
                    />
                  </div>
  
                  <div class="form-group">
                    <label>Date <span class="required">*</span></label>
                    <input v-model="form.date" type="date" class="form-input" />
                  </div>
  
                  <div class="form-group">
                    <label>Time <span class="required">*</span></label>
                    <input v-model="form.time" type="time" class="form-input" />
                  </div>
                </div>
              </div>
  
              <div class="action-panel">
                <div class="action-panel__card">
                  <button class="btn btn-success full-btn" @click="saveItem">Save</button>
                  <button class="btn btn-info full-btn" @click="saveAndAddAnother">
                    Save and add another
                  </button>
                  <button class="btn btn-info full-btn" @click="saveAndContinueEditing">
                    Save and continue editing
                  </button>
                </div>
  
                <div class="preview-card">
                  <div class="preview-title">Preview</div>
                  <div class="preview-row">
                    <span>Before</span>
                    <strong>{{ form.beforeStock || 0 }}</strong>
                  </div>
                  <div class="preview-row">
                    <span>Delta</span>
                    <strong>{{ formatDelta(Number(form.quantityDelta || 0)) }}</strong>
                  </div>
                  <div class="preview-row">
                    <span>After</span>
                    <strong>{{ form.afterStock || 0 }}</strong>
                  </div>
                  <div class="preview-row">
                    <span>Type</span>
                    <strong>{{ form.movementType || '-' }}</strong>
                  </div>
                </div>
              </div>
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
      id: 41,
      product: 'Pizza Sosis (74384393934393)',
      movementType: 'Sale',
      quantityDelta: -1,
      beforeStock: 64,
      afterStock: 63,
      note: 'POS sale.',
      refModel: 'Order',
      refId: '41',
      createdAt: '2026-03-18T22:09',
      createdBy: 'admin',
    },
    {
      id: 40,
      product: 'Donats (8363737373783)',
      movementType: 'Sale',
      quantityDelta: -1,
      beforeStock: 46,
      afterStock: 45,
      note: 'POS sale.',
      refModel: 'Order',
      refId: '40',
      createdAt: '2026-03-18T22:09',
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
  const appliedSearch = ref('')
  const movementTypeFilter = ref('')
  const appliedMovementTypeFilter = ref('')
  const bulkAction = ref('')
  const selectedIds = ref<number[]>([])
  
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
  
    const keyword = appliedSearch.value.trim().toLowerCase()
    if (keyword) {
      results = results.filter((item) =>
        item.product.toLowerCase().includes(keyword)
      )
    }
  
    if (appliedMovementTypeFilter.value) {
      results = results.filter((item) => item.movementType === appliedMovementTypeFilter.value)
    }
  
    return results
  })
  
  const isAllSelected = computed(() => {
    return (
      filteredItems.value.length > 0 &&
      filteredItems.value.every((item) => selectedIds.value.includes(item.id))
    )
  })
  
  function totalByType(type: MovementType) {
    return stockMovements.value.filter((item) => item.movementType === type).length
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
  
  function applyFilters() {
    appliedSearch.value = search.value
    appliedMovementTypeFilter.value = movementTypeFilter.value
    selectedIds.value = []
  }
  
  function resetFilters() {
    search.value = ''
    appliedSearch.value = ''
    movementTypeFilter.value = ''
    appliedMovementTypeFilter.value = ''
    selectedIds.value = []
  }
  
  function toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    selectedIds.value = checked ? filteredItems.value.map((item) => item.id) : []
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
  
    if (form.beforeStock < 0) {
      alert('Before stock must be 0 or greater.')
      return false
    }
  
    if (form.afterStock < 0) {
      alert('After stock must be 0 or greater.')
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
  
    return true
  }
  
  function buildCreatedAt() {
    return `${form.date}T${form.time}`
  }
  
  function getNextId() {
    return stockMovements.value.length > 0
      ? Math.max(...stockMovements.value.map((item) => item.id)) + 1
      : 1
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
      note: form.note,
      refModel: form.refModel,
      refId: form.refId,
      createdAt: buildCreatedAt(),
      createdBy: form.createdBy,
    }
  
    if (isEditMode.value && editingId.value !== null) {
      const index = stockMovements.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        stockMovements.value[index] = payload
      }
    } else {
      stockMovements.value.unshift(payload)
    }
  
    closeModal()
    resetForm()
  }
  
  function saveAndAddAnother() {
    if (!validateForm()) return
  
    stockMovements.value.unshift({
      id: getNextId(),
      product: form.product,
      movementType: form.movementType as MovementType,
      quantityDelta: Number(form.quantityDelta),
      beforeStock: Number(form.beforeStock),
      afterStock: Number(form.afterStock),
      note: form.note,
      refModel: form.refModel,
      refId: form.refId,
      createdAt: buildCreatedAt(),
      createdBy: form.createdBy,
    })
  
    resetForm()
  }
  
  function saveAndContinueEditing() {
    if (!validateForm()) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = stockMovements.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        stockMovements.value[index] = {
          ...stockMovements.value[index],
          product: form.product,
          movementType: form.movementType as MovementType,
          quantityDelta: Number(form.quantityDelta),
          beforeStock: Number(form.beforeStock),
          afterStock: Number(form.afterStock),
          note: form.note,
          refModel: form.refModel,
          refId: form.refId,
          createdAt: buildCreatedAt(),
          createdBy: form.createdBy,
        }
      }
    } else {
      const nextId = getNextId()
  
      stockMovements.value.unshift({
        id: nextId,
        product: form.product,
        movementType: form.movementType as MovementType,
        quantityDelta: Number(form.quantityDelta),
        beforeStock: Number(form.beforeStock),
        afterStock: Number(form.afterStock),
        note: form.note,
        refModel: form.refModel,
        refId: form.refId,
        createdAt: buildCreatedAt(),
        createdBy: form.createdBy,
      })
  
      editingId.value = nextId
      isEditMode.value = true
    }
  }
  
  function deleteItem(id: number) {
    const confirmed = window.confirm('Delete this stock movement?')
    if (!confirmed) return
  
    stockMovements.value = stockMovements.value.filter((item) => item.id !== id)
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
  }
  
  function handleBulkAction() {
    if (!bulkAction.value) {
      alert('Please select an action first.')
      return
    }
  
    if (selectedIds.value.length === 0) {
      alert('Please select at least one stock movement.')
      return
    }
  
    if (bulkAction.value === 'delete') {
      const confirmed = window.confirm(
        `Delete ${selectedIds.value.length} selected stock movement(s)?`
      )
      if (!confirmed) return
  
      stockMovements.value = stockMovements.value.filter(
        (item) => !selectedIds.value.includes(item.id)
      )
    }
  
    selectedIds.value = []
    bulkAction.value = ''
  }
  
  function formatDateTime(value: string) {
    if (!value) return '-'
    const date = new Date(value)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
  
  function formatDelta(value: number) {
    if (value > 0) return `+${value}`
    return `${value}`
  }
  
  function typeClass(type: MovementType) {
    return {
      sale: type === 'Sale',
      purchase: type === 'Purchase',
      adjustment: type === 'Adjustment',
      return: type === 'Sale Return',
    }
  }
  </script>
  
  <style scoped>
  .stock-movements-page {
    min-height: 100%;
    padding: 24px;
    background:
      radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 22%),
      #f5f7fb;
  }
  
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid #e6ebf2;
    border-radius: 24px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    flex-wrap: wrap;
  }
  
  .page-header__left {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  
  .page-title {
    margin: 0 0 8px;
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
  }
  
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 0.95rem;
    color: #64748b;
  }
  
  .breadcrumb .active,
  .breadcrumb span:nth-child(1),
  .breadcrumb span:nth-child(3) {
    color: #1677ff;
    font-weight: 700;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .summary-card {
    background: #fff;
    border: 1px solid #e8edf5;
    border-radius: 22px;
    padding: 18px 20px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
  }
  
  .summary-label {
    font-size: 0.9rem;
    color: #64748b;
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .summary-value {
    font-size: 1.7rem;
    font-weight: 800;
    color: #0f172a;
  }
  
  .toolbar-card,
  .table-card {
    background: #fff;
    border: 1px solid #e8edf5;
    border-radius: 24px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
  }
  
  .toolbar-card {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .toolbar-top,
  .toolbar-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }
  
  .toolbar-bottom {
    margin-top: 16px;
  }
  
  .toolbar-search {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    border: 1px solid #d8e1ec;
    border-radius: 14px;
    background: #fff;
    font-size: 0.98rem;
    color: #0f172a;
    outline: none;
    transition: 0.2s ease;
  }
  
  .form-input,
  .form-select {
    min-height: 50px;
    padding: 0 15px;
  }
  
  .form-textarea {
    min-height: 140px;
    padding: 12px 15px;
    resize: vertical;
  }
  
  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: #1677ff;
    box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.08);
  }
  
  .toolbar-search .form-input {
    width: 280px;
  }
  
  .toolbar-search .form-select {
    width: 200px;
  }
  
  .bulk-select {
    width: 220px;
  }
  
  .selection-text {
    color: #475569;
    font-weight: 600;
  }
  
  .btn {
    min-height: 48px;
    border: none;
    border-radius: 14px;
    padding: 0 18px;
    font-size: 0.96rem;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: 0.2s ease;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  }
  
  .btn:hover {
    transform: translateY(-1px);
  }
  
  .btn-sm {
    min-height: 44px;
    padding: 0 16px;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1677ff, #0f67ea);
    color: #fff;
  }
  
  .btn-success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
  }
  
  .btn-info {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    color: #fff;
  }
  
  .btn-light {
    background: #f8fafc;
    color: #334155;
    border: 1px solid #e2e8f0;
  }
  
  .btn-icon {
    font-size: 1rem;
    line-height: 1;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .modern-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 1280px;
  }
  
  .modern-table thead th {
    text-align: left;
    padding: 18px 16px;
    font-size: 0.95rem;
    font-weight: 800;
    color: #1677ff;
    border-bottom: 1px solid #e8edf5;
    background: #fbfcfe;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  .modern-table tbody td {
    padding: 16px;
    font-size: 0.95rem;
    color: #0f172a;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
  }
  
  .modern-table tbody tr:hover {
    background: #f8fbff;
  }
  
  .checkbox-col {
    width: 52px;
  }
  
  .action-col {
    width: 150px;
  }
  
  .id-cell {
    font-weight: 800;
    color: #1677ff;
  }
  
  .product-name {
    font-weight: 700;
    color: #0f172a;
  }
  
  .ref-cell small {
    display: block;
    margin-top: 4px;
    color: #64748b;
  }
  
  .type-badge,
  .reason-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
  }
  
  .type-badge.sale {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
  }
  
  .type-badge.purchase {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
  }
  
  .type-badge.adjustment {
    background: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
  }
  
  .type-badge.return {
    background: rgba(245, 158, 11, 0.12);
    color: #b45309;
  }
  
  .qty-delta {
    font-weight: 800;
  }
  
  .qty-delta.positive {
    color: #15803d;
  }
  
  .qty-delta.negative {
    color: #b91c1c;
  }
  
  .qty-delta.neutral {
    color: #475569;
  }
  
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .icon-btn {
    min-height: 34px;
    border: none;
    border-radius: 10px;
    padding: 0 12px;
    font-size: 0.84rem;
    font-weight: 800;
    cursor: pointer;
  }
  
  .icon-btn.edit {
    background: rgba(22, 119, 255, 0.12);
    color: #1677ff;
  }
  
  .icon-btn.delete {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
  }
  
  .table-footer {
    padding: 18px 16px;
    font-size: 0.98rem;
    font-weight: 700;
    color: #475569;
  }
  
  .empty-cell {
    text-align: center;
    color: #64748b;
    padding: 36px !important;
  }
  
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(5px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .modal-card {
    width: 100%;
    max-width: 1200px;
    background: #fff;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 25px 80px rgba(15, 23, 42, 0.25);
  }
  
  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 24px;
    border-bottom: 1px solid #eef2f7;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #0f172a;
  }
  
  .modal-header p {
    margin: 6px 0 0;
    color: #64748b;
  }
  
  .close-btn {
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 14px;
    background: #f3f6fb;
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .modal-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 20px;
    align-items: start;
  }
  
  .form-panel {
    background: #fff;
    border: 1px solid #e8edf5;
    border-radius: 22px;
    padding: 20px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-group--full {
    grid-column: span 2;
  }
  
  .form-group label {
    font-size: 0.94rem;
    font-weight: 700;
    color: #334155;
  }
  
  .required {
    color: #ef4444;
  }
  
  .action-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .action-panel__card,
  .preview-card {
    background: #fff;
    border: 1px solid #e8edf5;
    border-radius: 22px;
    padding: 16px;
  }
  
  .full-btn {
    width: 100%;
    margin-bottom: 12px;
  }
  
  .full-btn:last-child {
    margin-bottom: 0;
  }
  
  .preview-title {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 12px;
  }
  
  .preview-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #eef2f7;
    color: #475569;
  }
  
  .preview-row:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 1100px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  
    .modal-layout {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .stock-movements-page {
      padding: 16px;
    }
  
    .page-title {
      font-size: 1.7rem;
    }
  
    .summary-grid {
      grid-template-columns: 1fr;
    }
  
    .toolbar-top,
    .toolbar-bottom,
    .toolbar-search {
      flex-direction: column;
      align-items: stretch;
    }
  
    .toolbar-search .form-input,
    .toolbar-search .form-select,
    .bulk-select,
    .btn {
      width: 100%;
    }
  
    .form-grid {
      grid-template-columns: 1fr;
    }
  
    .form-group--full {
      grid-column: span 1;
    }
  }
  </style>