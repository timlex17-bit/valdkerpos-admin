<template>
    <div class="page">
      <!-- Header -->
      <section class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">Stock adjustments</h1>
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Pos</span>
            <span>›</span>
            <span class="active">Stock adjustments</span>
          </div>
        </div>
  
        <button class="btn btn-success" @click="openAddModal">
          <span>＋</span>
          <span>Add stock adjustment</span>
        </button>
      </section>
  
      <!-- Toolbar -->
      <section class="toolbar-card">
        <div class="toolbar-row">
          <input
            v-model="search"
            type="text"
            class="form-input search-input"
            placeholder="Search product..."
          />
  
          <select v-model="reasonFilter" class="form-select filter-select">
            <option value="">reason</option>
            <option value="LOST">LOST</option>
            <option value="DAMAGED">DAMAGED</option>
            <option value="OTHER">OTHER</option>
          </select>
  
          <button class="btn btn-primary" @click="applyFilters">Search</button>
        </div>
  
        <div class="toolbar-row toolbar-row--secondary">
          <select v-model="bulkAction" class="form-select action-select">
            <option value="">---------</option>
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
          <table class="data-table">
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
                <th>Old stock</th>
                <th>New stock</th>
                <th>Reason</th>
                <th>Adjusted by</th>
                <th>Adjusted at</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredItems.length === 0">
                <td colspan="9" class="empty-cell">No stock adjustments found.</td>
              </tr>
  
              <tr v-for="item in filteredItems" :key="item.id">
                <td>
                  <input type="checkbox" :value="item.id" v-model="selectedIds" />
                </td>
                <td class="id-text">{{ item.id }}</td>
                <td class="name-text">{{ item.product }}</td>
                <td>{{ item.oldStock }}</td>
                <td>{{ item.newStock }}</td>
                <td>
                  <span class="reason-badge" :class="reasonClass(item.reason)">
                    {{ item.reason }}
                  </span>
                </td>
                <td>{{ item.adjustedBy || '-' }}</td>
                <td>{{ formatDateTime(item.adjustedAt) }}</td>
                <td>
                  <div class="actions">
                    <button class="btn-action edit" @click="openEditModal(item)">Edit</button>
                    <button class="btn-action delete" @click="deleteItem(item.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div class="table-footer">
          {{ filteredItems.length }} stock adjustments
        </div>
      </section>
  
      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div>
              <h2>{{ isEditMode ? 'Edit stock adjustment' : 'Add stock adjustment' }}</h2>
              <p>
                {{
                  isEditMode
                    ? 'Update stock adjustment information'
                    : 'Create a new stock adjustment'
                }}
              </p>
            </div>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <div class="modal-body">
            <div class="modal-layout">
              <div class="form-card">
                <div class="form-row">
                  <label>Product <span class="required">*</span></label>
                  <div class="form-control">
                    <select v-model="form.product" class="form-select">
                      <option value="">Select product</option>
                      <option v-for="product in productOptions" :key="product" :value="product">
                        {{ product }}
                      </option>
                    </select>
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Old stock <span class="required">*</span></label>
                  <div class="form-control">
                    <input
                      v-model.number="form.oldStock"
                      type="number"
                      min="0"
                      class="form-input"
                      placeholder="0"
                    />
                  </div>
                </div>
  
                <div class="form-row">
                  <label>New stock <span class="required">*</span></label>
                  <div class="form-control">
                    <input
                      v-model.number="form.newStock"
                      type="number"
                      min="0"
                      class="form-input"
                      placeholder="0"
                    />
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Reason <span class="required">*</span></label>
                  <div class="form-control">
                    <select v-model="form.reason" class="form-select">
                      <option value="">Select reason</option>
                      <option value="LOST">LOST</option>
                      <option value="DAMAGED">DAMAGED</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                </div>
  
                <div class="form-row form-row--top">
                  <label>Note</label>
                  <div class="form-control">
                    <textarea
                      v-model="form.note"
                      rows="6"
                      class="form-textarea"
                      placeholder="Write note here..."
                    />
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Adjusted by</label>
                  <div class="form-control">
                    <input
                      v-model="form.adjustedBy"
                      type="text"
                      class="form-input"
                      placeholder="Admin / Owner"
                    />
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Adjusted at <span class="required">*</span></label>
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
  
  type ReasonType = 'LOST' | 'DAMAGED' | 'OTHER'
  
  type StockAdjustment = {
    id: number
    product: string
    oldStock: number
    newStock: number
    reason: ReasonType
    note: string
    adjustedBy: string
    adjustedAt: string
  }
  
  const productOptions = ref<string[]>([
    'Oli Yamaha Lube (6937467600037)',
    'Pizza Sosis (74384393934393)',
    'RedBull Can (RB-001)',
    'Coca Cola 1L (CC-1L)',
  ])
  
  const stockAdjustments = ref<StockAdjustment[]>([
    {
      id: 3,
      product: 'Oli Yamaha Lube (6937467600037)',
      oldStock: 450,
      newStock: 500,
      reason: 'OTHER',
      note: 'Manual correction after stock review.',
      adjustedBy: 'admin',
      adjustedAt: '2026-03-18T22:38',
    },
    {
      id: 2,
      product: 'Pizza Sosis (74384393934393)',
      oldStock: 29,
      newStock: 78,
      reason: 'LOST',
      note: 'Recount result updated.',
      adjustedBy: 'admin',
      adjustedAt: '2026-03-10T19:16',
    },
    {
      id: 1,
      product: 'Pizza Sosis (74384393934393)',
      oldStock: 16,
      newStock: 50,
      reason: 'LOST',
      note: 'Initial correction.',
      adjustedBy: 'admin',
      adjustedAt: '2026-03-09T11:23',
    },
  ])
  
  const search = ref('')
  const appliedSearch = ref('')
  const reasonFilter = ref('')
  const appliedReasonFilter = ref('')
  const bulkAction = ref('')
  const selectedIds = ref<number[]>([])
  
  const showModal = ref(false)
  const isEditMode = ref(false)
  const editingId = ref<number | null>(null)
  
  const form = reactive({
    product: '',
    oldStock: 0,
    newStock: 0,
    reason: '' as '' | ReasonType,
    note: '',
    adjustedBy: 'admin',
    date: '',
    time: '',
  })
  
  const filteredItems = computed(() => {
    let results = [...stockAdjustments.value]
  
    const keyword = appliedSearch.value.trim().toLowerCase()
    if (keyword) {
      results = results.filter((item) =>
        item.product.toLowerCase().includes(keyword)
      )
    }
  
    if (appliedReasonFilter.value) {
      results = results.filter((item) => item.reason === appliedReasonFilter.value)
    }
  
    return results
  })
  
  const isAllSelected = computed(() => {
    return (
      filteredItems.value.length > 0 &&
      filteredItems.value.every((item) => selectedIds.value.includes(item.id))
    )
  })
  
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
    appliedReasonFilter.value = reasonFilter.value
    selectedIds.value = []
  }
  
  function toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    selectedIds.value = checked ? filteredItems.value.map((item) => item.id) : []
  }
  
  function resetForm() {
    form.product = ''
    form.oldStock = 0
    form.newStock = 0
    form.reason = ''
    form.note = ''
    form.adjustedBy = 'admin'
    form.date = getNowDate()
    form.time = getNowTime()
  }
  
  function openAddModal() {
    resetForm()
    isEditMode.value = false
    editingId.value = null
    showModal.value = true
  }
  
  function openEditModal(item: StockAdjustment) {
    const [datePart, timePartRaw] = item.adjustedAt.split('T')
    const timePart = timePartRaw ? timePartRaw.slice(0, 5) : '00:00'
  
    form.product = item.product
    form.oldStock = item.oldStock
    form.newStock = item.newStock
    form.reason = item.reason
    form.note = item.note
    form.adjustedBy = item.adjustedBy
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
  
    if (form.oldStock < 0) {
      alert('Old stock must be 0 or greater.')
      return false
    }
  
    if (form.newStock < 0) {
      alert('New stock must be 0 or greater.')
      return false
    }
  
    if (!form.reason) {
      alert('Reason is required.')
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
  
  function buildAdjustedAt() {
    return `${form.date}T${form.time}`
  }
  
  function saveItem() {
    if (!validateForm()) return
  
    const payload: StockAdjustment = {
      id: editingId.value ?? getNextId(),
      product: form.product,
      oldStock: Number(form.oldStock),
      newStock: Number(form.newStock),
      reason: form.reason as ReasonType,
      note: form.note,
      adjustedBy: form.adjustedBy,
      adjustedAt: buildAdjustedAt(),
    }
  
    if (isEditMode.value && editingId.value !== null) {
      const index = stockAdjustments.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        stockAdjustments.value[index] = payload
      }
    } else {
      stockAdjustments.value.unshift(payload)
    }
  
    closeModal()
    resetForm()
  }
  
  function saveAndAddAnother() {
    if (!validateForm()) return
  
    stockAdjustments.value.unshift({
      id: getNextId(),
      product: form.product,
      oldStock: Number(form.oldStock),
      newStock: Number(form.newStock),
      reason: form.reason as ReasonType,
      note: form.note,
      adjustedBy: form.adjustedBy,
      adjustedAt: buildAdjustedAt(),
    })
  
    resetForm()
  }
  
  function saveAndContinueEditing() {
    if (!validateForm()) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = stockAdjustments.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        stockAdjustments.value[index] = {
          ...stockAdjustments.value[index],
          product: form.product,
          oldStock: Number(form.oldStock),
          newStock: Number(form.newStock),
          reason: form.reason as ReasonType,
          note: form.note,
          adjustedBy: form.adjustedBy,
          adjustedAt: buildAdjustedAt(),
        }
      }
    } else {
      const nextId = getNextId()
  
      stockAdjustments.value.unshift({
        id: nextId,
        product: form.product,
        oldStock: Number(form.oldStock),
        newStock: Number(form.newStock),
        reason: form.reason as ReasonType,
        note: form.note,
        adjustedBy: form.adjustedBy,
        adjustedAt: buildAdjustedAt(),
      })
  
      editingId.value = nextId
      isEditMode.value = true
    }
  }
  
  function getNextId() {
    return stockAdjustments.value.length > 0
      ? Math.max(...stockAdjustments.value.map((item) => item.id)) + 1
      : 1
  }
  
  function deleteItem(id: number) {
    const confirmed = window.confirm('Delete this stock adjustment?')
    if (!confirmed) return
  
    stockAdjustments.value = stockAdjustments.value.filter((item) => item.id !== id)
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
  }
  
  function handleBulkAction() {
    if (!bulkAction.value) {
      alert('Please select an action first.')
      return
    }
  
    if (selectedIds.value.length === 0) {
      alert('Please select at least one stock adjustment.')
      return
    }
  
    if (bulkAction.value === 'delete') {
      const confirmed = window.confirm(
        `Delete ${selectedIds.value.length} selected stock adjustment(s)?`
      )
      if (!confirmed) return
  
      stockAdjustments.value = stockAdjustments.value.filter(
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
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
  
  function reasonClass(reason: ReasonType) {
    return {
      lost: reason === 'LOST',
      damaged: reason === 'DAMAGED',
      other: reason === 'OTHER',
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
    border-radius: 18px;
    padding: 20px 22px;
    margin-bottom: 20px;
    flex-wrap: wrap;
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
    font-weight: 700;
    color: #1f2937;
    padding-right: 18px;
    border-right: 1px solid #e5e7eb;
  }
  
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 1rem;
    color: #6b7280;
  }
  
  .breadcrumb .active,
  .breadcrumb span:nth-child(1),
  .breadcrumb span:nth-child(3) {
    color: #1677ff;
    font-weight: 600;
  }
  
  .toolbar-card,
  .table-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  }
  
  .toolbar-card {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .toolbar-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .toolbar-row--secondary {
    margin-top: 18px;
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 0 14px;
    font-size: 0.98rem;
    color: #111827;
    background: #fff;
    outline: none;
    transition: 0.2s ease;
  }
  
  .form-input,
  .form-select {
    min-height: 48px;
  }
  
  .form-textarea {
    min-height: 180px;
    padding-top: 12px;
    padding-bottom: 12px;
    resize: vertical;
  }
  
  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }
  
  .search-input {
    width: 280px;
  }
  
  .filter-select,
  .action-select {
    width: 220px;
  }
  
  .selection-text {
    font-size: 0.98rem;
    color: #374151;
    font-weight: 600;
  }
  
  .btn {
    min-height: 46px;
    border: none;
    border-radius: 10px;
    padding: 0 18px;
    font-size: 0.98rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: 0.2s ease;
  }
  
  .btn-sm {
    min-height: 42px;
    padding: 0 16px;
  }
  
  .btn-primary {
    background: #1677ff;
    color: #fff;
  }
  
  .btn-primary:hover {
    background: #0f67ea;
  }
  
  .btn-success {
    background: #28a745;
    color: #fff;
  }
  
  .btn-success:hover {
    background: #22933d;
  }
  
  .btn-info {
    background: #17a2b8;
    color: #fff;
  }
  
  .btn-info:hover {
    background: #13899b;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1180px;
  }
  
  .data-table thead th {
    text-align: left;
    padding: 18px 16px;
    font-size: 1rem;
    font-weight: 800;
    color: #1677ff;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .data-table tbody td {
    padding: 16px;
    font-size: 1rem;
    color: #1f2937;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
  }
  
  .data-table tbody tr:hover {
    background: #f9fbff;
  }
  
  .checkbox-col {
    width: 56px;
  }
  
  .action-col {
    width: 170px;
  }
  
  .id-text {
    color: #1677ff;
    font-weight: 800;
  }
  
  .name-text {
    font-weight: 700;
  }
  
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .btn-action {
    min-height: 36px;
    border: none;
    border-radius: 10px;
    padding: 0 12px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
  }
  
  .btn-action.edit {
    background: rgba(22, 119, 255, 0.12);
    color: #1677ff;
  }
  
  .btn-action.delete {
    background: rgba(220, 38, 38, 0.12);
    color: #dc2626;
  }
  
  .reason-badge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
  }
  
  .reason-badge.lost {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
  }
  
  .reason-badge.damaged {
    background: rgba(245, 158, 11, 0.12);
    color: #b45309;
  }
  
  .reason-badge.other {
    background: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
  }
  
  .table-footer {
    padding: 18px 16px;
    font-size: 1rem;
    font-weight: 700;
    color: #374151;
  }
  
  .empty-cell {
    text-align: center;
    color: #6b7280;
    padding: 30px !important;
  }
  
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .modal-container {
    width: 100%;
    max-width: 1150px;
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
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
    border-radius: 16px;
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
      font-size: 1.7rem;
      padding-right: 0;
      border-right: none;
    }
  
    .page-header__left {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  
    .search-input,
    .filter-select,
    .action-select {
      width: 100%;
    }
  
    .btn {
      width: 100%;
    }
  
    .form-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  
    .datetime-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>