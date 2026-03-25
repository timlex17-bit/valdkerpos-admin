<template>
  <div class="page">
    <section class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">Categories</h1>
        <div class="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Pos</span>
          <span>›</span>
          <span class="active">Categories</span>
        </div>
      </div>

      <button class="btn btn-success" @click="openAddModal">
        <span>＋</span>
        <span>Add category</span>
      </button>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-row">
        <input
          v-model="search"
          type="text"
          class="form-input search-input"
          placeholder="Search category name..."
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
          {{ selectedIds.length }} of {{ filteredCategories.length }} selected
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
              <th>Icon</th>
              <th class="action-col">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredCategories.length === 0">
              <td colspan="5" class="empty-cell">No categories found.</td>
            </tr>

            <tr v-for="item in filteredCategories" :key="item.id">
              <td>
                <input type="checkbox" :value="item.id" v-model="selectedIds" />
              </td>
              <td class="id-text">{{ item.id }}</td>
              <td class="name-text">{{ item.name }}</td>
              <td>
                <div v-if="item.icon" class="icon-preview">
                  <img :src="item.icon" :alt="item.name" />
                </div>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <div class="actions">
                  <button class="btn-action edit" @click="openEditModal(item)">Edit</button>
                  <button class="btn-action delete" @click="deleteCategory(item.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        {{ filteredCategories.length }} categories
      </div>
    </section>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit category' : 'Add category' }}</h2>
            <p>
              {{ isEditMode ? 'Update category information' : 'Create a new category' }}
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
                    placeholder="Enter category name"
                  />
                </div>
              </div>

              <div class="form-row">
                <label>Category icon</label>
                <div class="form-control">
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

            <div class="side-actions">
              <button class="btn btn-success full-btn" @click="saveCategory">Save</button>
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

type Category = {
  id: number
  name: string
  icon: string
}

const categories = ref<Category[]>([
  { id: 11, name: 'Tissue', icon: '' },
  { id: 10, name: 'General', icon: '' },
  { id: 5, name: 'Local Drink', icon: '' },
  { id: 4, name: 'Fastfood', icon: '' },
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
  iconFile: null as File | null,
  iconPreview: '',
})

const filteredCategories = computed(() => {
  const keyword = appliedSearch.value.trim().toLowerCase()
  if (!keyword) return categories.value
  return categories.value.filter((item) =>
    item.name.toLowerCase().includes(keyword)
  )
})

const isAllSelected = computed(() => {
  return (
    filteredCategories.value.length > 0 &&
    filteredCategories.value.every((item) => selectedIds.value.includes(item.id))
  )
})

function applySearch() {
  appliedSearch.value = search.value
  selectedIds.value = []
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  selectedIds.value = checked ? filteredCategories.value.map((item) => item.id) : []
}

function resetForm() {
  form.name = ''
  form.iconFile = null
  form.iconPreview = ''
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(item: Category) {
  form.name = item.name
  form.iconPreview = item.icon
  form.iconFile = null
  isEditMode.value = true
  editingId.value = item.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
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
  if (!form.name.trim()) {
    alert('Name is required.')
    return false
  }
  return true
}

function saveCategory() {
  if (!validateForm()) return

  if (isEditMode.value && editingId.value !== null) {
    const index = categories.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      categories.value[index] = {
        ...categories.value[index],
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
      name: form.name,
      icon: form.iconPreview,
    })
  }

  closeModal()
  resetForm()
}

function saveAndAddAnother() {
  if (!validateForm()) return

  const nextId =
    categories.value.length > 0
      ? Math.max(...categories.value.map((item) => item.id)) + 1
      : 1

  categories.value.unshift({
    id: nextId,
    name: form.name,
    icon: form.iconPreview,
  })

  resetForm()
}

function saveAndContinueEditing() {
  if (!validateForm()) return

  if (isEditMode.value && editingId.value !== null) {
    const index = categories.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      categories.value[index] = {
        ...categories.value[index],
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
      name: form.name,
      icon: form.iconPreview,
    })

    editingId.value = nextId
    isEditMode.value = true
  }
}

function deleteCategory(id: number) {
  const confirmed = window.confirm('Delete this category?')
  if (!confirmed) return

  categories.value = categories.value.filter((item) => item.id !== id)
  selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
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
    const confirmed = window.confirm(
      `Delete ${selectedIds.value.length} selected category(s)?`
    )
    if (!confirmed) return

    categories.value = categories.value.filter(
      (item) => !selectedIds.value.includes(item.id)
    )
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
  min-width: 760px;
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
  align-items: start;
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

.form-control {
  width: 100%;
}

.file-input {
  padding-top: 10px;
  padding-bottom: 10px;
}

.upload-preview {
  margin-top: 10px;
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