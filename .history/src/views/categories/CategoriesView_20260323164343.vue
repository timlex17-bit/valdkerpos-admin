<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Categories</h1>
        <p class="page-subtitle">Manage product categories for your current shop.</p>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>POS</span>
          <span>/</span>
          <span class="active">Categories</span>
        </div>
      </div>

      <button class="add-btn" @click="openAddModal">
        <span>+</span>
        Add Category
      </button>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Categories</div>
        <div class="stat-value">{{ filteredCategories.length }}</div>
        <div class="stat-note">Categories shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">With Icon</div>
        <div class="stat-value">{{ categoriesWithIcon }}</div>
        <div class="stat-note">Categories with uploaded icon</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Without Icon</div>
        <div class="stat-value">{{ categoriesWithoutIcon }}</div>
        <div class="stat-note">Categories without icon</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search category..."
          />
        </div>

        <button class="reset-btn" @click="resetFilters">Reset</button>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Category List</h2>
          <p>{{ filteredCategories.length }} category(s) found</p>
        </div>
      </div>

      <div class="table-wrap" v-if="filteredCategories.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Icon</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredCategories" :key="item.id">
              <td>
                <div class="ref-cell">
                  <div class="ref-main">CT{{ String(item.id).padStart(10, '0') }}</div>
                  <div class="ref-sub">Category</div>
                </div>
              </td>

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
                    <div class="title-main">{{ item.name }}</div>
                    <div class="sub-text">Owner category</div>
                  </div>
                </div>
              </td>

              <td>
                <div v-if="item.icon" class="icon-preview">
                  <img :src="item.icon" :alt="item.name" />
                </div>
                <span v-else class="muted-text">No icon</span>
              </td>

              <td>
                <span class="status-badge" :class="item.icon ? 'paid' : 'unpaid'">
                  {{ item.icon ? 'Ready' : 'No icon' }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openEditModal(item)">View</button>
                  <button class="btn-edit" @click="openEditModal(item)">Edit</button>
                  <button class="btn-delete" @click="deleteCategory(item.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>No categories found</h3>
        <p>Try another keyword or create a new category.</p>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>{{ isEditMode ? 'Edit Category' : 'Add Category' }}</h2>
            <p>Fill in the form below to save category data.</p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group form-group-full">
              <label>Name</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="Enter category name"
              />
            </div>

            <div class="form-group form-group-full">
              <label>Category Icon</label>
              <input
                type="file"
                class="form-input file-input"
                accept="image/*"
                @change="handleFileChange"
              />
            </div>

            <div class="form-group form-group-full">
              <label>Preview</label>
              <div class="large-preview" :class="{ empty: !form.iconPreview }">
                <img v-if="form.iconPreview" :src="form.iconPreview" alt="Preview" />
                <div v-else class="large-preview__placeholder">
                  {{ getInitial(form.name || 'Category') }}
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="closeModal">Cancel</button>
            <button class="save-btn" @click="saveCategory">Save</button>
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
const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  iconFile: null as File | null,
  iconPreview: '',
})

const filteredCategories = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return categories.value
  return categories.value.filter((item) => item.name.toLowerCase().includes(keyword))
})

const categoriesWithIcon = computed(() => categories.value.filter((item) => !!item.icon).length)
const categoriesWithoutIcon = computed(() => categories.value.filter((item) => !item.icon).length)

function resetFilters() {
  search.value = ''
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

function nextId() {
  return categories.value.length > 0 ? Math.max(...categories.value.map((item) => item.id)) + 1 : 1
}

function saveCategory() {
  if (!validateForm()) return

  if (isEditMode.value && editingId.value !== null) {
    const index = categories.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      categories.value[index] = {
        ...categories.value[index],
        name: form.name.trim(),
        icon: form.iconPreview,
      }
    }
  } else {
    categories.value.unshift({
      id: nextId(),
      name: form.name.trim(),
      icon: form.iconPreview,
    })
  }

  closeModal()
  resetForm()
}

function deleteCategory(id: number) {
  if (!window.confirm('Delete this category?')) return
  categories.value = categories.value.filter((item) => item.id !== id)
}

function getInitial(value: string) {
  return value?.trim()?.charAt(0)?.toUpperCase() || 'C'
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
  grid-template-columns: 1.8fr auto;
  gap: 14px;
  align-items: center;
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
  min-width: 980px;
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
.title-main {
  font-weight: 700;
  color: #1f2937;
}
.sub-text,
.muted-text {
  color: #64748b;
  font-size: 0.9rem;
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
  grid-template-columns: 1fr;
  gap: 16px;
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
.file-input {
  padding-top: 12px;
  padding-bottom: 12px;
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
  .toolbar-grid,
  .stats-grid {
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