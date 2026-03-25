<template>
  <div class="categories-page">
    <!-- Header -->
    <section class="page-header">
      <div class="page-header__left">
        <div>
          <h1 class="page-title">Categories</h1>
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Pos</span>
            <span>›</span>
            <span class="active">Categories</span>
          </div>
        </div>
      </div>

      <button class="btn btn-success" @click="openAddModal">
        <span class="btn-icon">＋</span>
        <span>Add category</span>
      </button>
    </section>

    <!-- Summary -->
    <section class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Total Categories</div>
        <div class="summary-value">{{ categories.length }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-label">With Icon</div>
        <div class="summary-value">{{ categoriesWithIcon }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Without Icon</div>
        <div class="summary-value">{{ categoriesWithoutIcon }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Selected</div>
        <div class="summary-value">{{ selectedIds.length }}</div>
      </div>
    </section>

    <!-- Toolbar
    <section class="toolbar-card">
      <div class="toolbar-top">
        <div class="toolbar-search">
          <input
            v-model="search"
            type="text"
            class="form-input"
            placeholder="Search category..."
          />

          <button class="btn btn-primary" @click="applySearch">
            Search
          </button>
        </div>

        <button class="btn btn-light" @click="resetFilters">
          Reset
        </button>
      </div>

      <div class="toolbar-bottom">
        <select v-model="bulkAction" class="form-select bulk-select">
          <option value="">Bulk action</option>
          <option value="delete">Delete selected</option>
        </select>

        <button class="btn btn-primary btn-sm" @click="handleBulkAction">
          Go
        </button>

        <span class="selection-text">
          {{ selectedIds.length }} of {{ filteredCategories.length }} selected
        </span>
      </div>
    </section> -->

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
              <th>Category</th>
              <th>Icon</th>
              <th>Status</th>
              <th class="action-col">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredCategories.length === 0">
              <td colspan="6" class="empty-cell">No categories found.</td>
            </tr>

            <tr v-for="item in filteredCategories" :key="item.id">
              <td>
                <input type="checkbox" :value="item.id" v-model="selectedIds" />
              </td>

              <td class="id-cell">{{ item.id }}</td>

              <td>
                <div class="category-cell">
                  <div
                    class="category-avatar"
                    :class="{ 'category-avatar--empty': !item.icon }"
                  >
                    <img v-if="item.icon" :src="item.icon" :alt="item.name" />
                    <span v-else>{{ getInitial(item.name) }}</span>
                  </div>

                  <div>
                    <div class="category-name">{{ item.name }}</div>
                    <div class="category-subtitle">Owner category</div>
                  </div>
                </div>
              </td>

              <td>
                <div v-if="item.icon" class="icon-preview">
                  <img :src="item.icon" :alt="item.name" />
                </div>
                <span v-else class="muted">No icon</span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="item.icon ? 'active' : 'pending'"
                >
                  {{ item.icon ? 'Ready' : 'No icon' }}
                </span>
              </td>

              <td>
                <div class="actions">
                  <button class="icon-btn edit" @click="openEditModal(item)">
                    Edit
                  </button>
                  <button class="icon-btn delete" @click="deleteCategory(item.id)">
                    Delete
                  </button>
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
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit category' : 'Add category' }}</h2>
            <p>
              {{
                isEditMode
                  ? 'Update category information'
                  : 'Create a new category'
              }}
            </p>
          </div>

          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-layout">
            <!-- Left -->
            <div class="form-panel">
              <div class="form-grid">
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
                  <label>Category icon</label>
                  <input
                    type="file"
                    class="form-input file-input"
                    accept="image/*"
                    @change="handleFileChange"
                  />
                </div>

                <div class="form-group form-group--full">
                  <label>Preview</label>
                  <div class="large-preview" :class="{ empty: !form.iconPreview }">
                    <img
                      v-if="form.iconPreview"
                      :src="form.iconPreview"
                      alt="Preview"
                    />
                    <div v-else class="large-preview__placeholder">
                      {{ getInitial(form.name || 'Category') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right -->
            <div class="action-panel">
              <div class="action-panel__card">
                <button class="btn btn-success full-btn" @click="saveCategory">
                  Save
                </button>
                <button class="btn btn-info full-btn" @click="saveAndAddAnother">
                  Save and add another
                </button>
                <button class="btn btn-info full-btn" @click="saveAndContinueEditing">
                  Save and continue editing
                </button>
              </div>

              <div class="preview-card">
                <div class="preview-title">Quick Preview</div>

                <div class="preview-row">
                  <span>Name</span>
                  <strong>{{ form.name || '-' }}</strong>
                </div>

                <div class="preview-row">
                  <span>Icon</span>
                  <strong>{{ form.iconPreview ? 'Uploaded' : 'Empty' }}</strong>
                </div>

                <div class="preview-row">
                  <span>Mode</span>
                  <strong>{{ isEditMode ? 'Edit' : 'Create' }}</strong>
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

const categoriesWithIcon = computed(() => {
  return categories.value.filter((item) => !!item.icon).length
})

const categoriesWithoutIcon = computed(() => {
  return categories.value.filter((item) => !item.icon).length
})

function applySearch() {
  appliedSearch.value = search.value
  selectedIds.value = []
}

function resetFilters() {
  search.value = ''
  appliedSearch.value = ''
  bulkAction.value = ''
  selectedIds.value = []
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  selectedIds.value = checked
    ? filteredCategories.value.map((item) => item.id)
    : []
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

function getInitial(value: string) {
  return value?.trim()?.charAt(0)?.toUpperCase() || 'C'
}
</script>

<style scoped>
.categories-page {
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
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid #e6ebf2;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  flex-wrap: wrap;
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
  width: 300px;
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
  min-width: 980px;
}

.modern-table thead th {
  text-align: left;
  padding: 18px 16px;
  font-size: 0.95rem;
  font-weight: 800;
  color: #1677ff;
  border-bottom: 1px solid #e8edf5;
  background: #fbfcfe;
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
  width: 160px;
}

.id-cell {
  font-weight: 800;
  color: #1677ff;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
}

.category-avatar--empty {
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
}

.category-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-name {
  font-weight: 800;
  color: #0f172a;
}

.category-subtitle {
  margin-top: 2px;
  font-size: 0.83rem;
  color: #64748b;
}

.icon-preview {
  width: 48px;
  height: 48px;
  border-radius: 14px;
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
  color: #94a3b8;
  font-weight: 600;
}

.status-badge {
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

.status-badge.active {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
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
  max-width: 1180px;
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

.file-input {
  padding-top: 10px;
  padding-bottom: 10px;
}

.large-preview {
  width: 140px;
  height: 140px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.large-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.large-preview.empty {
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
}

.large-preview__placeholder {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
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

.required {
  color: #ef4444;
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
  .categories-page {
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