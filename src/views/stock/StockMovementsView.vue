<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('stockMovementsPage.title') }}</h1>
        <p class="page-subtitle">
          {{ t('stockMovementsPage.subtitle') }}
        </p>

        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>/</span>
          <span>{{ t('common.pos') }}</span>
          <span>/</span>
          <span class="active">{{ t('stockMovementsPage.title') }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="refresh-btn" @click="fetchStockMovements" :disabled="loading">
          {{ loading ? t('common.loading') : t('productsPage.refresh') }}
        </button>
      </div>
    </section>

    <section class="stats-grid stats-grid-4">
      <div class="stat-card">
        <div class="stat-label">{{ t('stockMovementsPage.visibleMovements') }}</div>
        <div class="stat-value">{{ filteredItems.length }}</div>
        <div class="stat-note">{{ t('stockMovementsPage.visibleMovementsNote') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">{{ t('stockMovementsPage.sales') }}</div>
        <div class="stat-value">{{ totalByType('SALE') }}</div>
        <div class="stat-note">{{ t('stockMovementsPage.salesNote') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">{{ t('stockMovementsPage.purchases') }}</div>
        <div class="stat-value">{{ totalByType('PURCHASE') }}</div>
        <div class="stat-note">{{ t('stockMovementsPage.purchasesNote') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">{{ t('stockMovementsPage.adjustments') }}</div>
        <div class="stat-value">{{ totalByType('ADJUSTMENT') }}</div>
        <div class="stat-note">{{ t('stockMovementsPage.adjustmentsNote') }}</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid toolbar-grid-4">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            :placeholder="t('stockMovementsPage.searchPlaceholder')"
          />
        </div>

        <select v-model="movementTypeFilter" class="filter-select">
          <option value="">{{ t('stockMovementsPage.allMovementTypes') }}</option>
          <option
            v-for="type in movementTypeOptions"
            :key="type"
            :value="type"
          >
            {{ formatMovementType(type) }}
          </option>
        </select>

        <input v-model="dateFilter" type="date" class="filter-select" />

        <button class="reset-btn" @click="resetFilters">{{ t('common.reset') }}</button>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>{{ t('stockMovementsPage.stockMovementList') }}</h2>
          <p>{{ t('stockMovementsPage.movementsFound', { count: filteredItems.length }) }}</p>
        </div>
      </div>

      <div v-if="error" class="alert-error">
        {{ error }}
      </div>

      <div class="table-wrap" v-if="filteredItems.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('stockMovementsPage.reference') }}</th>
              <th>{{ t('stockMovementsPage.product') }}</th>
              <th>{{ t('stockMovementsPage.type') }}</th>
              <th>{{ t('stockMovementsPage.qtyDelta') }}</th>
              <th>{{ t('stockMovementsPage.before') }}</th>
              <th>{{ t('stockMovementsPage.after') }}</th>
              <th>{{ t('stockMovementsPage.referenceModel') }}</th>
              <th>{{ t('stockMovementsPage.createdAt') }}</th>
              <th>{{ t('common.action') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>
                <div class="ref-cell">
                  <div class="ref-main">SM{{ String(item.id).padStart(10, '0') }}</div>
                  <div class="ref-sub">{{ t('stockMovementsPage.movement') }}</div>
                </div>
              </td>

              <td>
                <div class="product-cell">
                  <div class="title-main">{{ item.product_name || '-' }}</div>
                  <div class="ref-sub">
                    {{ item.product_code || item.product_sku || '-' }}
                  </div>
                </div>
              </td>

              <td>
                <span class="status-badge" :class="movementTypeClass(item.movement_type)">
                  {{ formatMovementType(item.movement_type) }}
                </span>
              </td>

              <td>
                <span class="delta-text" :class="deltaClass(item.quantity_delta)">
                  {{ formatDelta(item.quantity_delta) }}
                </span>
              </td>

              <td>{{ displayNumber(item.before_stock) }}</td>
              <td>{{ displayNumber(item.after_stock) }}</td>

              <td>
                <div class="ref-model">
                  <div>{{ item.ref_model || '-' }}</div>
                  <div class="ref-sub" v-if="item.ref_id !== null && item.ref_id !== undefined">
                    #{{ item.ref_id }}
                  </div>
                </div>
              </td>

              <td>{{ formatDateTime(item.created_at) }}</td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openViewModalWithRetrieve(item)">{{ t('common.view') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <h3>{{ t('stockMovementsPage.noStockMovementsTitle') }}</h3>
        <p>{{ t('stockMovementsPage.noStockMovementsSubtitle') }}</p>
      </div>

      <div v-if="loading" class="loading-state">
        {{ t('stockMovementsPage.loadingStockMovements') }}
      </div>
    </section>

    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal-card modal-card-wide">
        <div class="modal-header">
          <div>
            <h2>{{ t('stockMovementsPage.stockMovementDetailTitle') }}</h2>
            <p>{{ t('stockMovementsPage.stockMovementDetailSubtitle') }}</p>
          </div>
          <button class="close-btn" @click="closeViewModal">×</button>
        </div>

        <div class="modal-body" v-if="viewItem">
          <div class="detail-grid">
            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.reference') }}</div>
              <div class="detail-value">
                SM{{ String(viewItem.id).padStart(10, '0') }}
              </div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.movementType') }}</div>
              <div class="detail-value">
                <span class="status-badge" :class="movementTypeClass(viewItem.movement_type)">
                  {{ formatMovementType(viewItem.movement_type) }}
                </span>
              </div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.product') }}</div>
              <div class="detail-value">{{ viewItem.product_name || '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.productId') }}</div>
              <div class="detail-value">{{ viewItem.product ?? '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.productCode') }}</div>
              <div class="detail-value">{{ viewItem.product_code || '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.productSku') }}</div>
              <div class="detail-value">{{ viewItem.product_sku || '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.quantityDelta') }}</div>
              <div class="detail-value" :class="deltaClass(viewItem.quantity_delta)">
                {{ formatDelta(viewItem.quantity_delta) }}
              </div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.beforeStock') }}</div>
              <div class="detail-value">{{ displayNumber(viewItem.before_stock) }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.afterStock') }}</div>
              <div class="detail-value">{{ displayNumber(viewItem.after_stock) }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.createdBy') }}</div>
              <div class="detail-value">{{ viewItem.created_by ?? '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.referenceModel') }}</div>
              <div class="detail-value">{{ viewItem.ref_model || '-' }}</div>
            </div>

            <div class="detail-box">
              <div class="detail-label">{{ t('stockMovementsPage.referenceId') }}</div>
              <div class="detail-value">{{ viewItem.ref_id ?? '-' }}</div>
            </div>

            <div class="detail-box detail-box-full">
              <div class="detail-label">{{ t('stockMovementsPage.createdAt') }}</div>
              <div class="detail-value">{{ formatDateTime(viewItem.created_at) }}</div>
            </div>

            <div class="detail-box detail-box-full">
              <div class="detail-label">{{ t('common.note') }}</div>
              <div class="detail-value">{{ viewItem.note || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type StockMovement = {
  id: number
  created_at: string
  movement_type: string
  quantity_delta: number
  before_stock: number
  after_stock: number
  note: string
  ref_model: string
  ref_id: number | null
  product: number | null
  product_name: string
  product_code: string
  product_sku: string
  created_by: number | null
}

const { t, locale } = useI18n()

const stockMovements = ref<StockMovement[]>([])
const loading = ref(false)
const error = ref('')

const search = ref('')
const movementTypeFilter = ref('')
const dateFilter = ref('')

const showViewModal = ref(false)
const viewItem = ref<StockMovement | null>(null)

const movementTypeOptions = computed(() => {
  const types = stockMovements.value
    .map((item) => item.movement_type)
    .filter((value) => !!value)

  return [...new Set(types)]
})

const filteredItems = computed(() => {
  let results = [...stockMovements.value]
  const keyword = search.value.trim().toLowerCase()

  if (keyword) {
    results = results.filter((item) =>
      (item.product_name || '').toLowerCase().includes(keyword) ||
      (item.product_code || '').toLowerCase().includes(keyword) ||
      (item.product_sku || '').toLowerCase().includes(keyword) ||
      (item.ref_model || '').toLowerCase().includes(keyword) ||
      (item.note || '').toLowerCase().includes(keyword) ||
      String(item.created_by ?? '').toLowerCase().includes(keyword)
    )
  }

  if (movementTypeFilter.value) {
    results = results.filter((item) => item.movement_type === movementTypeFilter.value)
  }

  if (dateFilter.value) {
    results = results.filter((item) =>
      (item.created_at || '').startsWith(dateFilter.value)
    )
  }

  return results
})

function getDateLocale() {
  if (locale.value === 'id') return 'id-ID'
  return 'en-US'
}

function normalizeStockMovement(raw: any): StockMovement {
  return {
    id: Number(raw?.id ?? 0),
    created_at: raw?.created_at ?? '',
    movement_type: raw?.movement_type ?? '',
    quantity_delta: Number(raw?.quantity_delta ?? 0),
    before_stock: Number(raw?.before_stock ?? 0),
    after_stock: Number(raw?.after_stock ?? 0),
    note: raw?.note ?? '',
    ref_model: raw?.ref_model ?? '',
    ref_id: raw?.ref_id ?? null,
    product: raw?.product ?? null,
    product_name: raw?.product_name ?? '',
    product_code: raw?.product_code ?? '',
    product_sku: raw?.product_sku ?? '',
    created_by: raw?.created_by ?? null,
  }
}

async function fetchStockMovements() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get(ENDPOINTS.STOCK_MOVEMENTS)
    const rows = Array.isArray(response.data) ? response.data : []
    stockMovements.value = rows.map(normalizeStockMovement)
  } catch (err: any) {
    console.error('Failed to fetch stock movements:', err)
    error.value =
      err?.response?.data?.detail ||
      t('stockMovementsPage.failedLoad')
    stockMovements.value = []
  } finally {
    loading.value = false
  }
}

function totalByType(type: string) {
  return filteredItems.value.filter((item) => item.movement_type === type).length
}

function resetFilters() {
  search.value = ''
  movementTypeFilter.value = ''
  dateFilter.value = ''
}

function openViewModal(item: StockMovement) {
  viewItem.value = item
  showViewModal.value = true
}

async function fetchMovementDetail(id: number) {
  try {
    const response = await api.get(`${ENDPOINTS.STOCK_MOVEMENTS}${id}/`)
    viewItem.value = normalizeStockMovement(response.data)
  } catch (err) {
    console.error('Failed to fetch stock movement detail:', err)
  }
}

async function openViewModalWithRetrieve(item: StockMovement) {
  openViewModal(item)
  await fetchMovementDetail(item.id)
}

function closeViewModal() {
  showViewModal.value = false
  viewItem.value = null
}

function displayNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return value
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'

  return new Intl.DateTimeFormat(getDateLocale(), {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

function deltaClass(value: number) {
  return {
    positive: value > 0,
    negative: value < 0,
    neutral: value === 0,
  }
}

function movementTypeClass(type: string) {
  return {
    paid: type === 'PURCHASE',
    unpaid: type === 'SALE_RETURN',
    cancelled: type === 'SALE',
    info: type === 'ADJUSTMENT',
  }
}

function formatMovementType(type: string) {
  if (!type) return '-'

  const formatted = type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

  return formatted
}

onMounted(() => {
  fetchStockMovements()
})
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
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #7b8496;
  font-size: 14px;
  margin-top: 12px;
}

.breadcrumb .active {
  color: #2563eb;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.refresh-btn {
  border: none;
  background: #2563eb;
  color: white;
  padding: 14px 22px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
}

.stats-grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  gap: 14px;
  align-items: center;
}

.toolbar-grid-4 {
  grid-template-columns: 1.8fr 1fr 0.9fr auto;
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

.filter-select {
  height: 48px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0 14px;
  font-size: 0.96rem;
  color: #334155;
  outline: none;
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
  min-width: 1280px;
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

.title-main {
  font-weight: 700;
  color: #1f2937;
}

.delta-text {
  font-weight: 800;
}

.delta-text.positive,
.detail-value.positive {
  color: #16a34a;
}

.delta-text.negative,
.detail-value.negative {
  color: #dc2626;
}

.delta-text.neutral,
.detail-value.neutral {
  color: #64748b;
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

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.info {
  background: #dbeafe;
  color: #2563eb;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-view {
  height: 38px;
  padding: 0 14px;
  border-radius: 14px;
  background: white;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.92rem;
  border: 1px solid #bfdbfe;
  color: #2563eb;
}

.empty-state,
.loading-state {
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

.loading-state {
  color: #475569;
  font-weight: 600;
}

.alert-error {
  margin: 0 20px 16px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 14px 16px;
  border-radius: 14px;
  font-weight: 600;
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

.modal-card-wide {
  width: min(980px, 100%);
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-box {
  background: #f8fafc;
  border: 1px solid #e5edf5;
  border-radius: 16px;
  padding: 16px;
}

.detail-box-full {
  grid-column: 1 / -1;
}

.detail-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.detail-value {
  color: #1f2937;
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .toolbar-grid-4,
  .stats-grid-4,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-box-full {
    grid-column: auto;
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

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>