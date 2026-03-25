<template>
    <div class="page">
      <!-- Header -->
      <section class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">Inventory counts</h1>
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Pos</span>
            <span>›</span>
            <span class="active">Inventory counts</span>
          </div>
        </div>
  
        <button class="btn btn-success" @click="openAddModal">
          <span>＋</span>
          <span>Add inventory count</span>
        </button>
      </section>
  
      <!-- Toolbar -->
      <section class="toolbar-card">
        <div class="toolbar-row">
          <input
            v-model="search"
            type="text"
            class="form-input search-input"
            placeholder="Search title..."
          />
  
          <select v-model="statusFilter" class="form-select filter-select">
            <option value="">status</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
  
          <button class="btn btn-primary" @click="applyFilters">Search</button>
        </div>
  
        <div class="toolbar-row toolbar-row--secondary">
          <select v-model="bulkAction" class="form-select action-select">
            <option value="">---------</option>
            <option value="delete">Delete selected</option>
            <option value="completed">Mark as completed</option>
            <option value="draft">Mark as draft</option>
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
                <th>Title</th>
                <th>Counted at</th>
                <th>Counted by</th>
                <th>Status</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredItems.length === 0">
                <td colspan="7" class="empty-cell">No inventory counts found.</td>
              </tr>
  
              <tr v-for="item in filteredItems" :key="item.id">
                <td>
                  <input type="checkbox" :value="item.id" v-model="selectedIds" />
                </td>
                <td class="id-text">{{ item.id }}</td>
                <td class="name-text">{{ item.title }}</td>
                <td>{{ formatDateTime(item.countedAt) }}</td>
                <td>{{ item.countedBy || '-' }}</td>
                <td>
                  <span
                    class="status-badge"
                    :class="{
                      draft: item.status === 'Draft',
                      completed: item.status === 'Completed',
                      cancelled: item.status === 'Cancelled',
                    }"
                  >
                    {{ item.status }}
                  </span>
                </td>
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
          {{ filteredItems.length }} inventory counts
        </div>
      </section>
  
      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div>
              <h2>{{ isEditMode ? 'Edit inventory count' : 'Add inventory count' }}</h2>
              <p>
                {{
                  isEditMode
                    ? 'Update inventory count information'
                    : 'Create a new inventory count'
                }}
              </p>
            </div>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <div class="modal-body">
            <div class="modal-layout">
              <div class="form-card">
                <div class="form-row">
                  <label>Title <span class="required">*</span></label>
                  <div class="form-control">
                    <input
                      v-model="form.title"
                      type="text"
                      class="form-input"
                      placeholder="Enter title"
                    />
                  </div>
                </div>
  
                <div class="form-row form-row--top">
                  <label>Note</label>
                  <div class="form-control">
                    <textarea
                      v-model="form.note"
                      class="form-textarea"
                      rows="6"
                      placeholder="Write note here..."
                    />
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Counted at <span class="required">*</span></label>
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
  
                <div class="form-row">
                  <label>Counted by</label>
                  <div class="form-control">
                    <input
                      v-model="form.countedBy"
                      type="text"
                      class="form-input"
                      placeholder="Admin / Owner"
                    />
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Status <span class="required">*</span></label>
                  <div class="form-control">
                    <select v-model="form.status" class="form-select">
                      <option value="Draft">Draft</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
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
  
  type InventoryCount = {
    id: number
    title: string
    note: string
    countedAt: string
    countedBy: string
    status: 'Draft' | 'Completed' | 'Cancelled'
  }
  
  const inventoryCounts = ref<InventoryCount[]>([
    {
      id: 2,
      title: 'Qwerty 01',
      note: 'Monthly stock check for beverages.',
      countedAt: '2026-03-10T17:31',
      countedBy: 'admin',
      status: 'Draft',
    },
    {
      id: 1,
      title: 'RedBull',
      note: 'Opening stock verification.',
      countedAt: '2026-03-02T12:56',
      countedBy: 'admin',
      status: 'Completed',
    },
  ])
  
  const search = ref('')
  const appliedSearch = ref('')
  const statusFilter = ref('')
  const appliedStatusFilter = ref('')
  const bulkAction = ref('')
  const selectedIds = ref<number[]>([])
  
  const showModal = ref(false)
  const isEditMode = ref(false)
  const editingId = ref<number | null>(null)
  
  const form = reactive({
    title: '',
    note: '',
    date: '',
    time: '',
    countedBy: 'admin',
    status: 'Draft' as 'Draft' | 'Completed' | 'Cancelled',
  })
  
  const filteredItems = computed(() => {
    let results = [...inventoryCounts.value]
  
    const keyword = appliedSearch.value.trim().toLowerCase()
    if (keyword) {
      results = results.filter((item) =>
        item.title.toLowerCase().includes(keyword)
      )
    }
  
    if (appliedStatusFilter.value) {
      results = results.filter((item) => item.status === appliedStatusFilter.value)
    }
  
    return results
  })
  
  const isAllSelected = computed(() => {
    return (
      filteredItems.value.length > 0 &&
      filteredItems.value.every((item) => selectedIds.value.includes(item.id))
    )
  })
  
  function applyFilters() {
    appliedSearch.value = search.value
    appliedStatusFilter.value = statusFilter.value
    selectedIds.value = []
  }
  
  function toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    selectedIds.value = checked ? filteredItems.value.map((item) => item.id) : []
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
  
  function resetForm() {
    form.title = ''
    form.note = ''
    form.date = getNowDate()
    form.time = getNowTime()
    form.countedBy = 'admin'
    form.status = 'Draft'
  }
  
  function openAddModal() {
    resetForm()
    isEditMode.value = false
    editingId.value = null
    showModal.value = true
  }
  
  function openEditModal(item: InventoryCount) {
    const [datePart, timePartRaw] = item.countedAt.split('T')
    const timePart = timePartRaw ? timePartRaw.slice(0, 5) : '00:00'
  
    form.title = item.title
    form.note = item.note
    form.date = datePart || getNowDate()
    form.time = timePart
    form.countedBy = item.countedBy
    form.status = item.status
  
    isEditMode.value = true
    editingId.value = item.id
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
  }
  
  function validateForm() {
    if (!form.title.trim()) {
      alert('Title is required.')
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
  
    if (!form.status) {
      alert('Status is required.')
      return false
    }
  
    return true
  }
  
  function buildCountedAt() {
    return `${form.date}T${form.time}`
  }
  
  function saveItem() {
    if (!validateForm()) return
  
    const countedAt = buildCountedAt()
  
    if (isEditMode.value && editingId.value !== null) {
      const index = inventoryCounts.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        inventoryCounts.value[index] = {
          ...inventoryCounts.value[index],
          title: form.title,
          note: form.note,
          countedAt,
          countedBy: form.countedBy,
          status: form.status,
        }
      }
    } else {
      const nextId =
        inventoryCounts.value.length > 0
          ? Math.max(...inventoryCounts.value.map((item) => item.id)) + 1
          : 1
  
      inventoryCounts.value.unshift({
        id: nextId,
        title: form.title,
        note: form.note,
        countedAt,
        countedBy: form.countedBy,
        status: form.status,
      })
    }
  
    closeModal()
    resetForm()
  }
  
  function saveAndAddAnother() {
    if (!validateForm()) return
  
    const nextId =
      inventoryCounts.value.length > 0
        ? Math.max(...inventoryCounts.value.map((item) => item.id)) + 1
        : 1
  
    inventoryCounts.value.unshift({
      id: nextId,
      title: form.title,
      note: form.note,
      countedAt: buildCountedAt(),
      countedBy: form.countedBy,
      status: form.status,
    })
  
    resetForm()
  }
  
  function saveAndContinueEditing() {
    if (!validateForm()) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = inventoryCounts.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        inventoryCounts.value[index] = {
          ...inventoryCounts.value[index],
          title: form.title,
          note: form.note,
          countedAt: buildCountedAt(),
          countedBy: form.countedBy,
          status: form.status,
        }
      }
    } else {
      const nextId =
        inventoryCounts.value.length > 0
          ? Math.max(...inventoryCounts.value.map((item) => item.id)) + 1
          : 1
  
      inventoryCounts.value.unshift({
        id: nextId,
        title: form.title,
        note: form.note,
        countedAt: buildCountedAt(),
        countedBy: form.countedBy,
        status: form.status,
      })
  
      editingId.value = nextId
      isEditMode.value = true
    }
  }
  
  function deleteItem(id: number) {
    const confirmed = window.confirm('Delete this inventory count?')
    if (!confirmed) return
  
    inventoryCounts.value = inventoryCounts.value.filter((item) => item.id !== id)
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
  }
  
  function handleBulkAction() {
    if (!bulkAction.value) {
      alert('Please select an action first.')
      return
    }
  
    if (selectedIds.value.length === 0) {
      alert('Please select at least one inventory count.')
      return
    }
  
    if (bulkAction.value === 'delete') {
      const confirmed = window.confirm(
        `Delete ${selectedIds.value.length} selected inventory count(s)?`
      )
      if (!confirmed) return
  
      inventoryCounts.value = inventoryCounts.value.filter(
        (item) => !selectedIds.value.includes(item.id)
      )
    }
  
    if (bulkAction.value === 'completed') {
      inventoryCounts.value = inventoryCounts.value.map((item) =>
        selectedIds.value.includes(item.id)
          ? { ...item, status: 'Completed' }
          : item
      )
    }
  
    if (bulkAction.value === 'draft') {
      inventoryCounts.value = inventoryCounts.value.map((item) =>
        selectedIds.value.includes(item.id)
          ? { ...item, status: 'Draft' }
          : item
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
    min-height: 160px;
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
  
  .filter-select {
    width: 220px;
  }
  
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
    min-width: 980px;
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
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
  }
  
  .status-badge.draft {
    background: rgba(245, 158, 11, 0.12);
    color: #b45309;
  }
  
  .status-badge.completed {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
  }
  
  .status-badge.cancelled {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
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