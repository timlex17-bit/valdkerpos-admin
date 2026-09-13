<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  createTable,
  deleteTable,
  extractFieldErrors,
  listTables,
  updateTable,
  type RestaurantTable,
  type TablePayload,
} from '@/services/restaurantService'
import { getApiErrorMessage } from '@/utils/apiError'
import { canShowModule, parseStoredJson } from '@/utils/moduleVisibility'

const router = useRouter()
const { t } = useI18n()

const tables = ref<RestaurantTable[]>([])
const search = ref('')
const areaFilter = ref('')
const statusFilter = ref('')
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const errorMessage = ref('')

/** Per-field messages from the API, keyed by field name. */
const fieldErrors = reactive<Record<string, string>>({})

const form = reactive<TablePayload>({
  name: '',
  capacity: 2,
  area: '',
  is_active: true,
})

const areas = computed(() => {
  const found = tables.value.map((table) => table.area).filter(Boolean)
  return [...new Set(found)].sort()
})

const filteredTables = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return tables.value.filter((table) => {
    const haystack = [table.name, table.area].join(' ').toLowerCase()
    const matchesSearch = !keyword || haystack.includes(keyword)
    const matchesArea = !areaFilter.value || table.area === areaFilter.value
    const matchesStatus = !statusFilter.value || table.status === statusFilter.value

    return matchesSearch && matchesArea && matchesStatus
  })
})

// Counts read straight off the server's `status`. Nothing is derived from
// order data on the client - the server is the only thing that knows.
const occupiedCount = computed(
  () => tables.value.filter((table) => table.status === 'occupied').length,
)
const emptyCount = computed(() => tables.value.length - occupiedCount.value)

function statusLabel(status: string) {
  return status === 'occupied' ? t('tablesPage.statusOccupied') : t('tablesPage.statusEmpty')
}

function clearFieldErrors() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

function resetFilters() {
  search.value = ''
  areaFilter.value = ''
  statusFilter.value = ''
}

function resetForm() {
  form.name = ''
  form.capacity = 2
  form.area = ''
  form.is_active = true
  clearFieldErrors()
}

/**
 * The only way to refresh `status` is to re-read the list: it is derived
 * server-side on every read and has no client-side representation to update.
 */
