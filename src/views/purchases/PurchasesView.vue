<template>
  <section class="purchases-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <div>
          <h1 class="page-title">Purchases</h1>
          <p class="page-subtitle">
            Manage purchase transactions for your current shop.
          </p>
        </div>

        <nav class="breadcrumb">
          <span>Home</span>
          <span class="sep">/</span>
          <span>POS</span>
          <span class="sep">/</span>
          <span class="current">Purchases</span>
        </nav>
      </div>

      <button class="btn btn-primary add-btn" @click="openCreateModal">
        <span class="btn-icon">＋</span>
        Add Purchase
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Purchases</div>
        <div class="stat-value">{{ filteredPurchases.length }}</div>
        <div class="stat-note">Purchases shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Amount</div>
        <div class="stat-value">${{ filteredGrandTotal }}</div>
        <div class="stat-note">Total amount from visible purchases</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Items</div>
        <div class="stat-value">{{ filteredItemsCount }}</div>
        <div class="stat-note">Purchase items in visible records</div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box toolbar-item toolbar-search">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by invoice, supplier, note..."
          />
        </div>

        <div class="toolbar-item">
          <input
            v-model="dateFilter"
            type="date"
            class="filter-input"
          />
        </div>

        <div class="toolbar-item">
          <select v-model="supplierFilter" class="filter-select">
            <option value="">All suppliers</option>
            <option
              v-for="supplier in supplierOptions"
              :key="supplier.id"
              :value="String(supplier.id)"
            >
              {{ supplier.name }}
            </option>
          </select>
        </div>

        <div class="toolbar-item toolbar-reset">
          <button class="btn btn-light" @click="resetFilters">
            Reset
          </button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <div>
          <h2>Purchase List</h2>
          <p>{{ filteredPurchases.length }} purchase(s) found</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        Loading purchases...
      </div>

      <div v-else-if="errorMessage" class="error-state">
        {{ errorMessage }}
      </div>

      <div v-else class="table-wrapper desktop-table">
        <table class="purchase-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Supplier</th>
              <th>Purchase Date</th>
              <th>Created At</th>
              <th>Created By</th>
              <th>Items</th>
              <th>Total</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredPurchases.length === 0">
              <td colspan="8" class="empty-cell">
                No purchases found.
              </td>
            </tr>

            <tr v-for="purchase in filteredPurchases" :key="purchase.id">
              <td>
                <div class="invoice-block">
                  <span class="invoice-code">{{ purchase.invoice_id || '-' }}</span>
                  <span class="invoice-type">{{ purchase.items.length }} item(s)</span>
                </div>
              </td>

              <td>
                <div class="supplier-block">
                  <div class="supplier-avatar">
                    {{ getInitials(purchase.supplier_name || 'SP') }}
                  </div>
                  <div>
                    <div class="supplier-name">{{ purchase.supplier_name || 'No Supplier' }}</div>
                    <div class="supplier-sub">Purchase supplier</div>
                  </div>
                </div>
              </td>

              <td>
                <span class="purchase-date-text">
                  {{ formatDateDisplay(purchase.purchase_date) }}
                </span>
              </td>

              <td>
                <span class="created-at-text">
                  {{ formatDateTime(purchase.created_at) }}
                </span>
              </td>

              <td>
                <span class="created-by-badge">
                  {{ purchase.created_by || '-' }}
                </span>
              </td>

              <td>
                <span class="items-badge">
                  {{ Number(purchase.items_count || purchase.items.length || 0) }}
                </span>
              </td>

              <td class="amount-cell">${{ formatMoney(purchase.total_cost) }}</td>

              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(purchase)">
                    View
                  </button>
                  <button class="btn btn-sm btn-warning" @click="openEditModal(purchase)">
                    Edit
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    :disabled="deletingId === purchase.id"
                    @click="removePurchase(purchase.id)"
                  >
                    {{ deletingId === purchase.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !errorMessage" class="mobile-list">
        <div v-if="filteredPurchases.length === 0" class="mobile-empty">
          No purchases found.
        </div>

        <div
          v-for="purchase in filteredPurchases"
          :key="purchase.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div class="mobile-card-head-left">
              <div class="invoice-code">{{ purchase.invoice_id || '-' }}</div>
              <div class="supplier-sub">{{ purchase.supplier_name || 'No Supplier' }}</div>
            </div>

            <div class="mobile-total">
              ${{ formatMoney(purchase.total_cost) }}
            </div>
          </div>

          <div class="mobile-supplier-row">
            <div class="supplier-avatar">
              {{ getInitials(purchase.supplier_name || 'SP') }}
            </div>
            <div>
              <div class="supplier-name">{{ purchase.supplier_name || 'No Supplier' }}</div>
              <div class="supplier-sub">Purchase supplier</div>
            </div>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">Purchase Date</span>
              <span class="value">
                <span class="purchase-date-text">
                  {{ formatDateDisplay(purchase.purchase_date) }}
                </span>
              </span>
            </div>

            <div class="info-item">
              <span class="label">Created By</span>
              <span class="value">
                <span class="created-by-badge">
                  {{ purchase.created_by || '-' }}
                </span>
              </span>
            </div>

            <div class="info-item">
              <span class="label">Items</span>
              <span class="value">
                <span class="items-badge">
                  {{ Number(purchase.items_count || purchase.items.length || 0) }}
                </span>
              </span>
            </div>

            <div class="info-item">
              <span class="label">Created At</span>
              <span class="value">
                <span class="created-at-text">
                  {{ formatDateTime(purchase.created_at) }}
                </span>
              </span>
            </div>

            <div class="info-item full">
              <span class="label">Note</span>
              <span class="value">{{ purchase.note || '-' }}</span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(purchase)">
              View
            </button>
            <button class="btn btn-sm btn-warning" @click="openEditModal(purchase)">
              Edit
            </button>
            <button
              class="btn btn-sm btn-danger"
              :disabled="deletingId === purchase.id"
              @click="removePurchase(purchase.id)"
            >
              {{ deletingId === purchase.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card modal-xl">
          <div class="modal-header">
            <div>
              <h3>
                {{
                  modalMode === 'create'
                    ? 'Add Purchase'
                    : modalMode === 'edit'
                    ? 'Edit Purchase'
                    : 'Purchase Detail'
                }}
              </h3>
              <p>
                {{
                  modalMode === 'view'
                    ? 'View purchase information'
                    : 'Fill in general info and purchase items'
                }}
              </p>
            </div>

            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <div class="tabs">
              <button
                type="button"
                :class="['tab-btn', activeTab === 'general' ? 'active' : '']"
                @click="activeTab = 'general'"
              >
                General
              </button>
              <button
                type="button"
                :class="['tab-btn', activeTab === 'items' ? 'active' : '']"
                @click="activeTab = 'items'"
              >
                Purchase Items
              </button>
            </div>

            <form class="purchase-form" @submit.prevent="savePurchase">
              <div v-show="activeTab === 'general'" class="form-section">
                <div class="form-grid">
                  <div class="form-group">
                    <label>Supplier</label>
                    <select
                      v-model="form.supplier"
                      :disabled="modalMode === 'view' || saving"
                    >
                      <option value="">Select supplier</option>
                      <option
                        v-for="supplier in supplierOptions"
                        :key="supplier.id"
                        :value="String(supplier.id)"
                      >
                        {{ supplier.name }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Invoice ID</label>
                    <input
                      v-model="form.invoice_id"
                      type="text"
                      placeholder="Enter invoice id"
                      :disabled="modalMode === 'view' || saving"
                    />
                  </div>

                  <div class="form-group">
                    <label>Purchase Date</label>
                    <input
                      v-model="form.purchase_date"
                      type="date"
                      :disabled="modalMode === 'view' || saving"
                    />
                  </div>

                  <div class="form-group">
                    <label>Created By</label>
                    <input
                      :value="selectedPurchase?.created_by || '-'"
                      type="text"
                      disabled
                    />
                  </div>

                  <div class="form-group full">
                    <label>Note</label>
                    <textarea
                      v-model="form.note"
                      rows="5"
                      placeholder="Enter purchase note"
                      :disabled="modalMode === 'view' || saving"
                    />
                  </div>
                </div>
              </div>

              <div v-show="activeTab === 'items'" class="form-section">
                <div class="items-header">
                  <div>
                    <h4>Purchase Items</h4>
                    <p>Add products included in this purchase.</p>
                  </div>

                  <button
                    v-if="modalMode !== 'view'"
                    type="button"
                    class="btn btn-primary btn-sm add-item-btn"
                    @click="addPurchaseItem"
                  >
                    + Add Item
                  </button>
                </div>

                <div class="items-table-wrap desktop-items-table">
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Quantity</th>
                        <th>Cost Price</th>
                        <th>Expired Date</th>
                        <th>Batch Code</th>
                        <th>Total</th>
                        <th v-if="modalMode !== 'view'" class="text-right">Delete?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="form.items.length === 0">
                        <td :colspan="modalMode !== 'view' ? 7 : 6" class="empty-cell">
                          No purchase items yet.
                        </td>
                      </tr>

                      <tr v-for="(item, index) in form.items" :key="item.uid">
                        <td>
                          <input
                            v-model="item.product"
                            type="number"
                            min="1"
                            placeholder="Product ID"
                            :disabled="modalMode === 'view' || saving"
                          />
                        </td>
                        <td>
                          <input
                            v-model="item.quantity"
                            type="number"
                            min="1"
                            step="1"
                            :disabled="modalMode === 'view' || saving"
                            @input="recalculateGrandTotal"
                          />
                        </td>
                        <td>
                          <input
                            v-model="item.cost_price"
                            type="number"
                            min="0"
                            step="0.01"
                            :disabled="modalMode === 'view' || saving"
                            @input="recalculateGrandTotal"
                          />
                        </td>
                        <td>
                          <input
                            v-model="item.expired_date"
                            type="date"
                            :disabled="modalMode === 'view' || saving"
                          />
                        </td>
                        <td>
                          <input
                            v-model="item.batch_code"
                            type="text"
                            placeholder="Batch code"
                            :disabled="modalMode === 'view' || saving"
                          />
                        </td>
                        <td class="item-total">
                          ${{ formatMoney(itemTotal(item)) }}
                        </td>
                        <td v-if="modalMode !== 'view'" class="text-right">
                          <button
                            type="button"
                            class="icon-delete-btn"
                            @click="removePurchaseItem(index)"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="mobile-items-list">
                  <div v-if="form.items.length === 0" class="mobile-empty">
                    No purchase items yet.
                  </div>

                  <div
                    v-for="(item, index) in form.items"
                    :key="item.uid"
                    class="mobile-item-card"
                  >
                    <div class="mobile-item-grid">
                      <div class="form-group full">
                        <label>Product ID</label>
                        <input
                          v-model="item.product"
                          type="number"
                          min="1"
                          placeholder="Product ID"
                          :disabled="modalMode === 'view' || saving"
                        />
                      </div>

                      <div class="form-group">
                        <label>Quantity</label>
                        <input
                          v-model="item.quantity"
                          type="number"
                          min="1"
                          step="1"
                          :disabled="modalMode === 'view' || saving"
                          @input="recalculateGrandTotal"
                        />
                      </div>

                      <div class="form-group">
                        <label>Cost Price</label>
                        <input
                          v-model="item.cost_price"
                          type="number"
                          min="0"
                          step="0.01"
                          :disabled="modalMode === 'view' || saving"
                          @input="recalculateGrandTotal"
                        />
                      </div>

                      <div class="form-group">
                        <label>Expired Date</label>
                        <input
                          v-model="item.expired_date"
                          type="date"
                          :disabled="modalMode === 'view' || saving"
                        />
                      </div>

                      <div class="form-group">
                        <label>Batch Code</label>
                        <input
                          v-model="item.batch_code"
                          type="text"
                          placeholder="Batch code"
                          :disabled="modalMode === 'view' || saving"
                        />
                      </div>

                      <div class="mobile-item-total">
                        Total: <strong>${{ formatMoney(itemTotal(item)) }}</strong>
                      </div>

                      <div v-if="modalMode !== 'view'" class="mobile-item-actions">
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          @click="removePurchaseItem(index)"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grand-total-box">
                  <span>Grand Total</span>
                  <strong>${{ formatMoney(form.grand_total) }}</strong>
                </div>
              </div>

              <div v-if="formError" class="form-error">
                {{ formError }}
              </div>

              <div v-if="modalMode !== 'view'" class="modal-footer">
                <button type="button" class="btn btn-light modal-btn" @click="closeModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary modal-btn" :disabled="saving">
                  {{
                    saving
                      ? (modalMode === 'create' ? 'Saving...' : 'Updating...')
                      : (modalMode === 'create' ? 'Save Purchase' : 'Update Purchase')
                  }}
                </button>
              </div>

              <div v-else class="modal-footer">
                <button type="button" class="btn btn-primary modal-btn" @click="closeModal">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

type SupplierOption = {
  id: number
  name: string
}

type PurchaseApiItem = {
  product?: number | string
  product_id?: number | string
  quantity?: number | string
  cost_price?: number | string
  expired_date?: string
  batch_code?: string
}

type PurchaseItem = {
  uid: string
  product: string
  quantity: string
  cost_price: string
  expired_date: string
  batch_code: string
}

type Purchase = {
  id: number
  invoice_id: string
  supplier_id: number | null
  supplier_name: string
  purchase_date: string
  created_at: string
  items_count: string
  total_cost: string
  note: string
  created_by: number | string | null
  items: PurchaseApiItem[]
}

type ModalMode = 'create' | 'edit' | 'view'
type TabKey = 'general' | 'items'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('token') ||
    ''

  if (token) {
    config.headers.Authorization = `Token ${token}`
  }

  return config
})

const search = ref('')
const dateFilter = ref('')
const supplierFilter = ref('')
const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)
const activeTab = ref<TabKey>('general')
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const formError = ref('')
const selectedPurchase = ref<Purchase | null>(null)

const purchases = ref<Purchase[]>([])
const supplierOptions = ref<SupplierOption[]>([])

const form = reactive({
  supplier: '',
  invoice_id: '',
  purchase_date: '',
  note: '',
  items: [] as PurchaseItem[],
  grand_total: 0,
})

const filteredPurchases = computed(() => {
  let result = [...purchases.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((purchase) => {
      return (
        (purchase.invoice_id || '').toLowerCase().includes(q) ||
        (purchase.supplier_name || '').toLowerCase().includes(q) ||
        (purchase.note || '').toLowerCase().includes(q) ||
        String(purchase.created_by || '').toLowerCase().includes(q)
      )
    })
  }

  if (dateFilter.value) {
    result = result.filter((purchase) => purchase.purchase_date === dateFilter.value)
  }

  if (supplierFilter.value) {
    result = result.filter((purchase) => String(purchase.supplier_id || '') === supplierFilter.value)
  }

  return result
})

const filteredGrandTotal = computed(() => {
  const total = filteredPurchases.value.reduce(
    (sum, purchase) => sum + Number(purchase.total_cost || 0),
    0
  )
  return formatMoney(total)
})

const filteredItemsCount = computed(() => {
  return filteredPurchases.value.reduce(
    (sum, purchase) => sum + Number(purchase.items_count || purchase.items.length || 0),
    0
  )
})

function resetForm() {
  form.supplier = ''
  form.invoice_id = ''
  form.purchase_date = ''
  form.note = ''
  form.items = []
  form.grand_total = 0
  formError.value = ''
}

function fillForm(purchase: Purchase) {
  form.supplier = purchase.supplier_id ? String(purchase.supplier_id) : ''
  form.invoice_id = purchase.invoice_id || ''
  form.purchase_date = purchase.purchase_date || ''
  form.note = purchase.note || ''
  form.items = (purchase.items || []).map((item) => ({
    uid: createUid(),
    product: String(item.product_id ?? item.product ?? ''),
    quantity: String(item.quantity ?? '1'),
    cost_price: String(item.cost_price ?? '0.00'),
    expired_date: item.expired_date || '',
    batch_code: item.batch_code || '',
  }))
  recalculateGrandTotal()
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  selectedPurchase.value = null
  activeTab.value = 'general'
  resetForm()
  form.invoice_id = generatePurchaseInvoice()
  form.purchase_date = todayDate()
  form.items = [newPurchaseItem()]
  recalculateGrandTotal()
  showModal.value = true
}

function openEditModal(purchase: Purchase) {
  modalMode.value = 'edit'
  editingId.value = purchase.id
  selectedPurchase.value = purchase
  activeTab.value = 'general'
  resetForm()
  fillForm(purchase)
  showModal.value = true
}

function openViewModal(purchase: Purchase) {
  modalMode.value = 'view'
  editingId.value = purchase.id
  selectedPurchase.value = purchase
  activeTab.value = 'general'
  resetForm()
  fillForm(purchase)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  selectedPurchase.value = null
  activeTab.value = 'general'
  resetForm()
}

function resetFilters() {
  search.value = ''
  dateFilter.value = ''
  supplierFilter.value = ''
}

function newPurchaseItem(): PurchaseItem {
  return {
    uid: createUid(),
    product: '',
    quantity: '1',
    cost_price: '0.00',
    expired_date: '',
    batch_code: '',
  }
}

function addPurchaseItem() {
  form.items.push(newPurchaseItem())
  recalculateGrandTotal()
}

function removePurchaseItem(index: number) {
  form.items.splice(index, 1)
  recalculateGrandTotal()
}

function itemTotal(item: PurchaseItem) {
  return (Number(item.quantity) || 0) * (Number(item.cost_price) || 0)
}

function recalculateGrandTotal() {
  form.grand_total = form.items.reduce((sum, item) => sum + itemTotal(item), 0)
}

function validateForm() {
  formError.value = ''

  const validItems = form.items.filter((item) => String(item.product).trim())

  if (!form.purchase_date) {
    formError.value = 'Purchase date is required.'
    activeTab.value = 'general'
    return false
  }

  if (validItems.length === 0) {
    formError.value = 'At least one purchase item is required.'
    activeTab.value = 'items'
    return false
  }

  for (const item of validItems) {
    if (!String(item.product).trim()) {
      formError.value = 'Product ID is required for each item.'
      activeTab.value = 'items'
      return false
    }
    if (Number(item.quantity) <= 0) {
      formError.value = 'Quantity must be greater than 0.'
      activeTab.value = 'items'
      return false
    }
    if (Number(item.cost_price) < 0) {
      formError.value = 'Cost price cannot be negative.'
      activeTab.value = 'items'
      return false
    }
  }

  return true
}

function buildCreatePayload() {
  const validItems = form.items
    .filter((item) => String(item.product).trim())
    .map((item) => ({
      product: Number(item.product),
      quantity: String(item.quantity || '1'),
      cost_price: String(item.cost_price || '0.00'),
      expired_date: item.expired_date || null,
      batch_code: item.batch_code.trim(),
    }))

  return {
    supplier: form.supplier ? Number(form.supplier) : null,
    invoice_id: form.invoice_id.trim(),
    purchase_date: form.purchase_date || null,
    note: form.note.trim(),
    items: validItems,
  }
}

function buildUpdatePayload() {
  return {
    invoice_id: form.invoice_id.trim(),
    purchase_date: form.purchase_date,
    note: form.note.trim(),
  }
}

async function fetchSuppliers() {
  try {
    const response = await api.get('/api/suppliers/')
    const rows = Array.isArray(response.data) ? response.data : []
    supplierOptions.value = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
    }))
  } catch {
    supplierOptions.value = []
  }
}

