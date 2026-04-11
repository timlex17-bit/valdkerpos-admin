<template>
  <div class="stock-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('warehouseStocksPage.title') }}</h1>
        <p class="page-subtitle">{{ t('warehouseStocksPage.subtitle') }}</p>

        <div class="breadcrumb">
          <span>{{ t('warehouseStocksPage.breadcrumbHome') }}</span>
          <span>›</span>
          <span>{{ t('warehouseStocksPage.breadcrumbInventory') }}</span>
          <span>›</span>
          <span class="active">{{ t('warehouseStocksPage.title') }}</span>
        </div>
      </div>

      <div class="page-actions">
        <button class="btn btn-light" @click="resetFilters" :disabled="loading">
          {{ t('warehouseStocksPage.resetButton') }}
        </button>
        <button class="btn btn-light" @click="loadData" :disabled="loading">
          {{ loading ? t('warehouseStocksPage.refreshingButton') : t('warehouseStocksPage.refreshButton') }}
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          + {{ t('warehouseStocksPage.addStock') }}
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <section class="summary-grid">
      <article class="summary-card emerald">
        <p>{{ t('warehouseStocksPage.totalRows') }}</p>
        <h3>{{ stocks.length }}</h3>
        <span>{{ t('warehouseStocksPage.summaryRowsText') }}</span>
      </article>

      <article class="summary-card blue">
        <p>{{ t('warehouseStocksPage.totalQuantity') }}</p>
        <h3>{{ totalQuantity }}</h3>
        <span>{{ t('warehouseStocksPage.summaryQuantityText') }}</span>
      </article>

      <article class="summary-card amber">
        <p>{{ t('warehouseStocksPage.lowStockCount') }}</p>
        <h3>{{ lowStockCount }}</h3>
        <span>{{ t('warehouseStocksPage.summaryLowStockText') }}</span>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <input
          v-model="search"
          type="text"
          class="search-input"
          :placeholder="t('warehouseStocksPage.searchPlaceholder')"
        />

        <select v-model="warehouseFilter" class="filter-select">
          <option value="">{{ t('warehouseStocksPage.allWarehouses') }}</option>
          <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </option>
        </select>

        <select v-model="stockFilter" class="filter-select">
          <option value="">{{ t('warehouseStocksPage.allStockStatus') }}</option>
          <option value="low">{{ t('warehouseStocksPage.lowStockLabel') }}</option>
          <option value="normal">{{ t('warehouseStocksPage.normalStockLabel') }}</option>
        </select>
      </div>

      <div class="toolbar-right">
        <span class="results-count">
          {{ t('warehouseStocksPage.resultsCount', { count: filteredStocks.length }) }}
        </span>
      </div>
    </section>

    <section class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ t('warehouseStocksPage.warehouseLabel') }}</th>
              <th>{{ t('warehouseStocksPage.productLabel') }}</th>
              <th>{{ t('warehouseStocksPage.skuLabel') }}</th>
              <th>{{ t('warehouseStocksPage.quantityLabel') }}</th>
              <th>{{ t('warehouseStocksPage.minStockLabel') }}</th>
              <th>{{ t('warehouseStocksPage.statusLabel') }}</th>
              <th>{{ t('warehouseStocksPage.createdAtLabel') }}</th>
              <th>{{ t('warehouseStocksPage.actionsLabel') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="empty-state">
                <div class="empty-wrap">
                  <h3>{{ t('warehouseStocksPage.loadingTitle') }}</h3>
                  <p>{{ t('warehouseStocksPage.loadingSubtitle') }}</p>
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredStocks.length === 0">
              <td colspan="9" class="empty-state">
                <div class="empty-wrap">
                  <h3>{{ t('warehouseStocksPage.emptyTitle') }}</h3>
                  <p>{{ t('warehouseStocksPage.emptySubtitle') }}</p>
                </div>
              </td>
            </tr>

            <tr v-for="item in filteredStocks" :key="item.id">
              <td class="id-cell">#{{ item.id }}</td>
              <td>{{ item.warehouse_name }}</td>
              <td>
                <div class="primary-cell">
                  <strong>{{ item.product_name }}</strong>
                  <span>{{ item.product_code || '-' }}</span>
                </div>
              </td>
              <td>{{ item.product_sku || '-' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.min_stock }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="item.is_low_stock ? 'status-low' : 'status-normal'"
                >
                  {{
                    item.is_low_stock
                      ? t('warehouseStocksPage.lowStockLabel')
                      : t('warehouseStocksPage.normalStockLabel')
                  }}
                </span>
              </td>
              <td>{{ formatDate(item.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button class="action-btn edit" @click="openEditModal(item)">
                    {{ t('warehouseStocksPage.editButton') }}
                  </button>
                  <button class="action-btn delete" @click="removeStock(item)" :disabled="submitting">
                    {{ t('warehouseStocksPage.deleteButton') }}
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
              {{ isEditing ? t('warehouseStocksPage.editStock') : t('warehouseStocksPage.addStock') }}
            </h2>
            <p>{{ t('warehouseStocksPage.formSubtitle') }}</p>
          </div>

          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <form class="modal-body" @submit.prevent="saveStock">
          <div class="form-grid">
            <div class="form-group">
              <label>{{ t('warehouseStocksPage.warehouseLabel') }}</label>
              <select v-model.number="form.warehouse" class="form-input">
                <option :value="0">{{ t('warehouseStocksPage.selectWarehouse') }}</option>
                <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                  {{ warehouse.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('warehouseStocksPage.productLabel') }}</label>
              <select v-model.number="form.product" class="form-input">
                <option :value="0">{{ t('warehouseStocksPage.selectProduct') }}</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('warehouseStocksPage.quantityLabel') }}</label>
              <input
                v-model.number="form.quantity"
                type="number"
                min="0"
                class="form-input"
                :placeholder="t('warehouseStocksPage.quantityPlaceholder')"
              />
            </div>

            <div class="form-group">
              <label>{{ t('warehouseStocksPage.minStockLabel') }}</label>
              <input
                v-model.number="form.min_stock"
                type="number"
                min="0"
                class="form-input"
                :placeholder="t('warehouseStocksPage.minStockPlaceholder')"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="closeModal">
              {{ t('warehouseStocksPage.cancelButton') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{
                submitting
                  ? t('warehouseStocksPage.savingButton')
                  : isEditing
                    ? t('warehouseStocksPage.updateButton')
                    : t('warehouseStocksPage.saveButton')
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

type Warehouse = {
  id: number
  name: string
}

type Product = {
  id: number
  name: string
}

type WarehouseStock = {
  id: number
  warehouse: number
  warehouse_name: string
  warehouse_code: string
  product: number
  product_name: string
  product_code: string
  product_sku: string
  product_track_stock: boolean
  quantity: number
  min_stock: number
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

type StockForm = {
  warehouse: number
  product: number
  quantity: number
  min_stock: number
}

const { t, locale } = useI18n()

const search = ref('')
const warehouseFilter = ref('')
const stockFilter = ref('')
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const warehouses = ref<Warehouse[]>([])
const products = ref<Product[]>([])
const stocks = ref<WarehouseStock[]>([])

const form = reactive<StockForm>({
  warehouse: 0,
  product: 0,
  quantity: 0,
  min_stock: 0,
})

const normalizeWarehouse = (item: any): Warehouse => ({
  id: Number(item.id),
  name: item.name ?? '',
})

const normalizeProduct = (item: any): Product => ({
  id: Number(item.id),
  name: item.name ?? '',
})

const normalizeStock = (item: any): WarehouseStock => ({
  id: Number(item.id),
  warehouse: Number(item.warehouse ?? 0),
  warehouse_name: item.warehouse_name ?? '',
  warehouse_code: item.warehouse_code ?? '',
  product: Number(item.product ?? 0),
  product_name: item.product_name ?? '',
  product_code: item.product_code ?? '',
  product_sku: item.product_sku ?? '',
  product_track_stock: Boolean(item.product_track_stock),
  quantity: Number(item.quantity ?? 0),
  min_stock: Number(item.min_stock ?? 0),
  is_low_stock: Boolean(item.is_low_stock),
  created_at: item.created_at ?? '',
  updated_at: item.updated_at ?? '',
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
    }
  }

  return fallback
}

const filteredStocks = computed(() => {
  const q = search.value.trim().toLowerCase()

  return stocks.value.filter((item) => {
    const matchesSearch =
      !q ||
      item.warehouse_name.toLowerCase().includes(q) ||
      item.product_name.toLowerCase().includes(q) ||
      (item.product_sku || '').toLowerCase().includes(q) ||
      (item.product_code || '').toLowerCase().includes(q)

    const matchesWarehouse =
      warehouseFilter.value === '' ? true : String(item.warehouse) === String(warehouseFilter.value)

    const matchesStatus =
      stockFilter.value === ''
        ? true
        : stockFilter.value === 'low'
          ? item.is_low_stock
          : !item.is_low_stock

    return matchesSearch && matchesWarehouse && matchesStatus
  })
})

const totalQuantity = computed(() =>
  stocks.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
)

const lowStockCount = computed(() =>
  stocks.value.filter((item) => item.is_low_stock).length,
)

const resetFilters = () => {
  search.value = ''
  warehouseFilter.value = ''
  stockFilter.value = ''
}

const resetForm = () => {
  form.warehouse = 0
  form.product = 0
  form.quantity = 0
  form.min_stock = 0
}

const fetchWarehouses = async () => {
  const { data } = await api.get('/api/warehouses/')
  warehouses.value = Array.isArray(data) ? data.map(normalizeWarehouse) : []
}

const fetchProducts = async () => {
  const { data } = await api.get('/api/products/')
  products.value = Array.isArray(data) ? data.map(normalizeProduct) : []
}

const fetchStocks = async () => {
  const { data } = await api.get('/api/warehouse-stocks/')
  stocks.value = Array.isArray(data) ? data.map(normalizeStock) : []
}

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([fetchWarehouses(), fetchProducts(), fetchStocks()])
  } catch (error: any) {
    errorMessage.value = getErrorMessage(error, t('warehouseStocksPage.fetchError'))
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

const openEditModal = (item: WarehouseStock) => {
  form.warehouse = item.warehouse
  form.product = item.product
  form.quantity = item.quantity
  form.min_stock = item.min_stock

  isEditing.value = true
  editingId.value = item.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveStock = async () => {
  if (!form.warehouse) {
    window.alert(t('warehouseStocksPage.validationWarehouseRequired'))
    return
  }

  if (!form.product) {
    window.alert(t('warehouseStocksPage.validationProductRequired'))
    return
  }

  if (Number(form.quantity) < 0) {
    window.alert(t('warehouseStocksPage.validationQuantityInvalid'))
    return
  }

  if (Number(form.min_stock) < 0) {
    window.alert(t('warehouseStocksPage.validationMinStockInvalid'))
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    const payload = {
      warehouse: Number(form.warehouse),
      product: Number(form.product),
      quantity: Number(form.quantity),
      min_stock: Number(form.min_stock),
    }

    if (isEditing.value && editingId.value !== null) {
      await api.put(`/api/warehouse-stocks/${editingId.value}/`, payload)
    } else {
      await api.post('/api/warehouse-stocks/', payload)
    }

    closeModal()
    resetForm()
    await loadData()
  } catch (error: any) {
    window.alert(
      getErrorMessage(
        error,
        isEditing.value
          ? t('warehouseStocksPage.updateError')
          : t('warehouseStocksPage.createError'),
      ),
    )
  } finally {
    submitting.value = false
  }
}

const removeStock = async (item: WarehouseStock) => {
  const confirmed = window.confirm(
    t('warehouseStocksPage.deleteConfirmWithName', {
      name: `${item.warehouse_name} - ${item.product_name}`,
    }),
  )
  if (!confirmed) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await api.delete(`/api/warehouse-stocks/${item.id}/`)
    await loadData()
  } catch (error: any) {
    window.alert(getErrorMessage(error, t('warehouseStocksPage.deleteError')))
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
  loadData()
})
</script>

<style scoped>
.stock-page {
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

.status-low {
  background: #fee2e2;
  color: #991b1b;
}

.status-normal {
  background: #dcfce7;
  color: #166534;
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

.action-btn.edit {
  background: #e0f2fe;
  color: #0369a1;
}

.action-btn.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.action-btn:disabled,
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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