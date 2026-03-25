<template>
    <div class="page">
      <section class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">Units</h1>
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Pos</span>
            <span>›</span>
            <span class="active">Units</span>
          </div>
        </div>
  
        <button class="btn btn-success" @click="openAddModal">
          <span>＋</span>
          <span>Add unit</span>
        </button>
      </section>
  
      <section class="toolbar-card">
        <div class="toolbar-row">
          <input
            v-model="search"
            type="text"
            class="form-input search-input"
            placeholder="Search unit name..."
          />
          <button class="btn btn-primary" @click="applySearch">Search</button>
        </div>
  
        <div class="toolbar-row toolbar-row--secondary">
          <select v-model="bulkAction" class="form-select action-select">
            <option value="">---------</option>
            <option value="delete">Delete selected</option>
          </select>
  
          <button class="btn btn-primary btn-sm" @click="handleBulkAction">Go</button>
  
          <span class="selection-text">
            {{ selectedIds.length }} of {{ filteredUnits.length }} selected
          </span>
        </div>
      </section>
  
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
                <th>Name</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredUnits.length === 0">
                <td colspan="4" class="empty-cell">No units found.</td>
              </tr>
  
              <tr v-for="unit in filteredUnits" :key="unit.id">
                <td>
                  <input type="checkbox" :value="unit.id" v-model="selectedIds" />
                </td>
                <td class="id-text">{{ unit.id }}</td>
                <td class="name-text">{{ unit.name }}</td>
                <td>
                  <div class="actions">
                    <button class="btn-action edit" @click="openEditModal(unit)">Edit</button>
                    <button class="btn-action delete" @click="deleteUnit(unit.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div class="table-footer">
          {{ filteredUnits.length }} units
        </div>
      </section>
  
      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div>
              <h2>{{ isEditMode ? 'Edit unit' : 'Add unit' }}</h2>
              <p>
                {{ isEditMode ? 'Update unit information' : 'Create a new unit' }}
              </p>
            </div>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <div class="modal-body">
            <div class="modal-layout">
              <div class="form-card">
                <div class="form-row">
                  <label>Name <span class="required">*</span></label>
                  <div class="form-control">
                    <input
                      v-model="form.name"
                      type="text"
                      class="form-input"
                      placeholder="Enter unit name"
                    />
                  </div>
                </div>
              </div>
  
              <div class="side-actions">
                <button class="btn btn-success full-btn" @click="saveUnit">Save</button>
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
  
  type Unit = {
    id: number
    name: string
  }
  
  const units = ref<Unit[]>([
    { id: 19, name: 'LTR' },
    { id: 18, name: 'BOX' },
    { id: 17, name: 'KG' },
    { id: 16, name: 'PCS' },
    { id: 8, name: 'ROLL' },
    { id: 7, name: 'PACK' },
  ])
  
  const search = ref('')
  const appliedSearch = ref('')
  const bulkAction = ref('')
  const selectedIds = ref<number[]>([])
  
  const showModal = ref(false)
  const isEditMode = ref(false)
  const editingId = ref<number | null>(null)
  
  const form = reactive({
    name: '',
  })
  
  const filteredUnits = computed(() => {
    const keyword = appliedSearch.value.trim().toLowerCase()
    if (!keyword) return units.value
    return units.value.filter((item) =>
      item.name.toLowerCase().includes(keyword)
    )
  })
  
  const isAllSelected = computed(() => {
    return (
      filteredUnits.value.length > 0 &&
      filteredUnits.value.every((item) => selectedIds.value.includes(item.id))
    )
  })
  
  function applySearch() {
    appliedSearch.value = search.value
    selectedIds.value = []
  }
  
  function toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    selectedIds.value = checked ? filteredUnits.value.map((item) => item.id) : []
  }
  
  function resetForm() {
    form.name = ''
  }
  
  function openAddModal() {
    resetForm()
    isEditMode.value = false
    editingId.value = null
    showModal.value = true
  }
  
  function openEditModal(unit: Unit) {
    form.name = unit.name
    isEditMode.value = true
    editingId.value = unit.id
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
  }
  
  function validateForm() {
    if (!form.name.trim()) {
      alert('Name is required.')
      return false
    }
    return true
  }
  
  function saveUnit() {
    if (!validateForm()) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = units.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        units.value[index] = {
          ...units.value[index],
          name: form.name,
        }
      }
    } else {
      const nextId =
        units.value.length > 0
          ? Math.max(...units.value.map((item) => item.id)) + 1
          : 1
  
      units.value.unshift({
        id: nextId,
        name: form.name,
      })
    }
  
    closeModal()
    resetForm()
  }
  
  function saveAndAddAnother() {
    if (!validateForm()) return
  
    const nextId =
      units.value.length > 0
        ? Math.max(...units.value.map((item) => item.id)) + 1
        : 1
  
    units.value.unshift({
      id: nextId,
      name: form.name,
    })
  
    resetForm()
  }
  
  function saveAndContinueEditing() {
    if (!validateForm()) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = units.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        units.value[index] = {
          ...units.value[index],
          name: form.name,
        }
      }
    } else {
      const nextId =
        units.value.length > 0
          ? Math.max(...units.value.map((item) => item.id)) + 1
          : 1
  
      units.value.unshift({
        id: nextId,
        name: form.name,
      })
  
      editingId.value = nextId
      isEditMode.value = true
    }
  }
  
  function deleteUnit(id: number) {
    const confirmed = window.confirm('Delete this unit?')
    if (!confirmed) return
  
    units.value = units.value.filter((item) => item.id !== id)
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
  }
  
  function handleBulkAction() {
    if (!bulkAction.value) {
      alert('Please select an action first.')
      return
    }
  
    if (selectedIds.value.length === 0) {
      alert('Please select at least one unit.')
      return
    }
  
    if (bulkAction.value === 'delete') {
      const confirmed = window.confirm(
        `Delete ${selectedIds.value.length} selected unit(s)?`
      )
      if (!confirmed) return
  
      units.value = units.value.filter((item) => !selectedIds.value.includes(item.id))
      selectedIds.value = []
      bulkAction.value = ''
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
  .form-select {
    min-height: 48px;
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
  
  .form-input:focus,
  .form-select:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }
  
  .search-input {
    width: 280px;
  }
  
  .action-select {
    width: 190px;
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
    min-width: 700px;
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
    max-width: 1100px;
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
  }
  
  .form-row label {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .form-control {
    width: 100%;
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
  }
  </style>