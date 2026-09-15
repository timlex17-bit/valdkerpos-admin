<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/apiError'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createWorkshopRecord,
  deleteWorkshopRecord,
  listWorkshopRecords,
  updateWorkshopRecord,
  type WorkshopModuleKey,
  type WorkshopPayload,
  type WorkshopRecord,
} from '@/services/workshopService'
import { canShowModule, parseStoredJson } from '@/utils/moduleVisibility'

const props = defineProps<{
  moduleKey: WorkshopModuleKey
  title: string
  subtitle: string
}>()

const router = useRouter()

const records = ref<WorkshopRecord[]>([])
const search = ref('')
const statusFilter = ref('')
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const errorMessage = ref('')

const form = reactive<WorkshopPayload>({
  name: '',
  code: '',
  status: 'active',
  description: '',
})

const filteredRecords = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return records.value.filter((record) => {
    const haystack = [record.name, record.code, record.status, record.description]
      .join(' ')
      .toLowerCase()
    const matchesSearch = !keyword || haystack.includes(keyword)
    const matchesStatus = !statusFilter.value || record.status.toLowerCase() === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

const activeCount = computed(
  () => records.value.filter((record) => record.status.toLowerCase() === 'active').length,
)

const inactiveCount = computed(() => records.value.length - activeCount.value)

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
}

function resetForm() {
  form.name = ''
  form.code = ''
  form.status = 'active'
  form.description = ''
}

async function fetchRecords() {
  loading.value = true
  errorMessage.value = ''

  try {
    records.value = await listWorkshopRecords(props.moduleKey)
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, `Failed to load ${props.title}.`)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  resetForm()
  isEditing.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(record: WorkshopRecord) {
  form.name = record.name
  form.code = record.code
  form.status = record.status || 'active'
  form.description = record.description
  isEditing.value = true
  editingId.value = record.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

async function saveRecord() {
  if (!form.name.trim()) {
    window.alert('Name is required.')
    return
  }

  submitting.value = true
  errorMessage.value = ''

  const payload = {
    name: form.name.trim(),
    code: form.code.trim(),
    status: form.status,
    description: form.description.trim(),
  }

  try {
    if (isEditing.value && editingId.value !== null) {
      await updateWorkshopRecord(props.moduleKey, editingId.value, payload)
    } else {
      await createWorkshopRecord(props.moduleKey, payload)
    }

    closeModal()
    await fetchRecords()
  } catch (error: any) {
    window.alert(getApiErrorMessage(error, `Failed to save ${props.title}.`))
  } finally {
    submitting.value = false
  }
}

async function removeRecord(record: WorkshopRecord) {
  const confirmed = window.confirm(`Delete ${record.name}?`)
  if (!confirmed) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await deleteWorkshopRecord(props.moduleKey, record.id)
    await fetchRecords()
  } catch (error: any) {
    window.alert(getApiErrorMessage(error, `Failed to delete ${props.title}.`))
  } finally {
    submitting.value = false
  }
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

onMounted(() => {
  const user = parseStoredJson<Record<string, any> | null>('user', null)
  if (!canShowModule(props.moduleKey, user)) {
    sessionStorage.setItem(
      'module_access_message',
      'This module is not available for your business type, plan, or role.',
    )
    router.replace('/dashboard')
    return
  }

  fetchRecords()
})
</script>

<template>
  <div class="workshop-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle">{{ subtitle }}</p>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Workshop</span>
          <span>/</span>
          <span class="active">{{ title }}</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" type="button" :disabled="loading" @click="resetFilters">
          Reset
        </button>
        <button class="btn btn-light" type="button" :disabled="loading" @click="fetchRecords">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="btn btn-primary" type="button" @click="openAddModal">
          + Add
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>Total</p>
        <h3>{{ records.length }}</h3>
        <span>{{ title }} records</span>
      </article>
      <article class="summary-card blue">
        <p>Active</p>
        <h3>{{ activeCount }}</h3>
        <span>Available records</span>
      </article>
      <article class="summary-card amber">
        <p>Other Status</p>
        <h3>{{ inactiveCount }}</h3>
        <span>Inactive, closed, or pending</span>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input v-model="search" type="text" class="search-input" placeholder="Search..." />
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <span class="results-count">{{ filteredRecords.length }} results</span>
    </section>

    <section class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="empty-state">Loading {{ title }}...</td>
            </tr>
            <tr v-else-if="filteredRecords.length === 0">
              <td colspan="7" class="empty-state">No records found.</td>
            </tr>
            <tr v-for="record in filteredRecords" :key="record.id">
              <td class="id-cell">#{{ record.id }}</td>
              <td>
                <div class="primary-cell">
                  <strong>{{ record.name }}</strong>
                  <span>{{ record.raw.customer_name || record.raw.shop_name || '-' }}</span>
                </div>
              </td>
              <td>{{ record.code || '-' }}</td>
              <td>
                <span class="status-badge" :class="`status-${record.status.toLowerCase()}`">
                  {{ record.status }}
                </span>
              </td>
              <td>{{ record.description || '-' }}</td>
              <td>{{ formatDate(record.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button class="action-btn edit" type="button" @click="openEditModal(record)">
                    Edit
                  </button>
                  <button
                    class="action-btn delete"
                    type="button"
                    :disabled="submitting"
                    @click="removeRecord(record)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>{{ isEditing ? `Edit ${title}` : `Add ${title}` }}</h2>
            <p>Fill the required fields for this workshop module.</p>
          </div>
          <button class="close-btn" type="button" @click="closeModal">x</button>
        </div>

        <form class="modal-body" @submit.prevent="saveRecord">
          <div class="form-grid">
            <label class="form-group">
              <span>Name</span>
              <input v-model="form.name" class="form-input" type="text" placeholder="Name" />
            </label>

            <label class="form-group">
              <span>Code</span>
              <input v-model="form.code" class="form-input" type="text" placeholder="Code or reference" />
            </label>

            <label class="form-group">
              <span>Status</span>
              <select v-model="form.status" class="form-input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label class="form-group full-width">
              <span>Description</span>
              <textarea v-model="form.description" class="form-textarea" rows="3" placeholder="Notes" />
            </label>
          </div>

          <div class="modal-footer">
            <button class="btn btn-light" type="button" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" type="submit" :disabled="submitting">
              {{ submitting ? 'Saving...' : isEditing ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workshop-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header,
.toolbar-card,
.table-card,
.summary-card,
.modal-card,
.alert-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.page-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #64748b;
}

.breadcrumb,
.page-actions,
.toolbar-left,
.table-actions,
.modal-footer {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.breadcrumb {
  margin-top: 14px;
  color: #94a3b8;
  font-size: 13px;
}

.breadcrumb .active,
.id-cell {
  color: var(--brand-600);
  font-weight: 800;
}

.alert-card {
  padding: 14px 16px;
  font-weight: 700;
}

.alert-card.error {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
}

.summary-card p,
.summary-card h3 {
  margin: 0;
}

.summary-card p,
.summary-card span {
  color: #64748b;
}

.summary-card h3 {
  margin-top: 10px;
  font-size: 30px;
  color: #0f172a;
}

.summary-card span {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
}

.summary-card.emerald {
  border-top: 4px solid #16a34a;
}

.summary-card.blue {
  border-top: 4px solid #2563eb;
}

.summary-card.amber {
  border-top: 4px solid #f59e0b;
}

.toolbar-card {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.search-input,
.filter-select,
.form-input,
.form-textarea {
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  outline: none;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
}

.search-input,
.filter-select,
.form-input {
  min-height: 46px;
  padding: 0 14px;
}

.search-input {
  width: 280px;
}

.filter-select {
  min-width: 180px;
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  resize: vertical;
}

.results-count {
  color: #64748b;
  font-weight: 700;
}

.table-card {
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.data-table th {
  background: #f8fafc;
  color: #475569;
  text-align: left;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 800;
}

.data-table td {
  padding: 16px;
  border-top: 1px solid #f1f5f9;
  font-size: 14px;
  color: #0f172a;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-cell span {
  font-size: 12px;
  color: #64748b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-width: 88px;
  justify-content: center;
  padding: 7px 12px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.status-active,
.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.empty-state {
  padding: 42px 16px !important;
  text-align: center;
  color: #64748b;
}

.action-btn,
.btn {
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
}

.action-btn {
  padding: 8px 12px;
}

.action-btn.edit {
  background: #e0f2fe;
  color: #0369a1;
}

.action-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.btn {
  min-height: 44px;
  padding: 0 16px;
}

.btn-light {
  background: #f1f5f9;
  color: #334155;
}

.btn-primary {
  background: var(--brand-gradient);
  color: white;
}

.btn:disabled,
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 80;
}

.modal-card {
  width: 100%;
  max-width: 760px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 22px 24px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #0f172a;
}

.modal-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.close-btn {
  border: none;
  background: #f1f5f9;
  color: #334155;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 22px 24px 24px;
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
  font-weight: 700;
  color: #334155;
}

.full-width {
  grid-column: 1 / -1;
}

.modal-footer {
  justify-content: flex-end;
  margin-top: 22px;
}

@media (max-width: 992px) {
  .summary-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-card {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
