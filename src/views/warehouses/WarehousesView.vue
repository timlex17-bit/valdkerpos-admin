<template>
  <div class="warehouse-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('warehousesPage.title') }}</h1>
        <p class="page-subtitle">
          {{ t('warehousesPage.subtitle') }}
        </p>

        <div class="breadcrumb">
          <span>{{ t('warehousesPage.breadcrumbHome') }}</span>
          <span>›</span>
          <span>{{ t('warehousesPage.breadcrumbInventory') }}</span>
          <span>›</span>
          <span class="active">{{ t('warehousesPage.title') }}</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" @click="resetFilters" :disabled="loading">
          {{ t('warehousesPage.resetButton') }}
        </button>
        <button class="btn btn-light" @click="fetchWarehouses" :disabled="loading">
          {{ loading ? t('warehousesPage.refreshingButton') : t('warehousesPage.refreshButton') }}
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          + {{ t('warehousesPage.addWarehouse') }}
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>{{ t('warehousesPage.totalWarehouses') }}</p>
        <h3>{{ warehouses.length }}</h3>
        <span>{{ t('warehousesPage.summaryWarehouseText') }}</span>
      </article>

      <article class="summary-card blue">
        <p>{{ t('warehousesPage.activeWarehouses') }}</p>
        <h3>{{ activeCount }}</h3>
        <span>{{ t('warehousesPage.summaryActiveText') }}</span>
      </article>

      <article class="summary-card amber">
        <p>{{ t('warehousesPage.inactiveWarehouses') }}</p>
        <h3>{{ inactiveCount }}</h3>
        <span>{{ t('warehousesPage.summaryInactiveText') }}</span>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input
          v-model="search"
          type="text"
          class="search-input"
          :placeholder="t('warehousesPage.searchPlaceholder')"
        />

        <select v-model="statusFilter" class="filter-select">
          <option value="">{{ t('warehousesPage.allStatus') }}</option>
          <option value="active">{{ t('warehousesPage.activeLabel') }}</option>
          <option value="inactive">{{ t('warehousesPage.inactiveLabel') }}</option>
          <option value="default">{{ t('warehousesPage.defaultLabel') }}</option>
        </select>
      </div>

      <div class="toolbar-right">
        <span class="results-count">
          {{ t('warehousesPage.resultsCount', { count: filteredWarehouses.length }) }}
        </span>
      </div>
    </section>

    <section class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ t('warehousesPage.nameLabel') }}</th>
              <th>{{ t('warehousesPage.codeLabel') }}</th>
              <th>{{ t('warehousesPage.locationLabel') }}</th>
              <th>{{ t('warehousesPage.defaultLabel') }}</th>
              <th>{{ t('warehousesPage.activeLabel') }}</th>
              <th>{{ t('warehousesPage.createdAtLabel') }}</th>
              <th>{{ t('warehousesPage.actionsLabel') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="empty-state">
                <div class="empty-wrap">
                  <h3>{{ t('warehousesPage.loadingTitle') }}</h3>
                  <p>{{ t('warehousesPage.loadingSubtitle') }}</p>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredWarehouses.length === 0">
              <td colspan="8" class="empty-state">
                <div class="empty-wrap">
                  <h3>{{ t('warehousesPage.emptyTitle') }}</h3>
                  <p>{{ t('warehousesPage.emptySubtitle') }}</p>
                </div>
              </td>
            </tr>

            <tr v-for="warehouse in filteredWarehouses" :key="warehouse.id">
              <td class="id-cell">#{{ warehouse.id }}</td>
              <td>
                <div class="primary-cell">
                  <strong>{{ warehouse.name }}</strong>
                  <span>{{ warehouse.shop_name || warehouse.shop_code || '-' }}</span>
                </div>
              </td>
              <td>{{ warehouse.code || '-' }}</td>
              <td>{{ warehouse.location || '-' }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="warehouse.is_default ? 'status-default' : 'status-neutral'"
                >
                  {{
                    warehouse.is_default
                      ? t('warehousesPage.defaultYes')
                      : t('warehousesPage.defaultNo')
                  }}
                </span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="warehouse.is_active ? 'status-active' : 'status-inactive'"
                >
                  {{
                    warehouse.is_active
                      ? t('warehousesPage.activeLabel')
                      : t('warehousesPage.inactiveLabel')
                  }}
                </span>
              </td>
              <td>{{ formatDate(warehouse.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button class="action-btn edit" @click="openEditModal(warehouse)">
                    {{ t('warehousesPage.editButton') }}
                  </button>
                  <button
                    class="action-btn delete"
                    @click="removeWarehouse(warehouse)"
                    :disabled="submitting"
                  >
                    {{ t('warehousesPage.deleteButton') }}
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
            <h2>
              {{ isEditing ? t('warehousesPage.editWarehouse') : t('warehousesPage.addWarehouse') }}
            </h2>
            <p>{{ t('warehousesPage.formSubtitle') }}</p>
          </div>

          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <form class="modal-body" @submit.prevent="saveWarehouse">
          <div class="form-grid">
            <div class="form-group">
              <label>{{ t('warehousesPage.nameLabel') }}</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                :placeholder="t('warehousesPage.namePlaceholder')"
              />
            </div>

            <div class="form-group">
              <label>{{ t('warehousesPage.codeLabel') }}</label>
              <input
                v-model="form.code"
                type="text"
                class="form-input"
                :placeholder="t('warehousesPage.codePlaceholder')"
              />
            </div>

            <div class="form-group full-width">
              <label>{{ t('warehousesPage.locationLabel') }}</label>
              <textarea
                v-model="form.location"
                class="form-textarea"
                rows="3"
                :placeholder="t('warehousesPage.locationPlaceholder')"
              />
            </div>

            <div class="form-group">
              <ToggleField
                v-model="form.is_active"
                :label="t('common.status')"
                :description="t('warehousesPage.activeWarehouseLabel')"
              />
            </div>

            <div class="form-group">
              <ToggleField
                v-model="form.is_default"
                :label="t('warehousesPage.defaultLabel')"
                :description="t('warehousesPage.defaultWarehouseLabel')"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="closeModal">
              {{ t('warehousesPage.cancelButton') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{
                submitting
                  ? t('warehousesPage.savingButton')
                  : isEditing
                    ? t('warehousesPage.updateButton')
                    : t('warehousesPage.saveButton')
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { getApiErrorMessage } from '@/utils/apiError'
import { ENDPOINTS } from '@/services/endpoints'
import { normalizeApiList } from '@/utils/apiData'
import ToggleField from '@/components/form/ToggleField.vue'

type Warehouse = {
  id: number
  shop_id: number
  shop_name: string
  shop_code: string
  name: string
  code: string
  location: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

type WarehousePayload = {
  name: string
  code: string
  location: string
  is_active: boolean
  is_default: boolean
}

const { t, locale } = useI18n()

const search = ref('')
const statusFilter = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const warehouses = ref<Warehouse[]>([])

const form = reactive<WarehousePayload>({
  name: '',
  code: '',
  location: '',
  is_active: true,
  is_default: false,
})

const filteredWarehouses = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return warehouses.value.filter((item) => {
    const matchesSearch =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.code.toLowerCase().includes(keyword) ||
      (item.location || '').toLowerCase().includes(keyword) ||
      (item.shop_name || '').toLowerCase().includes(keyword)

    const matchesStatus =
      statusFilter.value === ''
        ? true
        : statusFilter.value === 'active'
          ? item.is_active
          : statusFilter.value === 'inactive'
            ? !item.is_active
            : item.is_default

    return matchesSearch && matchesStatus
  })
})

const activeCount = computed(() => warehouses.value.filter((item) => item.is_active).length)
const inactiveCount = computed(() => warehouses.value.filter((item) => !item.is_active).length)

const resetForm = () => {
  form.name = ''
  form.code = ''
  form.location = ''
  form.is_active = true
  form.is_default = false
}

const resetFilters = () => {
  search.value = ''
  statusFilter.value = ''
}

const normalizeWarehouse = (item: any): Warehouse => ({
  id: Number(item.id),
  shop_id: Number(item.shop_id ?? 0),
  shop_name: item.shop_name ?? '',
  shop_code: item.shop_code ?? '',
  name: item.name ?? '',
  code: item.code ?? '',
  location: item.location ?? '',
  is_active: Boolean(item.is_active),
  is_default: Boolean(item.is_default),
  created_at: item.created_at ?? '',
  updated_at: item.updated_at ?? '',
})

const fetchWarehouses = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get(ENDPOINTS.WAREHOUSES)
    warehouses.value = normalizeApiList(data).map(normalizeWarehouse)
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('warehousesPage.fetchError'))
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  resetForm()
  isEditing.value = false
  editingId.value = null
  showModal.value = true
}

const openEditModal = (warehouse: Warehouse) => {
  form.name = warehouse.name
  form.code = warehouse.code
  form.location = warehouse.location || ''
  form.is_active = warehouse.is_active
  form.is_default = warehouse.is_default

  isEditing.value = true
  editingId.value = warehouse.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveWarehouse = async () => {
  if (!form.name.trim()) {
    window.alert(t('warehousesPage.validationNameRequired'))
    return
  }

  if (!form.code.trim()) {
    window.alert(t('warehousesPage.validationCodeRequired'))
    return
  }

  submitting.value = true
  errorMessage.value = ''

  const payload: WarehousePayload = {
    name: form.name.trim(),
    code: form.code.trim(),
    location: form.location.trim(),
    is_active: form.is_active,
    is_default: form.is_default,
  }

  try {
    if (isEditing.value && editingId.value !== null) {
      await api.put(`${ENDPOINTS.WAREHOUSES}${editingId.value}/`, payload)
    } else {
      await api.post(ENDPOINTS.WAREHOUSES, payload)
    }

    closeModal()
    resetForm()
    await fetchWarehouses()
  } catch (error: any) {
    window.alert(
      getApiErrorMessage(
        error,
        isEditing.value
          ? t('warehousesPage.updateError')
          : t('warehousesPage.createError'),
      ),
    )
  } finally {
    submitting.value = false
  }
}

const removeWarehouse = async (warehouse: Warehouse) => {
  const confirmed = window.confirm(
    t('warehousesPage.deleteConfirmWithName', { name: warehouse.name }),
  )
  if (!confirmed) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await api.delete(`${ENDPOINTS.WAREHOUSES}${warehouse.id}/`)
    await fetchWarehouses()
  } catch (error: any) {
    window.alert(getApiErrorMessage(error, t('warehousesPage.deleteError')))
  } finally {
    submitting.value = false
  }
}

const formatDate = (value: string) => {
  if (!value) return '-'

  const currentLocale =
    locale.value === 'id'
      ? 'id-ID'
      : locale.value === 'tet'
        ? 'id-ID'
        : 'en-US'

  return new Intl.DateTimeFormat(currentLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

onMounted(() => {
  fetchWarehouses()
})
</script>

<style scoped>
.warehouse-page {
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
  max-width: 760px;
}

.breadcrumb {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
  font-size: 13px;
  color: #94a3b8;
}

.breadcrumb .active {
  color: var(--brand-600);
  font-weight: 700;
}

.page-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.alert-card {
  padding: 14px 16px;
  font-size: 14px;
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

.summary-card p {
  margin: 0 0 10px;
  font-size: 14px;
  color: #64748b;
}

.summary-card h3 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  color: #0f172a;
}

.summary-card span {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  color: #64748b;
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
  flex-wrap: wrap;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input,
.filter-select,
.form-input,
.form-textarea {
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  outline: none;
  transition: 0.2s ease;
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

.search-input:focus,
.filter-select:focus,
.form-input:focus,
.form-textarea:focus {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 4px rgba(98, 4, 191, 0.12);
}

.results-count {
  font-size: 14px;
  color: #64748b;
  font-weight: 700;
}

.table-card {
  overflow: hidden;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.data-table thead th {
  background: #f8fafc;
  color: #475569;
  text-align: left;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 800;
  border-bottom: 1px solid #e5e7eb;
}

.data-table tbody td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #0f172a;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.id-cell {
  font-weight: 800;
  color: #16a34a;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-cell strong {
  font-size: 14px;
  color: #0f172a;
}

.primary-cell span {
  font-size: 12px;
  color: #64748b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.status-default {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-neutral {
  background: #f1f5f9;
  color: #475569;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  border: none;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn:disabled,
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.edit {
  background: #e0f2fe;
  color: #0369a1;
}

.action-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.empty-state {
  padding: 42px 16px !important;
}

.empty-wrap {
  text-align: center;
}

.empty-wrap h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 18px;
}

.empty-wrap p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
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
  align-items: flex-start;
  padding: 22px 24px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.modal-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.close-btn {
  border: none;
  background: #f1f5f9;
  color: #334155;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 24px;
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
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.full-width {
  grid-column: 1 / -1;
}

.checkbox-group {
  padding-top: 4px;
}

.checkbox-label {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 700;
  color: #334155;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.btn {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;
}

.btn-light {
  background: #f1f5f9;
  color: #334155;
}

.btn-light:hover {
  background: #e2e8f0;
}

.btn-primary {
  background: var(--brand-gradient);
  color: white;
}

.btn-primary:hover {
  filter: brightness(0.98);
}

@media (max-width: 992px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .page-header {
    padding: 18px;
  }

  .page-title {
    font-size: 24px;
  }

  .toolbar-card,
  .summary-card,
  .modal-body {
    padding-left: 16px;
    padding-right: 16px;
  }

  .modal-header {
    padding: 18px 16px 14px;
  }

  .page-actions,
  .modal-footer {
    width: 100%;
  }

  .page-actions .btn,
  .modal-footer .btn {
    width: 100%;
  }
}
</style>
