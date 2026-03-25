<template>
    <div class="categories-page">
      <!-- Page Header -->
      <section class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">Categorys</h1>
          <div class="breadcrumb">
            <span class="breadcrumb__link">Home</span>
            <span class="breadcrumb__sep">›</span>
            <span class="breadcrumb__link">Pos</span>
            <span class="breadcrumb__sep">›</span>
            <span class="breadcrumb__current">Categorys</span>
          </div>
        </div>
  
        <button class="btn btn-success" @click="openCreateModal">
          <span class="btn__icon">＋</span>
          <span>Add category</span>
        </button>
      </section>
  
      <!-- Filter Section -->
      <section class="filter-card">
        <div class="filter-row">
          <select v-model="selectedShopFilter" class="form-select">
            <option value="">shop</option>
            <option
              v-for="shop in shops"
              :key="shop.id"
              :value="shop.code"
            >
              {{ shop.name }} ({{ shop.code }})
            </option>
          </select>
  
          <button class="btn btn-primary" @click="applyFilter">
            Search
          </button>
        </div>
  
        <div class="filter-row filter-row--secondary">
          <select v-model="bulkAction" class="form-select form-select--sm">
            <option value="">---------</option>
            <option value="delete">Delete selected</option>
          </select>
  
          <button class="btn btn-primary btn-sm" @click="handleBulkAction">
            Go
          </button>
  
          <span class="selected-text">
            {{ selectedIds.length }} of {{ filteredCategories.length }} selected
          </span>
        </div>
      </section>
  
      <!-- Table -->
      <section class="table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-checkbox">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>ID</th>
                <th>Shop</th>
                <th>Name</th>
                <th>Icon</th>
                <th class="th-action">Action</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredCategories.length === 0">
                <td colspan="6" class="empty-state">
                  No categories found.
                </td>
              </tr>
  
              <tr
                v-for="item in filteredCategories"
                :key="item.id"
              >
                <td>
                  <input
                    type="checkbox"
                    :value="item.id"
                    v-model="selectedIds"
                  />
                </td>
                <td class="id-cell">{{ item.id }}</td>
                <td>{{ item.shopName }} ({{ item.shopCode }})</td>
                <td class="name-cell">{{ item.name }}</td>
                <td>
                  <div class="icon-preview" v-if="item.icon">
                    <img :src="item.icon" :alt="item.name" />
                  </div>
                  <span v-else class="muted">—</span>
                </td>
                <td>
                  <div class="action-group">
                    <button class="btn-action btn-action--edit" @click="openEditModal(item)">
                      Edit
                    </button>
                    <button class="btn-action btn-action--danger" @click="deleteCategory(item.id)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div class="table-footer">
          {{ filteredCategories.length }} categorys
        </div>
      </section>
  
      <!-- Modal -->
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h2>{{ isEditMode ? 'Edit category' : 'Add category' }}</h2>
              <p>{{ isEditMode ? 'Update category information' : 'Create a new category' }}</p>
            </div>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
  
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Shop <span class="required">*</span></label>
                <select v-model="form.shopCode" class="form-select">
                  <option value="">---------</option>
                  <option
                    v-for="shop in shops"
                    :key="shop.id"
                    :value="shop.code"
                  >
                    {{ shop.name }} ({{ shop.code }})
                  </option>
                </select>
              </div>
  
              <div class="form-group">
                <label>Name <span class="required">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  placeholder="Enter category name"
                />
              </div>
  
              <div class="form-group form-group--full">
                <label>Category_icon</label>
                <input
                  type="file"
                  class="form-input file-input"
                  accept="image/*"
                  @change="handleFileChange"
                />
                <div v-if="form.iconPreview" class="upload-preview">
                  <img :src="form.iconPreview" alt="Preview" />
                </div>
              </div>
            </div>
          </div>
  
          <div class="modal-footer">
            <button class="btn btn-light" @click="closeModal">Cancel</button>
            <button class="btn btn-info" @click="saveAndAddAnother">
              Save and add another
            </button>
            <button class="btn btn-primary" @click="saveAndContinue">
              Save and continue editing
            </button>
            <button class="btn btn-success" @click="saveCategory">
              Save
            </button>
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
  
  type Category = {
    id: number
    shopId: number
    shopName: string
    shopCode: string
    name: string
    icon: string
  }
  
  const shops = ref<Shop[]>([
    { id: 1, name: 'WFOUR STORE', code: 'WFOUR' },
    { id: 2, name: 'ValdKerPOS', code: 'VALDKER' },
  ])
  
  const categories = ref<Category[]>([
    {
      id: 11,
      shopId: 2,
      shopName: 'ValdKerPOS',
      shopCode: 'VALDKER',
      name: 'General',
      icon: '',
    },
    {
      id: 10,
      shopId: 2,
      shopName: 'ValdKerPOS',
      shopCode: 'VALDKER',
      name: 'Tissue',
      icon: '',
    },
    {
      id: 5,
      shopId: 1,
      shopName: 'WFOUR STORE',
      shopCode: 'WFOUR',
      name: 'Local Drink',
      icon: '',
    },
    {
      id: 4,
      shopId: 1,
      shopName: 'WFOUR STORE',
      shopCode: 'WFOUR',
      name: 'Fastfood',
      icon: '',
    },
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
    iconFile: null as File | null,
    iconPreview: '',
  })
  
  const filteredCategories = computed(() => {
    if (!appliedShopFilter.value) return categories.value
    return categories.value.filter(
      (item) => item.shopCode === appliedShopFilter.value
    )
  })
  
  const isAllSelected = computed(() => {
    return (
      filteredCategories.value.length > 0 &&
      filteredCategories.value.every((item) => selectedIds.value.includes(item.id))
    )
  })
  
  function applyFilter() {
    appliedShopFilter.value = selectedShopFilter.value
    selectedIds.value = []
  }
  
  function toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
  
    if (checked) {
      selectedIds.value = filteredCategories.value.map((item) => item.id)
    } else {
      selectedIds.value = []
    }
  }
  
  function openCreateModal() {
    isEditMode.value = false
    editingId.value = null
    resetForm()
    showModal.value = true
  }
  
  function openEditModal(item: Category) {
    isEditMode.value = true
    editingId.value = item.id
    form.shopCode = item.shopCode
    form.name = item.name
    form.iconPreview = item.icon
    form.iconFile = null
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
  }
  
  function resetForm() {
    form.shopCode = ''
    form.name = ''
    form.iconFile = null
    form.iconPreview = ''
  }
  
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0] || null
    form.iconFile = file
  
    if (file) {
      form.iconPreview = URL.createObjectURL(file)
    } else {
      form.iconPreview = ''
    }
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
  
  function saveCategory() {
    if (!validateForm()) return
  
    const selectedShop = shops.value.find((shop) => shop.code === form.shopCode)
    if (!selectedShop) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = categories.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        categories.value[index] = {
          ...categories.value[index],
          shopId: selectedShop.id,
          shopName: selectedShop.name,
          shopCode: selectedShop.code,
          name: form.name,
          icon: form.iconPreview,
        }
      }
    } else {
      const nextId =
        categories.value.length > 0
          ? Math.max(...categories.value.map((item) => item.id)) + 1
          : 1
  
      categories.value.unshift({
        id: nextId,
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        shopCode: selectedShop.code,
        name: form.name,
        icon: form.iconPreview,
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
      categories.value.length > 0
        ? Math.max(...categories.value.map((item) => item.id)) + 1
        : 1
  
    categories.value.unshift({
      id: nextId,
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      shopCode: selectedShop.code,
      name: form.name,
      icon: form.iconPreview,
    })
  
    resetForm()
  }
  
  function saveAndContinue() {
    if (!validateForm()) return
  
    const selectedShop = shops.value.find((shop) => shop.code === form.shopCode)
    if (!selectedShop) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = categories.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        categories.value[index] = {
          ...categories.value[index],
          shopId: selectedShop.id,
          shopName: selectedShop.name,
          shopCode: selectedShop.code,
          name: form.name,
          icon: form.iconPreview,
        }
      }
    } else {
      const nextId =
        categories.value.length > 0
          ? Math.max(...categories.value.map((item) => item.id)) + 1
          : 1
  
      categories.value.unshift({
        id: nextId,
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        shopCode: selectedShop.code,
        name: form.name,
        icon: form.iconPreview,
      })
  
      isEditMode.value = true
      editingId.value = nextId
    }
  }
  
  function deleteCategory(id: number) {
    const ok = window.confirm('Delete this category?')
    if (!ok) return
  
    categories.value = categories.value.filter((item) => item.id !== id)
    selectedIds.value = selectedIds.value.filter((itemId) => itemId !== id)
  }
  
  function handleBulkAction() {
    if (!bulkAction.value) {
      alert('Please select an action first.')
      return
    }
  
    if (selectedIds.value.length === 0) {
      alert('Please select at least one category.')
      return
    }
  
    if (bulkAction.value === 'delete') {
      const ok = window.confirm(`Delete ${selectedIds.value.length} selected category(s)?`)
      if (!ok) return
  
      categories.value = categories.value.filter(
        (item) => !selectedIds.value.includes(item.id)
      )
      selectedIds.value = []
      bulkAction.value = ''
    }
  }
  </script>
  
  <style scoped>
  .categories-page {
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
    border-radius: 20px;
    padding: 22px 24px;
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
    flex-wrap: wrap;
    gap: 10px;
    font-size: 1rem;
  }
  
  .breadcrumb__link {
    color: #1d72f3;
    font-weight: 600;
  }
  
  .breadcrumb__sep,
  .breadcrumb__current {
    color: #6b7280;
  }
  
  .filter-card,
  .table-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  }
  
  .filter-card {
    padding: 22px;
    margin-bottom: 20px;
  }
  
  .filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .filter-row + .filter-row {
    margin-top: 18px;
  }
  
  .filter-row--secondary {
    padding-top: 4px;
  }
  
  .form-select,
  .form-input {
    min-height: 48px;
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 12px;
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
    width: 250px;
  }
  
  .form-select--sm {
    width: 180px !important;
  }
  
  .selected-text {
    font-size: 0.98rem;
    color: #374151;
    font-weight: 600;
  }
  
  .btn {
    min-height: 48px;
    border: none;
    border-radius: 12px;
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
    min-height: 44px;
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
  
  .btn-light {
    background: #eef2f7;
    color: #1f2937;
  }
  
  .btn-light:hover {
    background: #e5eaf1;
  }
  
  .btn__icon {
    font-size: 1.1rem;
    line-height: 1;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }
  
  .data-table thead th {
    text-align: left;
    padding: 18px 16px;
    font-size: 1rem;
    font-weight: 800;
    color: #1677ff;
    background: #fff;
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
  
  .th-checkbox,
  .th-action {
    width: 90px;
  }
  
  .id-cell {
    color: #1677ff;
    font-weight: 800;
  }
  
  .name-cell {
    font-weight: 700;
  }
  
  .icon-preview {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
  }
  
  .icon-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .muted {
    color: #9ca3af;
  }
  
  .action-group {
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
  
  .btn-action--edit {
    background: rgba(22, 119, 255, 0.12);
    color: #1677ff;
  }
  
  .btn-action--danger {
    background: rgba(220, 38, 38, 0.12);
    color: #dc2626;
  }
  
  .table-footer {
    padding: 20px 18px;
    font-size: 1rem;
    font-weight: 700;
    color: #374151;
  }
  
  .empty-state {
    text-align: center;
    color: #6b7280;
    padding: 30px !important;
  }
  
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 999;
  }
  
  .modal-card {
    width: 100%;
    max-width: 900px;
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
    overflow: hidden;
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
    font-size: 1.4rem;
    color: #111827;
  }
  
  .modal-header p {
    margin: 6px 0 0;
    color: #6b7280;
  }
  
  .modal-close {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: #f3f4f6;
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 22px 24px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
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
    font-size: 0.96rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .required {
    color: #ef4444;
  }
  
  .file-input {
    padding: 10px 14px;
  }
  
  .upload-preview {
    margin-top: 8px;
    width: 88px;
    height: 88px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
  }
  
  .upload-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
    padding: 18px 24px 24px;
    border-top: 1px solid #eef2f7;
  }
  
  @media (max-width: 992px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  
    .form-group--full {
      grid-column: span 1;
    }
  }
  
  @media (max-width: 768px) {
    .categories-page {
      padding: 16px;
    }
  
    .page-title {
      font-size: 1.6rem;
      border-right: none;
      padding-right: 0;
    }
  
    .page-header__left {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  
    .filter-row .form-select,
    .form-select--sm {
      width: 100% !important;
    }
  
    .btn {
      width: 100%;
    }
  
    .modal-footer {
      flex-direction: column-reverse;
    }
  
    .modal-footer .btn {
      width: 100%;
    }
  }
  </style>