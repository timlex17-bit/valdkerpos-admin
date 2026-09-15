<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/apiError'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { translatedModuleLabel } from '@/utils/menuLabels'
import { firstAccessibleRoute } from '@/utils/menuPermissions'
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
const { t, te, locale } = useI18n()

// The wrappers pass English title and subtitle; the translated module name
// and description win whenever the current language has them.
const pageTitle = computed(() => translatedModuleLabel({ t, te }, props.moduleKey, props.title))
const pageSubtitle = computed(() => {
  const key = `workshopPage.subtitles.${props.moduleKey}`
  return te(key) ? t(key) : props.subtitle
})

function statusLabel(status: string) {
  const key = `workshopPage.statuses.${String(status || '').toLowerCase()}`
  return te(key) ? t(key) : status
}

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
    errorMessage.value = getApiErrorMessage(error, t('workshopPage.loadFailed', { name: pageTitle.value }))
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
    window.alert(t('workshopPage.nameRequired'))
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
    window.alert(getApiErrorMessage(error, t('workshopPage.saveFailed', { name: pageTitle.value })))
  } finally {
    submitting.value = false
  }
}

async function removeRecord(record: WorkshopRecord) {
  const confirmed = window.confirm(t('workshopPage.deleteConfirm', { name: record.name }))
  if (!confirmed) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await deleteWorkshopRecord(props.moduleKey, record.id)
    await fetchRecords()
  } catch (error: any) {
    window.alert(getApiErrorMessage(error, t('workshopPage.deleteFailed', { name: pageTitle.value })))
  } finally {
    submitting.value = false
  }
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale.value === 'id' ? 'id-ID' : locale.value === 'tet' ? 'pt-PT' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

onMounted(() => {
  const user = parseStoredJson<Record<string, any> | null>('user', null)
  if (!canShowModule(props.moduleKey, user)) {
    sessionStorage.setItem('module_access_message', 'access.moduleUnavailable')
    router.replace(firstAccessibleRoute(user))
    return
  }

  fetchRecords()
})
</script>

<template>
  <div class="workshop-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="page-subtitle">{{ pageSubtitle }}</p>
        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>/</span>
          <span>{{ t('menu.workshop') }}</span>
          <span>/</span>
          <span class="active">{{ pageTitle }}</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" type="button" :disabled="loading" @click="resetFilters">
          {{ t('common.reset') }}
        </button>
        <button class="btn btn-light" type="button" :disabled="loading" @click="fetchRecords">
          {{ loading ? t('dashboardPage.refreshing') : t('common.refresh') }}
        </button>
        <button class="btn btn-primary" type="button" @click="openAddModal">
          + {{ t('workshopPage.add') }}
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>{{ t('common.total') }}</p>
        <h3>{{ records.length }}</h3>
        <span>{{ t('workshopPage.records', { name: pageTitle }) }}</span>
      </article>
      <article class="summary-card blue">
        <p>{{ t('workshopPage.statuses.active') }}</p>
        <h3>{{ activeCount }}</h3>
        <span>{{ t('workshopPage.availableRecords') }}</span>
      </article>
      <article class="summary-card amber">
        <p>{{ t('workshopPage.otherStatus') }}</p>
        <h3>{{ inactiveCount }}</h3>
        <span>{{ t('workshopPage.otherStatusNote') }}</span>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input v-model="search" type="text" class="search-input" :placeholder="t('workshopPage.search')" />
        <select v-model="statusFilter" class="filter-select">
          <option value="">{{ t('workshopPage.allStatus') }}</option>
          <option value="active">{{ t('workshopPage.statuses.active') }}</option>
          <option value="inactive">{{ t('workshopPage.statuses.inactive') }}</option>
          <option value="pending">{{ t('workshopPage.statuses.pending') }}</option>
          <option value="completed">{{ t('workshopPage.statuses.completed') }}</option>
        </select>
      </div>
      <span class="results-count">{{ t('common.resultsCount', { count: filteredRecords.length }) }}</span>
    </section>

    <section class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('workshopPage.id') }}</th>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('workshopPage.code') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.description') }}</th>
              <th>{{ t('workshopPage.created') }}</th>
              <th>{{ t('common.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="empty-state">{{ t('workshopPage.loading', { name: pageTitle }) }}</td>
            </tr>
            <tr v-else-if="filteredRecords.length === 0">
              <td colspan="7" class="empty-state">{{ t('workshopPage.noRecords') }}</td>
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
                  {{ statusLabel(record.status) }}
                </span>
              </td>
              <td>{{ record.description || '-' }}</td>
              <td>{{ formatDate(record.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button class="action-btn edit" type="button" @click="openEditModal(record)">
                    {{ t('common.edit') }}
                  </button>
                  <button
                    class="action-btn delete"
                    type="button"
                    :disabled="submitting"
                    @click="removeRecord(record)"
                  >
                    {{ t('common.delete') }}
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
            <h2>{{ isEditing ? t('workshopPage.editTitle', { name: pageTitle }) : t('workshopPage.addTitle', { name: pageTitle }) }}</h2>
            <p>{{ t('workshopPage.formSubtitle') }}</p>
          </div>
          <button class="close-btn" type="button" @click="closeModal">×</button>
        </div>

        <form class="modal-body" @submit.prevent="saveRecord">
          <div class="form-grid">
            <label class="form-group">
              <span>{{ t('common.name') }}</span>
              <input v-model="form.name" class="form-input" type="text" :placeholder="t('common.name')" />
            </label>

            <label class="form-group">
              <span>{{ t('workshopPage.code') }}</span>
              <input v-model="form.code" class="form-input" type="text" :placeholder="t('workshopPage.codePlaceholder')" />
            </label>

            <label class="form-group">
              <span>{{ t('common.status') }}</span>
              <select v-model="form.status" class="form-input">
                <option value="active">{{ t('workshopPage.statuses.active') }}</option>
                <option value="inactive">{{ t('workshopPage.statuses.inactive') }}</option>
                <option value="pending">{{ t('workshopPage.statuses.pending') }}</option>
                <option value="completed">{{ t('workshopPage.statuses.completed') }}</option>
              </select>
            </label>

            <label class="form-group full-width">
              <span>{{ t('common.description') }}</span>
              <textarea v-model="form.description" class="form-textarea" rows="3" :placeholder="t('common.notes')" />
            </label>
          </div>

          <div class="modal-footer">
            <button class="btn btn-light" type="button" @click="closeModal">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="submitting">
              {{ submitting ? t('settingsPage.saving') : isEditing ? t('common.update') : t('common.save') }}
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