async function fetchPurchases() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/api/purchases/')
    purchases.value = Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to load purchases.'
  } finally {
    loading.value = false
  }
}

async function savePurchase() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    if (modalMode.value === 'create') {
      const payload = buildCreatePayload()
      await api.post('/api/purchases/', payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } else if (modalMode.value === 'edit' && editingId.value !== null) {
      const payload = buildUpdatePayload()
      await api.patch(`/api/purchases/${editingId.value}/`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await fetchPurchases()
    closeModal()
  } catch (error: any) {
    const data = error?.response?.data

    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      if (firstKey) {
        const firstValue = data[firstKey]
        formError.value = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
      } else {
        formError.value = 'Failed to save purchase.'
      }
    } else {
      formError.value = error?.message || 'Failed to save purchase.'
    }
  } finally {
    saving.value = false
  }
}

async function removePurchase(id: number) {
  const ok = window.confirm('Delete this purchase?')
  if (!ok) return

  deletingId.value = id

  try {
    await api.delete(`/api/purchases/${id}/`)
    purchases.value = purchases.value.filter((purchase) => purchase.id !== id)
  } catch (error: any) {
    alert(
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to delete purchase.'
    )
  } finally {
    deletingId.value = null
  }
}

function formatMoney(value: unknown) {
  return Number(value || 0).toFixed(2)
}

