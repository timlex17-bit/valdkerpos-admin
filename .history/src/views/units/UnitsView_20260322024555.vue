<template>
    <div class="units-page">
      <!-- Header -->
      <section class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Units</h1>
          <div class="breadcrumb">
            <span class="crumb-link">Home</span>
            <span class="crumb-sep">›</span>
            <span class="crumb-link">Pos</span>
            <span class="crumb-sep">›</span>
            <span class="crumb-current">Units</span>
          </div>
        </div>
  
        <button class="btn btn-success" @click="openAddModal">
          <span class="btn-icon">＋</span>
          <span>Add unit</span>
        </button>
      </section>
  
      <!-- Filter -->
      <section class="filter-card">
        <div class="filter-row">
          <select v-model="selectedShopFilter" class="form-select">
            <option value="">shop</option>
            <option v-for="shop in shops" :key="shop.id" :value="shop.code">
              {{ shop.name }} ({{ shop.code }})
            </option>
          </select>
  
          <button class="btn btn-primary" @click="applyFilter">Search</button>
        </div>
  
        <div class="filter-row second-row">
          <select v-model="bulkAction" class="form-select action-select">
            <option value="">---------</option>
            <option value="delete">Delete selected</option>
          </select>
  
          <button class="btn btn-primary btn-small" @click="handleBulkAction">
            Go
          </button>
  
          <span class="selection-info">
            {{ selectedIds.length }} of {{ filteredUnits.length }} selected
          </span>
        </div>
      </section>
  
      <!-- Table -->
      <section class="table-card">
        <div class="table-wrap">
          <table class="unit-table">
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
                <th>Shop</th>
                <th>Name</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredUnits.length === 0">
                <td colspan="5" class="empty-cell">No units found.</td>
              </tr>
  
              <tr v-for="unit in filteredUnits" :key="unit.id">
                <td>
                  <input type="checkbox" :value="unit.id" v-model="selectedIds" />
                </td>
                <td class="id-text">{{ unit.id }}</td>
                <td>{{ unit.shopName }} ({{ unit.shopCode }})</td>
                <td class="name-text">{{ unit.name }}</td>
                <td>
                  <div class="actions">
                    <button class="btn-action edit" @click="openEditModal(unit)">
                      Edit
                    </button>
                    <button class="btn-action delete" @click="deleteUnit(unit.id)">
                      Delete
                    </button>
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
                {{
                  isEditMode
                    ? 'Update unit information'
                    : 'Create a new unit'
                }}
              </p>
            </div>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <div class="modal-body">
            <div class="modal-form-layout">
              <div class="form-card">
                <div class="form-row">
                  <label>Shop <span class="required">*</span></label>
                  <div class="form-input-wrap">
                    <select v-model="form.shopCode" class="form-select">
                      <option value="">---------</option>
                      <option v-for="shop in shops" :key="shop.id" :value="shop.code">
                        {{ shop.name }} ({{ shop.code }})
                      </option>
                    </select>
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Name <span class="required">*</span></label>
                  <div class="form-input-wrap">
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
  
  type Shop = {
    id: number
    name: string
    code: string
  }
  
  type Unit = {
    id: number
    shopId: number
    shopName: string
    shopCode: string
    name: string
  }
  
  const shops = ref<Shop[]>([
    { id: 1, name: 'WFOUR STORE', code: 'WFOUR' },
    { id: 2, name: 'ValdKerPOS', code: 'VALDKER' },
  ])
  
  const units = ref<Unit[]>([
    { id: 19, shopId: 2, shopName: 'ValdKerPOS', shopCode: 'VALDKER', name: 'LTR' },
    { id: 18, shopId: 2, shopName: 'ValdKerPOS', shopCode: 'VALDKER', name: 'BOX' },
    { id: 17, shopId: 2, shopName: 'ValdKerPOS', shopCode: 'VALDKER', name: 'KG' },
    { id: 16, shopId: 2, shopName: 'ValdKerPOS', shopCode: 'VALDKER', name: 'PCS' },
    { id: 10, shopId: 1, shopName: 'WFOUR STORE', shopCode: 'WFOUR', name: 'BOX' },
    { id: 8, shopId: 1, shopName: 'WFOUR STORE', shopCode: 'WFOUR', name: 'ROLL' },
  ])
  
  const selectedShopFilter = ref('')
  const appliedShopFilter = ref('')
  const bulkAction = ref('')
  const selectedIds = ref<number[]>([])
  
  const showModal = ref(false)
  const isEditMode = ref(false)
  const editingId = ref<number | null>(null)
  
  const form = reactive({
    shopCode: '',
    name: '',
  })
  
  const filteredUnits = computed(() => {
    if (!appliedShopFilter.value) return units.value
    return units.value.filter((item) => item.shopCode === appliedShopFilter.value)
  })
  
  const isAllSelected = computed(() => {
    return (
      filteredUnits.value.length > 0 &&
      filteredUnits.value.every((item) => selectedIds.value.includes(item.id))
    )
  })
  
  function applyFilter() {
    appliedShopFilter.value = selectedShopFilter.value
    selectedIds.value = []
  }
  
  function toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    if (checked) {
      selectedIds.value = filteredUnits.value.map((item) => item.id)
    } else {
      selectedIds.value = []
    }
  }
  
  function resetForm() {
    form.shopCode = ''
    form.name = ''
  }
  
  function openAddModal() {
    resetForm()
    isEditMode.value = false
    editingId.value = null
    showModal.value = true
  }
  
  function openEditModal(unit: Unit) {
    form.shopCode = unit.shopCode
    form.name = unit.name
    isEditMode.value = true
    editingId.value = unit.id
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
  }
  
  function validateForm() {
    if (!form.shopCode.trim()) {
      alert('Shop is required.')
      return false
    }
    if (!form.name.trim()) {
      alert('Name is required.')
      return false
    }
    return true
  }
  
  function saveUnit() {
    if (!validateForm()) return
  
    const selectedShop = shops.value.find((shop) => shop.code === form.shopCode)
    if (!selectedShop) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = units.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        units.value[index] = {
          ...units.value[index],
          shopId: selectedShop.id,
          shopName: selectedShop.name,
          shopCode: selectedShop.code,
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
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        shopCode: selectedShop.code,
        name: form.name,
      })
    }
  
    closeModal()
    resetForm()
  }
  
  function saveAndAddAnother() {
    if (!validateForm()) return
  
    const selectedShop = shops.value.find((shop) => shop.code === form.shopCode)
    if (!selectedShop) return
  
    const nextId =
      units.value.length > 0
        ? Math.max(...units.value.map((item) => item.id)) + 1
        : 1
  
    units.value.unshift({
      id: nextId,
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      shopCode: selectedShop.code,
      name: form.name,
    })
  
    resetForm()
  }
  
  function saveAndContinueEditing() {
    if (!validateForm()) return
  
    const selectedShop = shops.value.find((shop) => shop.code === form.shopCode)
    if (!selectedShop) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = units.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        units.value[index] = {
          ...units.value[index],
          shopId: selectedShop.id,
          shopName: selectedShop.name,
          shopCode: selectedShop.code,
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
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        shopCode: selectedShop.code,
        name: form.name,
      })
  
      isEditMode.value = true
      editingId.value = nextId
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
  .units-page {
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
  
  .page-header-left {
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
  }
  
  .crumb-link {
    color: #1677ff;
    font-weight: 600;
  }
  
  .crumb-sep,
  .crumb-current {
    color: #6b7280;
  }
  
  .filter-card,
  .table-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  }
  
  .filter-card {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .second-row {
    margin-top: 18px;
  }
  
  .form-select,
  .form-input {
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
  
  .form-select:focus,
  .form-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }
  
  .filter-row .form-select {
    width: 240px;
  }
  
  .action-select {
    width: 190px !important;
  }
  
  .selection-info {
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
  
  .btn-small {
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
  
  .btn-icon {
    font-size: 1.1rem;
    line-height: 1;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .unit-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 850px;
  }
  
  .unit-table thead th {
    text-align: left;
    padding: 18px 16px;
    font-size: 1rem;
    font-weight: 800;
    color: #1677ff;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .unit-table tbody td {
    padding: 16px;
    font-size: 1rem;
    color: #1f2937;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
  }
  
  .unit-table tbody tr:hover {
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
  
  .modal-form-layout {
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
  
  .form-row:last-child {
    margin-bottom: 0;
  }
  
  .form-row label {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .form-input-wrap {
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
    .modal-form-layout {
      grid-template-columns: 1fr;
    }
  
    .side-actions {
      order: -1;
    }
  }
  
  @media (max-width: 768px) {
    .units-page {
      padding: 16px;
    }
  
    .page-title {
      font-size: 1.7rem;
      padding-right: 0;
      border-right: none;
    }
  
    .page-header-left {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  
    .filter-row .form-select,
    .action-select {
      width: 100% !important;
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