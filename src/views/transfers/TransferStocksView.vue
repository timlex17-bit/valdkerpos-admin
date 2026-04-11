<template>
  <div class="transfer-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('transferStocksPage.title') }}</h1>
        <p class="page-subtitle">
          {{ t('transferStocksPage.subtitle') }}
        </p>

        <div class="breadcrumb">
          <span>{{ t('transferStocksPage.breadcrumbHome') }}</span>
          <span>›</span>
          <span>{{ t('transferStocksPage.breadcrumbInventory') }}</span>
          <span>›</span>
          <span class="active">{{ t('transferStocksPage.title') }}</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" @click="resetFilters" :disabled="loading">
          {{ t('transferStocksPage.resetButton') }}
        </button>
        <button class="btn btn-light" @click="loadData" :disabled="loading">
          {{ loading ? t('transferStocksPage.refreshingButton') : t('transferStocksPage.refreshButton') }}
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          + {{ t('transferStocksPage.addTransfer') }}
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>{{ t('transferStocksPage.totalTransfers') }}</p>
        <h3>{{ transfers.length }}</h3>
        <span>{{ t('transferStocksPage.summaryTransfersText') }}</span>
      </article>

      <article class="summary-card blue">
        <p>{{ t('transferStocksPage.totalQuantity') }}</p>
        <h3>{{ totalQuantity }}</h3>
        <span>{{ t('transferStocksPage.summaryQuantityText') }}</span>
      </article>

      <article class="summary-card amber">
        <p>{{ t('transferStocksPage.completedTransfers') }}</p>
        <h3>{{ completedCount }}</h3>
        <span>{{ t('transferStocksPage.summaryCompletedText') }}</span>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input
          v-model="search"
          type="text"
          class="search-input"
          :placeholder="t('transferStocksPage.searchPlaceholder')"
        />

        <select v-model="statusFilter" class="filter-select">
          <option value="">{{ t('transferStocksPage.allStatus') }}</option>
          <option value="DRAFT">{{ t('transferStocksPage.statusDraft') }}</option>
          <option value="COMPLETED">{{ t('transferStocksPage.statusCompleted') }}</option>
          <option value="CANCELLED">{{ t('transferStocksPage.statusCancelled') }}</option>
        </select>
      </div>

      <div class="toolbar-right">
        <span class="results-count">
          {{ t('transferStocksPage.resultsCount', { count: filteredTransfers.length }) }}
        </span>
      </div>
    </section>

    <section class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ t('transferStocksPage.referenceLabel') }}</th>
              <th>{{ t('transferStocksPage.fromWarehouseLabel') }}</th>
              <th>{{ t('transferStocksPage.toWarehouseLabel') }}</th>
              <th>{{ t('transferStocksPage.quantityLabel') }}</th>
              <th>{{ t('transferStocksPage.itemsLabel') }}</th>
              <th>{{ t('transferStocksPage.statusLabel') }}</th>
              <th>{{ t('transferStocksPage.createdAtLabel') }}</th>
              <th>{{ t('transferStocksPage.actionsLabel') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="empty-state">
                <div class="empty-wrap">
                  <h3>{{ t('transferStocksPage.loadingTitle') }}</h3>
                  <p>{{ t('transferStocksPage.loadingSubtitle') }}</p>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredTransfers.length === 0">
              <td colspan="9" class="empty-state">
                <div class="empty-wrap">
                  <h3>{{ t('transferStocksPage.emptyTitle') }}</h3>
                  <p>{{ t('transferStocksPage.emptySubtitle') }}</p>
                </div>
              </td>
            </tr>

            <tr v-for="item in filteredTransfers" :key="item.id">
              <td class="id-cell">#{{ item.id }}</td>
              <td>
                <div class="primary-cell">
                  <strong>{{ item.reference_no || '-' }}</strong>
                  <span>{{ item.note || '-' }}</span>
                </div>
              </td>
              <td>{{ item.from_warehouse_name || '-' }}</td>
              <td>{{ item.to_warehouse_name || '-' }}</td>
              <td>{{ transferQuantity(item) }}</td>
              <td>{{ item.items.length }}</td>
              <td>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td>{{ formatDate(item.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button
                    class="action-btn edit"
                    @click="openEditModal(item)"
                    :disabled="item.status !== 'DRAFT' || submitting"
                  >
                    {{ t('transferStocksPage.editButton') }}
                  </button>

                  <button
                    class="action-btn complete"
                    @click="completeTransfer(item)"
                    :disabled="item.status !== 'DRAFT' || submitting"
                  >
                    {{ t('transferStocksPage.completeButton') }}
                  </button>

                  <button
                    class="action-btn cancel"
                    @click="cancelTransfer(item)"
                    :disabled="item.status !== 'DRAFT' || submitting"
                  >
                    {{ t('transferStocksPage.cancelTransferButton') }}
                  </button>

                  <button
                    class="action-btn delete"
                    @click="removeTransfer(item)"
                    :disabled="submitting"
                  >
                    {{ t('transferStocksPage.deleteButton') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card modal-large">
        <div class="modal-header">
          <div>
            <h2>
              {{
                isEditing
                  ? t('transferStocksPage.editTransfer')
                  : t('transferStocksPage.addTransfer')
              }}
            </h2>
            <p>{{ t('transferStocksPage.formSubtitle') }}</p>
          </div>

          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <form class="modal-body" @submit.prevent="saveTransfer">
          <div class="form-grid">
            <div class="form-group">
              <label>{{ t('transferStocksPage.fromWarehouseLabel') }}</label>
              <select v-model.number="form.from_warehouse" class="form-input">
                <option :value="0">{{ t('transferStocksPage.selectWarehouse') }}</option>
                <option
                  v-for="warehouse in warehouses"
                  :key="warehouse.id"
                  :value="warehouse.id"
                >
                  {{ warehouse.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('transferStocksPage.toWarehouseLabel') }}</label>
              <select v-model.number="form.to_warehouse" class="form-input">
                <option :value="0">{{ t('transferStocksPage.selectWarehouse') }}</option>
                <option
                  v-for="warehouse in warehouses"
                  :key="warehouse.id"
                  :value="warehouse.id"
                >
                  {{ warehouse.name }}
                </option>
              </select>
            </div>

            <div class="form-group full-width">
              <label>{{ t('transferStocksPage.noteLabel') }}</label>
              <textarea
                v-model="form.note"
                class="form-textarea"
                rows="3"
                :placeholder="t('transferStocksPage.notePlaceholder')"
              />
            </div>
          </div>

          <div class="items-section">
            <div class="items-header">
              <h3>{{ t('transferStocksPage.itemsTitle') }}</h3>
              <button type="button" class="btn btn-light" @click="addItemRow">
                + {{ t('transferStocksPage.addItemButton') }}
              </button>
            </div>

            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="item-row"
            >
              <div class="form-group">
                <label>{{ t('transferStocksPage.productLabel') }}</label>
                <select v-model.number="item.product" class="form-input">
                  <option :value="0">{{ t('transferStocksPage.selectProduct') }}</option>
                  <option
                    v-for="product in productOptions"
                    :key="product.product"
                    :value="product.product"
                  >
                    {{ product.product_name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>{{ t('transferStocksPage.quantityLabel') }}</label>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  class="form-input"
                  :placeholder="t('transferStocksPage.quantityPlaceholder')"
                />
              </div>

              <div class="form-group item-remove-wrap">
                <label>&nbsp;</label>
                <button
                  type="button"
                  class="action-btn delete"
                  @click="removeItemRow(index)"
                  :disabled="form.items.length === 1"
                >
                  {{ t('transferStocksPage.removeItemButton') }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="closeModal">
              {{ t('transferStocksPage.cancelButton') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{
                submitting
                  ? t('transferStocksPage.savingButton')
                  : isEditing
                    ? t('transferStocksPage.updateButton')
                    : t('transferStocksPage.saveButton')
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

type TransferStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED'

type Warehouse = {
  id: number
  name: string
  code: string
  location: string
  is_active: boolean
  is_default: boolean
}

type ProductOption = {
  product: number
  product_name: string
  product_code: string
  product_sku: string
}

type TransferItem = {
  product: number
  quantity: number
}

type StockTransfer = {
  id: number
  reference_no: string
  from_warehouse: number
  from_warehouse_name: string
  from_warehouse_code: string
  to_warehouse: number
  to_warehouse_name: string
  to_warehouse_code: string
  note: string
  status: TransferStatus
  created_by: number | null
  created_by_name: string
  completed_by: number | null
  completed_by_name: string
  completed_at: string
  cancelled_by: number | null
  cancelled_by_name: string
  cancelled_at: string
  created_at: string
  updated_at: string
  items: TransferItem[]
}

type TransferForm = {
  from_warehouse: number
  to_warehouse: number
  note: string
  items: TransferItem[]
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
const productOptions = ref<ProductOption[]>([])
const transfers = ref<StockTransfer[]>([])

const form = reactive<TransferForm>({
  from_warehouse: 0,
  to_warehouse: 0,
  note: '',
  items: [{ product: 0, quantity: 1 }],
})

const normalizeWarehouse = (item: any): Warehouse => ({
  id: Number(item.id),
  name: item.name ?? '',
  code: item.code ?? '',
  location: item.location ?? '',
  is_active: Boolean(item.is_active),
  is_default: Boolean(item.is_default),
})

const normalizeProductOption = (item: any): ProductOption => ({
  product: Number(item.product ?? 0),
  product_name: item.product_name ?? '',
  product_code: item.product_code ?? '',
  product_sku: item.product_sku ?? '',
})

const normalizeTransfer = (item: any): StockTransfer => ({
  id: Number(item.id),
  reference_no: item.reference_no ?? '',
  from_warehouse: Number(item.from_warehouse ?? 0),
  from_warehouse_name: item.from_warehouse_name ?? '',
  from_warehouse_code: item.from_warehouse_code ?? '',
  to_warehouse: Number(item.to_warehouse ?? 0),
  to_warehouse_name: item.to_warehouse_name ?? '',
  to_warehouse_code: item.to_warehouse_code ?? '',
  note: item.note ?? '',
  status: (item.status ?? 'DRAFT') as TransferStatus,
  created_by: item.created_by ?? null,
  created_by_name: item.created_by_name ?? '',
  completed_by: item.completed_by ?? null,
  completed_by_name: item.completed_by_name ?? '',
  completed_at: item.completed_at ?? '',
  cancelled_by: item.cancelled_by ?? null,
  cancelled_by_name: item.cancelled_by_name ?? '',
  cancelled_at: item.cancelled_at ?? '',
  created_at: item.created_at ?? '',
  updated_at: item.updated_at ?? '',
  items: Array.isArray(item.items)
    ? item.items.map((sub: any) => ({
        product: Number(sub.product ?? 0),
        quantity: Number(sub.quantity ?? 0),
      }))
    : [],
})

const getErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) return data
  if (data?.detail) return data.detail

  if (data && typeof data === 'object') {
    const firstEntry = Object.entries(data)[0]
    if (firstEntry) {
      const [, value] = firstEntry
      if (Array.isArray(value) && value.length) return String(value[0])
      if (typeof value === 'string') return value
      if (typeof value === 'object') return JSON.stringify(value)
    }
  }

  return fallback
}

const filteredTransfers = computed(() => {
  const q = search.value.trim().toLowerCase()

  return transfers.value.filter((item) => {
    const matchesSearch =
      !q ||
      (item.reference_no || '').toLowerCase().includes(q) ||
      (item.note || '').toLowerCase().includes(q) ||
      (item.from_warehouse_name || '').toLowerCase().includes(q) ||
      (item.to_warehouse_name || '').toLowerCase().includes(q)

    const matchesStatus = statusFilter.value ? item.status === statusFilter.value : true

    return matchesSearch && matchesStatus
  })
})

const totalQuantity = computed(() =>
  transfers.value.reduce((sum, item) => {
    const itemQty = item.items.reduce((subTotal, subItem) => subTotal + Number(subItem.quantity || 0), 0)
    return sum + itemQty
  }, 0),
)

const completedCount = computed(
  () => transfers.value.filter((item) => item.status === 'COMPLETED').length,
)

const transferQuantity = (item: StockTransfer) =>
  item.items.reduce((sum, subItem) => sum + Number(subItem.quantity || 0), 0)

const resetForm = () => {
  form.from_warehouse = 0
  form.to_warehouse = 0
  form.note = ''
  form.items = [{ product: 0, quantity: 1 }]
}

const resetFilters = () => {
  search.value = ''
  statusFilter.value = ''
}

const addItemRow = () => {
  form.items.push({ product: 0, quantity: 1 })
}

const removeItemRow = (index: number) => {
  if (form.items.length === 1) return
  form.items.splice(index, 1)
}

const fetchWarehouses = async () => {
  const { data } = await api.get('/api/warehouses/')
  warehouses.value = Array.isArray(data) ? data.map(normalizeWarehouse) : []
}

const fetchProductOptions = async () => {
  const { data } = await api.get('/api/warehouse-stocks/')
  const normalized = Array.isArray(data) ? data.map(normalizeProductOption) : []

  const seen = new Set<number>()
  productOptions.value = normalized.filter((item) => {
    if (!item.product || seen.has(item.product)) return false
    seen.add(item.product)
    return true
  })
}

const fetchTransfers = async () => {
  const { data } = await api.get('/api/stock-transfers/')
  transfers.value = Array.isArray(data) ? data.map(normalizeTransfer) : []
}

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([fetchWarehouses(), fetchProductOptions(), fetchTransfers()])
  } catch (error: any) {
    errorMessage.value = getErrorMessage(error, t('transferStocksPage.fetchError'))
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

const openEditModal = (item: StockTransfer) => {
  form.from_warehouse = item.from_warehouse
  form.to_warehouse = item.to_warehouse
  form.note = item.note || ''
  form.items =
    item.items.length > 0
      ? item.items.map((subItem) => ({
          product: subItem.product,
          quantity: subItem.quantity,
        }))
      : [{ product: 0, quantity: 1 }]

  isEditing.value = true
  editingId.value = item.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const validateForm = () => {
  if (!form.from_warehouse) {
    window.alert(t('transferStocksPage.validationFromWarehouseRequired'))
    return false
  }

  if (!form.to_warehouse) {
    window.alert(t('transferStocksPage.validationToWarehouseRequired'))
    return false
  }

  if (form.from_warehouse === form.to_warehouse) {
    window.alert(t('transferStocksPage.validationWarehouseDifferent'))
    return false
  }

  if (!form.items.length) {
    window.alert(t('transferStocksPage.validationItemsRequired'))
    return false
  }

  const invalidItem = form.items.find((item) => !item.product || Number(item.quantity) <= 0)
  if (invalidItem) {
    window.alert(t('transferStocksPage.validationItemInvalid'))
    return false
  }

  return true
}

const buildPayload = () => ({
  from_warehouse: form.from_warehouse,
  to_warehouse: form.to_warehouse,
  note: form.note.trim(),
  items: form.items.map((item) => ({
    product: Number(item.product),
    quantity: Number(item.quantity),
  })),
})

const saveTransfer = async () => {
  if (!validateForm()) return

  submitting.value = true
  errorMessage.value = ''

  try {
    const payload = buildPayload()

    if (isEditing.value && editingId.value !== null) {
      await api.put(`/api/stock-transfers/${editingId.value}/`, payload)
    } else {
      await api.post('/api/stock-transfers/', payload)
    }

    closeModal()
    resetForm()
    await loadData()
  } catch (error: any) {
    window.alert(
      getErrorMessage(
        error,
        isEditing.value
          ? t('transferStocksPage.updateError')
          : t('transferStocksPage.createError'),
      ),
    )
  } finally {
    submitting.value = false
  }
}

const removeTransfer = async (item: StockTransfer) => {
  const confirmed = window.confirm(
    t('transferStocksPage.deleteConfirmWithName', {
      name: item.reference_no || `#${item.id}`,
    }),
  )
  if (!confirmed) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await api.delete(`/api/stock-transfers/${item.id}/`)
    await loadData()
  } catch (error: any) {
    window.alert(getErrorMessage(error, t('transferStocksPage.deleteError')))
  } finally {
    submitting.value = false
  }
}

const completeTransfer = async (item: StockTransfer) => {
  const confirmed = window.confirm(
    t('transferStocksPage.completeConfirm', {
      name: item.reference_no || `#${item.id}`,
    }),
  )
  if (!confirmed) return

  submitting.value = true

  try {
    await api.post(`/api/stock-transfers/${item.id}/complete/`, {
      from_warehouse: item.from_warehouse,
      to_warehouse: item.to_warehouse,
      note: item.note || '',
      items: item.items,
    })
    await loadData()
  } catch (error: any) {
    window.alert(getErrorMessage(error, t('transferStocksPage.completeError')))
  } finally {
    submitting.value = false
  }
}

const cancelTransfer = async (item: StockTransfer) => {
  const confirmed = window.confirm(
    t('transferStocksPage.cancelConfirm', {
      name: item.reference_no || `#${item.id}`,
    }),
  )
  if (!confirmed) return

  submitting.value = true

  try {
    await api.post(`/api/stock-transfers/${item.id}/cancel/`, {
      from_warehouse: item.from_warehouse,
      to_warehouse: item.to_warehouse,
      note: item.note || '',
      items: item.items,
    })
    await loadData()
  } catch (error: any) {
    window.alert(getErrorMessage(error, t('transferStocksPage.cancelError')))
  } finally {
    submitting.value = false
  }
}

const statusLabel = (status: TransferStatus) => {
  if (status === 'DRAFT') return t('transferStocksPage.statusDraft')
  if (status === 'COMPLETED') return t('transferStocksPage.statusCompleted')
  return t('transferStocksPage.statusCancelled')
}

const statusClass = (status: TransferStatus) => ({
  'status-draft': status === 'DRAFT',
  'status-completed': status === 'COMPLETED',
  'status-cancelled': status === 'CANCELLED',
})

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
  loadData()
})
</script>

<style scoped>
.transfer-page {
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
  color: #16a34a;
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
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
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
  min-width: 1100px;
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
  min-width: 95px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
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

.action-btn.complete {
  background: #dcfce7;
  color: #166534;
}

.action-btn.cancel {
  background: #fef3c7;
  color: #92400e;
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

.modal-large {
  max-width: 980px;
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

.items-section {
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.items-header h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.item-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #f8fafc;
}

.item-remove-wrap {
  min-width: 120px;
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
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.btn-primary:hover {
  filter: brightness(0.98);
}

@media (max-width: 992px) {
  .summary-grid,
  .form-grid,
  .item-row {
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