function getInitials(name: string) {
  return (name || 'SP')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function createUid() {
  return Math.random().toString(36).slice(2, 11)
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateDisplay(date: string) {
  if (!date) return '-'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(value: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function generatePurchaseInvoice() {
  const maxId =
    purchases.value.length > 0
      ? Math.max(...purchases.value.map((purchase) => purchase.id))
      : 0
  return `PUR-${new Date().getFullYear()}-${String(maxId + 1).padStart(3, '0')}`
}

onMounted(async () => {
  await Promise.all([fetchPurchases(), fetchSuppliers()])
})
</script>

<style scoped>
.purchases-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1 1 420px;
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #162033;
  line-height: 1.1;
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
}

.breadcrumb .current {
  color: #1f6feb;
  font-weight: 600;
}

.sep {
  opacity: 0.6;
}

.add-btn {
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card,
.toolbar-card,
.table-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #eef1f6;
}

.stat-card {
  padding: 20px;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: clamp(24px, 3vw, 28px);
  font-weight: 800;
  color: #172033;
  line-height: 1.1;
  word-break: break-word;
}

.stat-note {
  margin-top: 8px;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.toolbar-card {
  padding: 18px;
  margin-bottom: 20px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: minmax(260px, 2fr) minmax(180px, 1fr) minmax(180px, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.toolbar-item {
  min-width: 0;
}

.toolbar-search {
  min-width: 0;
}

.toolbar-reset {
  display: flex;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid #dbe3ef;
  background: #f9fbff;
  padding: 0 16px 0 44px;
  font-size: 14px;
  outline: none;
  transition: 0.2s ease;
}

.search-box input:focus,
.filter-select:focus,
.filter-input:focus,
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus,
.items-table td input:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 15px;
}

.filter-select,
.filter-input {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid #dbe3ef;
  background: #f9fbff;
  padding: 0 14px;
  font-size: 14px;
  color: #162033;
  outline: none;
  transition: 0.2s ease;
}

.table-card {
  padding: 18px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.table-header h2 {
  margin: 0;
  font-size: 20px;
  color: #162033;
}

.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.table-wrapper {
  overflow-x: auto;
}

.purchase-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1050px;
}

.purchase-table th,
.purchase-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.purchase-table th {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  background: #fbfcfe;
  white-space: nowrap;
}

.purchase-table td {
  color: #334155;
}

.purchase-table tbody tr:hover {
  background: #fafcff;
}

.invoice-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invoice-code {
  color: #2563eb;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.invoice-type {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

.supplier-block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.supplier-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: white;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.supplier-name {
  font-weight: 700;
  color: #162033;
  line-height: 1.4;
  word-break: break-word;
}

.supplier-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8798;
  line-height: 1.4;
}

.purchase-date-text,
.created-at-text {
  color: #162033;
  font-weight: 600;
  line-height: 1.5;
}

.created-by-badge,
.items-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.created-by-badge {
  background: #eef4ff;
  color: #2563eb;
}

.items-badge {
  background: #ecfdf3;
  color: #16a34a;
}

.amount-cell,
.mobile-total {
  font-weight: 800;
  color: #162033;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.text-right {
  text-align: right;
}

.empty-cell {
  text-align: center !important;
  color: #94a3b8;
  padding: 32px !important;
}

.mobile-list {
  display: none;
}

.mobile-card {
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 16px;
  background: #fff;
  margin-bottom: 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.mobile-card:last-child {
  margin-bottom: 0;
}

.mobile-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.mobile-card-head-left {
  min-width: 0;
}

.mobile-supplier-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #334155;
  min-width: 0;
}

.info-item .label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-item .value {
  word-break: break-word;
  line-height: 1.5;
}

.info-item.full {
  grid-column: 1 / -1;
}

.mobile-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.mobile-actions .btn {
  width: 100%;
}

.mobile-empty {
  text-align: center;
  color: #94a3b8;
  padding: 24px 0;
}

.loading-state,
.error-state {
  padding: 24px;
  border-radius: 16px;
  margin-top: 10px;
  font-weight: 600;
}

.loading-state {
  background: #eff6ff;
  color: #1d4ed8;
}

.error-state {
  background: #fef2f2;
  color: #dc2626;
}

.form-error {
  padding: 12px 14px;
  border-radius: 14px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
}

.btn {
  border: none;
  outline: none;
  cursor: pointer;
  transition: 0.2s ease;
  border-radius: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #fff;
  height: 48px;
  padding: 0 18px;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.18);
}

.btn-primary:hover {
  transform: translateY(-1px);
}

.btn-light {
  background: #eef2f7;
  color: #334155;
  height: 48px;
  padding: 0 16px;
}

.btn-outline {
  background: #fff;
  color: #2563eb;
  border: 1px solid #cfe0ff;
}

.btn-warning {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.btn-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-sm {
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 12px;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 760px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
  overflow: hidden;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.modal-xl {
  max-width: 1180px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: #162033;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.modal-close {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: #f3f6fb;
  color: #475569;
  font-size: 24px;
  cursor: pointer;
  flex-shrink: 0;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 14px;
  flex-wrap: wrap;
}

.tab-btn {
  height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  border: 1px solid #dbe3ef;
  background: #fff;
  color: #475569;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.tab-btn.active {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.purchase-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: block;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.form-group label span {
  color: #dc2626;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #fbfcff;
  padding: 12px 14px;
  font-size: 14px;
  color: #162033;
  outline: none;
  transition: 0.2s ease;
  resize: vertical;
}

.items-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.items-header h4 {
  margin: 0;
  font-size: 18px;
  color: #162033;
}

.items-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.add-item-btn {
  width: auto;
}

.items-table-wrap {
  overflow-x: auto;
  border: 1px solid #edf2f7;
  border-radius: 18px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.items-table th,
.items-table td {
  padding: 14px;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
  text-align: left;
}

.items-table th {
  background: #fbfcfe;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.items-table td input {
  width: 100%;
  min-width: 120px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #fbfcff;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  color: #162033;
}

.item-total {
  font-weight: 800;
  color: #162033;
  white-space: nowrap;
}

.icon-delete-btn {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.mobile-items-list {
  display: none;
}

.mobile-item-card {
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 16px;
  background: #fff;
  margin-bottom: 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.mobile-item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.mobile-item-total {
  grid-column: 1 / -1;
  padding-top: 4px;
  font-size: 15px;
  color: #334155;
}

.mobile-item-actions {
  grid-column: 1 / -1;
}

.mobile-item-actions .btn {
  width: 100%;
}

.grand-total-box {
  margin-top: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #eff6ff, #f8fbff);
  border: 1px solid #dbeafe;
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 16px;
  color: #1e3a8a;
}

.grand-total-box strong {
  font-size: 24px;
  color: #2563eb;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.modal-btn {
  min-width: 150px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-reset .btn {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .purchases-page {
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .purchases-page {
    padding: 16px;
  }

  .page-header {
    align-items: stretch;
  }

  .page-title-wrap {
    flex: 1 1 100%;
  }

  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .add-btn {
    width: 100%;
  }

  .desktop-table,
  .desktop-items-table {
    display: none;
  }

  .mobile-list,
  .mobile-items-list {
    display: block;
  }

  .toolbar-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-item,
  .toolbar-reset,
  .toolbar-reset .btn {
    width: 100%;
  }

  .table-card,
  .toolbar-card,
  .stat-card {
    border-radius: 18px;
  }

  .table-card {
    padding: 14px;
  }

  .modal-card,
  .modal-xl {
    max-width: 100%;
    border-radius: 20px;
    max-height: calc(100vh - 24px);
  }

  .modal-body,
  .modal-header {
    padding: 18px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
    min-width: 0;
  }

  .mobile-info-grid,
  .mobile-item-grid {
    grid-template-columns: 1fr;
  }

  .mobile-actions {
    grid-template-columns: 1fr;
  }

  .mobile-actions .btn {
    height: 40px;
  }

  .add-item-btn {
    width: 100%;
  }

  .grand-total-box {
    flex-direction: column;
    align-items: flex-start;
  }

  .grand-total-box strong {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .purchases-page {
    padding: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .breadcrumb {
    font-size: 12px;
    gap: 6px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 22px;
  }

  .toolbar-card {
    padding: 14px;
  }

  .table-header h2 {
    font-size: 18px;
  }

  .mobile-card,
  .mobile-item-card {
    padding: 14px;
    border-radius: 16px;
  }

  .supplier-avatar {
    width: 36px;
    height: 36px;
    font-size: 11px;
  }

  .created-by-badge,
  .items-badge {
    font-size: 11px;
    padding: 6px 9px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .modal-header h3 {
    font-size: 18px;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    font-size: 22px;
  }

  .tab-btn {
    width: 100%;
  }
}
</style>