async function fetchTables() {
  loading.value = true
  errorMessage.value = ''

  try {
    tables.value = await listTables()
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('tablesPage.failedLoad'))
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

function openEditModal(table: RestaurantTable) {
  clearFieldErrors()
  // `status` is deliberately not copied into the form - it is not writable.
  form.name = table.name
  form.capacity = table.capacity
  form.area = table.area
  form.is_active = table.is_active
  isEditing.value = true
  editingId.value = table.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

async function saveTable() {
  clearFieldErrors()

  if (!form.name.trim()) {
    fieldErrors.name = t('tablesPage.nameRequired')
    return
  }

  if (!form.capacity || Number(form.capacity) < 1) {
    fieldErrors.capacity = t('tablesPage.capacityRequired')
    return
  }

  submitting.value = true
  errorMessage.value = ''

  const payload: TablePayload = {
    name: form.name.trim(),
    capacity: Number(form.capacity),
    area: form.area.trim(),
    is_active: form.is_active,
  }

  try {
    if (isEditing.value && editingId.value !== null) {
      await updateTable(editingId.value, payload)
    } else {
      await createTable(payload)
    }

    closeModal()
    await fetchTables()
  } catch (error: any) {
    // A duplicate name comes back as {"name": ["A table with this name
    // already exists."]}. It belongs against the input that caused it, not in
    // a banner at the top of the page where it reads as a generic failure.
    const fields = extractFieldErrors(error)
    Object.assign(fieldErrors, fields)

    if (!Object.keys(fields).length) {
      errorMessage.value = getApiErrorMessage(error, t('tablesPage.failedSave'))
    }
  } finally {
    submitting.value = false
  }
}

async function removeTable(table: RestaurantTable) {
  const confirmed = window.confirm(t('tablesPage.confirmDelete', { name: table.name }))
  if (!confirmed) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await deleteTable(table.id)
    await fetchTables()
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('tablesPage.failedDelete'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const user = parseStoredJson<Record<string, any> | null>('user', null)
  if (!canShowModule('tables', user)) {
    sessionStorage.setItem(
      'module_access_message',
      'This module is not available for your business type, plan, or role.',
    )
    router.replace('/dashboard')
    return
  }

  fetchTables()
})
</script>

<template>
  <div class="restaurant-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('tablesPage.title') }}</h1>
        <p class="page-subtitle">{{ t('tablesPage.subtitle') }}</p>
        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>/</span>
          <span>{{ t('tablesPage.breadcrumbRestaurant') }}</span>
          <span>/</span>
          <span class="active">{{ t('tablesPage.title') }}</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" type="button" :disabled="loading" @click="resetFilters">
          {{ t('common.reset') }}
        </button>
        <button class="btn btn-light" type="button" :disabled="loading" @click="fetchTables">
          {{ loading ? t('common.loading') : t('usersPage.refresh') }}
        </button>
        <button class="btn btn-primary" type="button" @click="openAddModal">
          + {{ t('tablesPage.addTable') }}
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>{{ t('tablesPage.totalTables') }}</p>
        <h3>{{ tables.length }}</h3>
        <span>{{ t('tablesPage.title') }}</span>
      </article>
      <article class="summary-card amber">
        <p>{{ t('tablesPage.occupiedTables') }}</p>
        <h3>{{ occupiedCount }}</h3>
        <span>{{ t('tablesPage.boardSubtitle') }}</span>
      </article>
      <article class="summary-card blue">
        <p>{{ t('tablesPage.emptyTables') }}</p>
        <h3>{{ emptyCount }}</h3>
        <span>{{ t('tablesPage.boardSubtitle') }}</span>
      </article>
    </section>

    <!-- Status board. Read-only by design: there is no control here to change
         a table's status, because the API has none - status follows the
         orders attached to the table. -->
    <section class="table-card board-card">
      <div class="board-head">
        <div>
          <h2>{{ t('tablesPage.board') }}</h2>
          <p>{{ t('tablesPage.statusNote') }}</p>
        </div>
      </div>

      <div v-if="loading && !tables.length" class="empty-state">
        {{ t('tablesPage.loading') }}
      </div>
      <div v-else-if="!filteredTables.length" class="empty-state">
        {{ t('tablesPage.noTables') }}
      </div>
      <div v-else class="board-grid">
        <article
          v-for="table in filteredTables"
          :key="table.id"
          class="board-tile"
          :class="table.status"
        >
          <div class="tile-top">
            <strong>{{ table.name }}</strong>
            <span class="status-pill" :class="table.status">{{ statusLabel(table.status) }}</span>
          </div>
          <p class="tile-area">{{ table.area || t('tablesPage.noArea') }}</p>
          <p class="tile-seats">{{ table.capacity }} {{ t('tablesPage.seats') }}</p>
          <span v-if="!table.is_active" class="tile-inactive">{{ t('tablesPage.inactive') }}</span>
        </article>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input
          v-model="search"
          type="text"
          class="search-input"
          :placeholder="t('tablesPage.searchPlaceholder')"
        />
        <select v-model="areaFilter" class="filter-select">
          <option value="">{{ t('tablesPage.allAreas') }}</option>
          <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">{{ t('tablesPage.allStatus') }}</option>
          <option value="occupied">{{ t('tablesPage.statusOccupied') }}</option>
          <option value="empty">{{ t('tablesPage.statusEmpty') }}</option>
        </select>
      </div>
      <span class="results-count">{{ filteredTables.length }}</span>
    </section>

    <section class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('tablesPage.name') }}</th>
              <th>{{ t('tablesPage.area') }}</th>
              <th>{{ t('tablesPage.capacity') }}</th>
              <th>{{ t('tablesPage.status') }}</th>
              <!-- The is_active flag, which is a different thing from the
                   server-derived occupancy status in the column before it. -->
              <th>{{ t('tablesPage.isActive') }}</th>
              <th>{{ t('common.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !tables.length">
              <td colspan="6" class="empty-state">{{ t('tablesPage.loading') }}</td>
            </tr>
            <tr v-else-if="!filteredTables.length">
              <td colspan="6" class="empty-state">{{ t('tablesPage.noTables') }}</td>
            </tr>
            <tr v-for="table in filteredTables" :key="table.id">
              <td>
                <div class="primary-cell">
                  <strong>{{ table.name }}</strong>
                </div>
              </td>
              <td>{{ table.area || '-' }}</td>
              <td>{{ table.capacity }}</td>
              <td>
                <span class="status-pill" :class="table.status">
                  {{ statusLabel(table.status) }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="table.is_active ? 'active' : 'muted'">
                  {{ table.is_active ? t('tablesPage.isActive') : t('tablesPage.inactive') }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-light btn-sm" type="button" @click="openEditModal(table)">
                    {{ t('common.edit') }}
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    type="button"
                    :disabled="submitting"
                    @click="removeTable(table)"
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
            <h2>{{ isEditing ? t('tablesPage.editTable') : t('tablesPage.addTable') }}</h2>
            <p>{{ t('tablesPage.formSubtitle') }}</p>
          </div>
          <button class="close-btn" type="button" @click="closeModal">x</button>
        </div>

        <form class="modal-body" @submit.prevent="saveTable">
          <div class="form-grid">
            <label class="form-group">
              <span>{{ t('tablesPage.name') }}</span>
              <input
                v-model="form.name"
                class="form-input"
                :class="{ invalid: fieldErrors.name }"
                type="text"
                maxlength="20"
                :placeholder="t('tablesPage.namePlaceholder')"
              />
              <small v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</small>
            </label>

            <label class="form-group">
              <span>{{ t('tablesPage.capacity') }}</span>
              <input
                v-model.number="form.capacity"
                class="form-input"
                :class="{ invalid: fieldErrors.capacity }"
                type="number"
                min="1"
              />
              <small v-if="fieldErrors.capacity" class="field-error">
                {{ fieldErrors.capacity }}
              </small>
            </label>

            <label class="form-group">
              <span>{{ t('tablesPage.area') }}</span>
              <input
                v-model="form.area"
                class="form-input"
                :class="{ invalid: fieldErrors.area }"
                type="text"
                maxlength="100"
                :placeholder="t('tablesPage.areaPlaceholder')"
              />
              <small v-if="fieldErrors.area" class="field-error">{{ fieldErrors.area }}</small>
            </label>

            <label class="form-group">
              <span>{{ t('tablesPage.isActive') }}</span>
              <span class="checkbox-row">
                <input v-model="form.is_active" type="checkbox" />
                <span>{{ form.is_active ? t('tablesPage.isActive') : t('tablesPage.inactive') }}</span>
              </span>
            </label>
          </div>

          <!-- No status control: the field is server-derived and read-only. -->
          <p class="form-note">{{ t('tablesPage.statusNote') }}</p>

          <div class="modal-footer">
            <button class="btn btn-light" type="button" @click="closeModal">
              {{ t('common.cancel') }}
            </button>
            <button class="btn btn-primary" type="submit" :disabled="submitting">
              {{ submitting ? t('common.loading') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.restaurant-page {
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
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.page-header {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
}

.breadcrumb,
.page-actions,
.toolbar-left,
.table-actions,
.modal-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.breadcrumb {
  margin-top: 10px;
  font-size: 13px;
  color: #94a3b8;
}

.breadcrumb .active {
  color: #16a34a;
  font-weight: 700;
}

.alert-card {
  padding: 14px 16px;
  font-weight: 600;
}

.alert-card.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.summary-card {
  padding: 18px 20px;
}

.summary-card p,
.summary-card span {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.summary-card h3 {
  margin: 6px 0;
  font-size: 30px;
  font-weight: 800;
  color: #0f172a;
}

.summary-card.emerald {
  border-top: 3px solid #16a34a;
}

.summary-card.blue {
  border-top: 3px solid #2563eb;
}

.summary-card.amber {
  border-top: 3px solid #f59e0b;
}

.board-card {
  padding: 20px 22px;
}

.board-head h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
}

.board-head p {
  margin: 6px 0 14px;
  color: #64748b;
  font-size: 13px;
  max-width: 720px;
  line-height: 1.5;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.board-tile {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  background: #f8fafc;
}

.board-tile.occupied {
  background: #fffbeb;
  border-color: #fde68a;
}

.board-tile.empty {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.tile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tile-top strong {
  font-size: 17px;
  color: #0f172a;
}

.tile-area,
.tile-seats {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
}

.tile-inactive {
  display: inline-block;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 800;
}

.status-pill.occupied {
  background: #fef3c7;
  color: #92400e;
}

.status-pill.empty,
.status-pill.active {
  background: #dcfce7;
  color: #166534;
}

.status-pill.muted {
  background: #f1f5f9;
  color: #64748b;
}

.toolbar-card {
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input,
.filter-select,
.form-input {
  min-height: 42px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 0 12px;
  outline: none;
  color: #0f172a;
  background: #fff;
}

.search-input {
  min-width: 240px;
}

.form-input.invalid {
  border-color: #fca5a5;
  background: #fef2f2;
}

.results-count {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.table-card {
  padding: 6px;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #0f172a;
}

.primary-cell strong {
  font-weight: 700;
}

.empty-state {
  padding: 26px 16px;
  text-align: center;
  color: #94a3b8;
}

.btn {
  min-height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  min-height: 34px;
  padding: 0 10px;
  font-size: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

.btn-light {
  background: #fff;
  border: 1px solid #dbe3ef;
  color: #334155;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 60;
}

.modal-card {
  width: min(620px, 100%);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.modal-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
}

.modal-body {
  padding: 18px 22px 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  font-weight: 600;
}

.field-error {
  color: #b91c1c;
  font-weight: 700;
  font-size: 12px;
}

.form-note {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.modal-footer {
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
