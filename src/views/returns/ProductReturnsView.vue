<template>
  <section class="product-returns-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <div>
          <h1 class="page-title">Product Returns</h1>
          <p class="page-subtitle">
            Manage product return records for your current shop.
          </p>
        </div>

        <nav class="breadcrumb">
          <span>Home</span>
          <span class="sep">/</span>
          <span>POS</span>
          <span class="sep">/</span>
          <span class="current">Product Returns</span>
        </nav>
      </div>

      <button class="btn btn-primary add-btn" @click="openCreateModal">
        <span class="btn-icon">＋</span>
        Add Product Return
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Returns</div>
        <div class="stat-value">{{ filteredReturns.length }}</div>
        <div class="stat-note">Returns shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">With Customer</div>
        <div class="stat-value">{{ returnsWithCustomer }}</div>
        <div class="stat-note">Returns linked to a customer</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Latest Return</div>
        <div class="stat-value stat-truncate">{{ latestReturnLabel }}</div>
        <div class="stat-note">Most recent visible return</div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box toolbar-item toolbar-search">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by invoice, order, customer, returned by, or note..."
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
          <select v-model="customerFilter" class="filter-select">
            <option value="">All customers</option>
            <option
              v-for="customer in uniqueCustomers"
              :key="customer.id"
              :value="customer.name"
            >
              {{ customer.name }}
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
          <h2>Return List FINAL-777</h2>
          <p>{{ filteredReturns.length }} return(s) found</p>
        </div>

        <div v-if="loading" class="table-meta">Loading...</div>
      </div>

      <div v-if="errorMessage" class="alert-error">
        {{ errorMessage }}
      </div>

      <div class="table-wrapper desktop-table">
        <table class="return-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Invoice</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Returned At</th>
              <th>Returned By</th>
              <th>Note</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!loading && filteredReturns.length === 0">
              <td colspan="9" class="empty-cell">
                No product returns found.
              </td>
            </tr>

            <tr v-for="item in filteredReturns" :key="item.id">
              <td>
                <span class="id-badge">#{{ item.id }}</span>
              </td>

              <td>
                <div class="order-block">
                  <div class="order-code">{{ item.invoice_number || '-' }}</div>
                  <div class="order-sub">Return invoice</div>
                </div>
              </td>

              <td>
                <div class="order-block">
                  <div class="order-code">{{ item.order ?? '-' }}</div>
                  <div class="order-sub">Order reference</div>
                </div>
              </td>

              <td>
                <div class="customer-block">
                  <div class="customer-avatar">
                    {{ getInitials(item.customer_name || 'NA') }}
                  </div>
                  <div>
                    <div class="customer-name">{{ item.customer_name || '-' }}</div>
                    <div class="customer-sub">Customer</div>
                  </div>
                </div>
              </td>

              <td>
                <span class="item-count-badge">
                  {{ item.items.length }} item(s)
                </span>
              </td>
             <td>
                <div class="cell-primary">
                  {{ formatDateTimeDisplay(item.returned_at) }}
                </div>
              </td>

              <td>
                <div class="cell-primary">
                  {{ resolveReturnedByName(item.returned_by) }}
                </div>
              </td>
              <td class="note-cell">{{ item.note || '-' }}</td>

              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(item)">
                    View
                  </button>
                  <button class="btn btn-sm btn-warning" @click="openEditModal(item)">
                    Edit
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    :disabled="submitting"
                    @click="removeReturn(item.id)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-list">
        <div v-if="!loading && filteredReturns.length === 0" class="mobile-empty">
          No product returns found.
        </div>

        <div
          v-for="item in filteredReturns"
          :key="item.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div class="mobile-card-head-left">
              <div class="order-code">{{ item.invoice_number || '-' }}</div>
              <div class="customer-sub">Return #{{ item.id }}</div>
            </div>

            <span class="mobile-time">
              {{ formatDateShort(item.returned_at) }}
            </span>
          </div>

          <div class="mobile-customer-row">
            <div class="customer-avatar">
              {{ getInitials(item.customer_name || 'NA') }}
            </div>
            <div>
              <div class="customer-name">{{ item.customer_name || '-' }}</div>
              <div class="customer-sub">Customer</div>
            </div>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">Order</span>
              <span class="value">{{ item.order ?? '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Items</span>
              <span class="value">{{ item.items.length }}</span>
            </div>
           <div class="info-item">
              <span class="label">Returned By</span>
              <span class="value value-strong">{{ resolveReturnedByName(item.returned_by) }}</span>
            </div>

            <div class="info-item full">
              <span class="label">Returned At</span>
              <span class="value value-strong">{{ formatDateTimeDisplay(item.returned_at) }}</span>
            </div>
            <div class="info-item full">
              <span class="label">Note</span>
              <span class="value">{{ item.note || '-' }}</span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(item)">
              View
            </button>
            <button class="btn btn-sm btn-warning" @click="openEditModal(item)">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" @click="removeReturn(item.id)">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div>
              <h3>
                {{
                  modalMode === 'create'
                    ? 'Add Product Return'
                    : modalMode === 'edit'
                    ? 'Edit Product Return'
                    : 'Product Return Detail'
                }}
              </h3>
              <p>
                {{
                  modalMode === 'view'
                    ? 'View return information'
                    : 'Fill in the product return form below'
                }}
              </p>
            </div>

            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <form class="return-form" @submit.prevent="saveReturn">
              <div class="form-grid">
                <div class="form-group">
                  <label>Order</label>
                  <input
                    v-model.number="form.order"
                    type="number"
                    placeholder="Enter order id"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Customer</label>
                  <select
                    v-model="form.customer_id"
                    :disabled="modalMode === 'view'"
                  >
                    <option :value="null">Select customer</option>
                    <option
                      v-for="customer in customers"
                      :key="customer.id"
                      :value="customer.id"
                    >
                      {{ customer.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group full">
                  <label>Note</label>
                  <textarea
                    v-model="form.note"
                    rows="4"
                    placeholder="Enter return note"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Return Date <span>*</span></label>
                  <input
                    v-model="returnedDate"
                    type="date"
                    :disabled="modalMode === 'view'"
                    @input="syncReturnedAt"
                  />
                  <button
                    v-if="modalMode !== 'view'"
                    type="button"
                    class="quick-link"
                    @click="setTodayDate"
                  >
                    Today
                  </button>
                </div>

                <div class="form-group">
                  <label>Return Time <span>*</span></label>
                  <input
                    v-model="returnedTime"
                    type="time"
                    step="1"
                    :disabled="modalMode === 'view'"
                    @input="syncReturnedAt"
                  />
                  <button
                    v-if="modalMode !== 'view'"
                    type="button"
                    class="quick-link"
                    @click="setNowTime"
                  >
                    Now
                  </button>
                </div>

                <div class="form-group">
                  <label>Combined Returned At</label>
                  <input
                    :value="form.returned_at"
                    type="text"
                    disabled
                  />
                </div>
              </div>

              <div class="items-section">
                <div class="items-header">
                  <div>
                    <h4>Return Items</h4>
                    <p>Add one or more items for this return.</p>
                  </div>

                  <button
                    v-if="modalMode !== 'view'"
                    type="button"
                    class="btn btn-light btn-sm"
                    @click="addItemRow"
                  >
                    Add Item
                  </button>
                </div>

                <div v-if="form.items.length === 0" class="empty-items">
                  No return items added yet.
                </div>

                <div
                  v-for="(item, index) in form.items"
                  :key="item.uid"
                  class="item-row"
                >
                  <div class="item-grid">
                    <div class="form-group">
                      <label>Product <span>*</span></label>
                      <select
                        v-model="item.product_id"
                        :disabled="modalMode === 'view'"
                      >
                        <option :value="null">Select product</option>
                        <option
                          v-for="product in products"
                          :key="product.id"
                          :value="product.id"
                        >
                          {{ product.name }}
                        </option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Quantity <span>*</span></label>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        step="1"
                        :disabled="modalMode === 'view'"
                        placeholder="1"
                      />
                    </div>

                    <div class="form-group">
                      <label>Unit Price</label>
                      <input
                        v-model.number="item.unit_price"
                        type="number"
                        min="0"
                        step="0.01"
                        :disabled="modalMode === 'view'"
                        placeholder="0.00"
                      />
                    </div>

                    <div
                      v-if="modalMode !== 'view'"
                      class="form-group item-remove-wrap"
                    >
                      <label>&nbsp;</label>
                      <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        @click="removeItemRow(index)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="modalMode !== 'view'" class="modal-footer">
                <button type="button" class="btn btn-light modal-btn" @click="closeModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary modal-btn" :disabled="submitting">
                  {{ submitting ? 'Saving...' : modalMode === 'create' ? 'Save Product Return' : 'Update Product Return' }}
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

type ModalMode = 'create' | 'edit' | 'view'

type ApiCustomer = {
  id: number
  name?: string
  display_name?: string
  full_name?: string
}

type ApiReturnedBy = {
  id?: number
  username?: string
  display_name?: string
  name?: string
  full_name?: string
  first_name?: string
  last_name?: string
}

type ApiReturnItem = {
  id?: number
  product_id?: number | null
  product?: number | null
  product_name?: string
  quantity?: number | string
  unit_price?: number | string
}

type ApiProductReturn = {
  id: number
  order: number | null
  invoice_number: string
  customer: ApiCustomer | null
  note: string
  returned_at: string
  returned_by: ApiReturnedBy | string | null
  items: ApiReturnItem[]
}

type ProductReturnRow = {
  id: number
  order: number | null
  invoice_number: string
  customer: ApiCustomer | null
  customer_name: string
  note: string
  returned_at: string
  returned_by: ApiReturnedBy | string | null
  returned_by_name: string
  items: ApiReturnItem[]
}

type CustomerOption = {
  id: number
  name: string
}

type ProductOption = {
  id: number
  name: string
}

type FormItem = {
  uid: string
  id?: number
  product_id: number | null
  quantity: number
  unit_price: number | null
}

const search = ref('')
const dateFilter = ref('')
const customerFilter = ref('')
const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const returnedDate = ref('')
const returnedTime = ref('')

const productReturns = ref<ProductReturnRow[]>([])
const customers = ref<CustomerOption[]>([])
const products = ref<ProductOption[]>([])

const form = reactive({
  order: null as number | null,
  customer_id: null as number | null,
  note: '',
  returned_at: '',
  items: [] as FormItem[],
})

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Token ${token}`
  }

  config.headers['Content-Type'] = 'application/json'
  return config
})

function resolveCustomerName(customer: any) {
  if (!customer) return ''
  if (typeof customer === 'string') return customer
  return customer.name || customer.display_name || customer.full_name || ''
}

function resolveReturnedByName(returnedBy: any) {
  if (!returnedBy) return '-'

  if (typeof returnedBy === 'string') {
    return returnedBy || '-'
  }

  if (typeof returnedBy === 'object') {
    return (
      returnedBy.display_name ||
      returnedBy.username ||
      returnedBy.name ||
      returnedBy.full_name ||
      [returnedBy.first_name, returnedBy.last_name].filter(Boolean).join(' ') ||
      '-'
    )
  }

  return '-'
}

function normalizeReturn(item: any): ProductReturnRow {
  return {
    id: Number(item?.id || 0),
    order: item?.order ?? null,
    invoice_number: item?.invoice_number || '',
    customer: item?.customer || null,
    customer_name: resolveCustomerName(item?.customer),
    note: item?.note || '',
    returned_at: item?.returned_at || '',
    returned_by: item?.returned_by || null,
    returned_by_name: resolveReturnedByName(item?.returned_by),
    items: Array.isArray(item?.items) ? item.items : [],
  }
}

const uniqueCustomers = computed(() => {
  const map = new Map<number, CustomerOption>()

  productReturns.value.forEach((item) => {
    if (item.customer?.id) {
      map.set(item.customer.id, {
        id: item.customer.id,
        name: item.customer_name || `Customer #${item.customer.id}`,
      })
    }
  })

  return Array.from(map.values())
})

const filteredReturns = computed(() => {
  let result = [...productReturns.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((item) => {
      return (
        String(item.id).toLowerCase().includes(q) ||
        String(item.order ?? '').toLowerCase().includes(q) ||
        String(item.invoice_number ?? '').toLowerCase().includes(q) ||
        String(item.customer_name ?? '').toLowerCase().includes(q) ||
        String(resolveReturnedByName(item.returned_by)).toLowerCase().includes(q) ||
        String(item.note ?? '').toLowerCase().includes(q) ||
        String(item.returned_at ?? '').toLowerCase().includes(q)
      )
    })
  }

  if (dateFilter.value) {
    result = result.filter((item) => String(item.returned_at || '').slice(0, 10) === dateFilter.value)
  }

  if (customerFilter.value) {
    result = result.filter((item) => item.customer_name === customerFilter.value)
  }

  return result
})

const returnsWithCustomer = computed(() => {
  return productReturns.value.filter((item) => String(item.customer_name || '').trim().length > 0).length
})

const latestReturnLabel = computed(() => {
  if (!filteredReturns.value.length) return '-'

  const sorted = [...filteredReturns.value].sort((a, b) => {
    const aTime = new Date(a.returned_at || '').getTime()
    const bTime = new Date(b.returned_at || '').getTime()
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
  })

  return sorted[0]?.invoice_number || '-'
})

function emptyItemRow(): FormItem {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_id: null,
    quantity: 1,
    unit_price: 0,
  }
}

function resetForm() {
  form.order = null
  form.customer_id = null
  form.note = ''
  form.returned_at = ''
  form.items = [emptyItemRow()]
  returnedDate.value = ''
  returnedTime.value = ''
}

function fillForm(item: ProductReturnRow) {
  form.order = item.order
  form.customer_id = item.customer?.id ?? null
  form.note = item.note || ''
  form.returned_at = item.returned_at || ''

  form.items = (item.items || []).map((row, index) => ({
    uid: `${item.id}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    id: row.id,
    product_id: row.product_id ?? row.product ?? null,
    quantity: Number(row.quantity || 1),
    unit_price:
      row.unit_price !== undefined && row.unit_price !== null
        ? Number(row.unit_price)
        : 0,
  }))

  if (form.items.length === 0) {
    form.items = [emptyItemRow()]
  }

  if (item.returned_at) {
    const dt = new Date(item.returned_at)
    if (!Number.isNaN(dt.getTime())) {
      returnedDate.value = toDateInputValue(dt)
      returnedTime.value = toTimeInputValue(dt, true)
      syncReturnedAt()
    } else {
      returnedDate.value = String(item.returned_at).slice(0, 10)
      returnedTime.value = String(item.returned_at).slice(11, 19) || '00:00:00'
    }
  } else {
    returnedDate.value = ''
    returnedTime.value = ''
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  resetForm()
  setTodayDate()
  setNowTime()
  showModal.value = true
}

function openEditModal(item: ProductReturnRow) {
  modalMode.value = 'edit'
  editingId.value = item.id
  fillForm(item)
  showModal.value = true
}

function openViewModal(item: ProductReturnRow) {
  modalMode.value = 'view'
  editingId.value = item.id
  fillForm(item)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  resetForm()
}

function resetFilters() {
  search.value = ''
  dateFilter.value = ''
  customerFilter.value = ''
}

function addItemRow() {
  form.items.push(emptyItemRow())
}

function removeItemRow(index: number) {
  if (form.items.length === 1) {
    form.items = [emptyItemRow()]
    return
  }
  form.items.splice(index, 1)
}

function syncReturnedAt() {
  if (!returnedDate.value) {
    form.returned_at = ''
    return
  }

  const time = returnedTime.value || '00:00:00'
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  form.returned_at = `${returnedDate.value}T${normalizedTime}`
}

function setTodayDate() {
  const now = new Date()
  returnedDate.value = toDateInputValue(now)
  syncReturnedAt()
}

function setNowTime() {
  const now = new Date()
  returnedTime.value = toTimeInputValue(now, true)
  syncReturnedAt()
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toTimeInputValue(date: Date, withSeconds = false) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return withSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`
}

function formatDateTimeDisplay(value: any) {
  if (!value) return '-'

  const raw = String(value).trim()
  if (!raw) return '-'

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) {
    return raw
  }

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDateShort(value: any) {
  if (!value) return '-'

  const raw = String(value).trim()
  if (!raw) return '-'

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getInitials(name: unknown) {
  const safe = String(name || 'NA')
  return (
    safe
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NA'
  )
}

function validateForm() {
  syncReturnedAt()

  if (!form.returned_at.trim()) {
    alert('Returned date and time are required.')
    return false
  }

  if (!Array.isArray(form.items) || form.items.length === 0) {
    alert('At least one return item is required.')
    return false
  }

  for (const item of form.items) {
    if (!item.product_id) {
      alert('Each item must have a product.')
      return false
    }
    if (!item.quantity || Number(item.quantity) <= 0) {
      alert('Each item quantity must be greater than 0.')
      return false
    }
  }

  return true
}

function buildPayload() {
  return {
    order: form.order || null,
    customer_id: form.customer_id || null,
    note: form.note.trim(),
    items: form.items.map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_price: item.unit_price !== null ? Number(item.unit_price) : 0,
    })),
  }
}

async function fetchReturns() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/api/productreturns/')

    console.log('PRODUCT RETURNS RAW:', data)
    console.log('RAW FIRST ITEM:', Array.isArray(data) ? data[0] : data)

    productReturns.value = Array.isArray(data)
      ? data.map(normalizeReturn)
      : []

    console.log('PRODUCT RETURNS NORMALIZED:', productReturns.value)
    console.log('NORMALIZED FIRST ITEM:', productReturns.value[0])

    if (productReturns.value[0]) {
      console.log('FIRST returned_at:', productReturns.value[0].returned_at)
      console.log('FIRST returned_by:', productReturns.value[0].returned_by)
      console.log('FIRST returned_by_name:', productReturns.value[0].returned_by_name)
    }
  } catch (error: any) {
    console.error('Failed to fetch product returns:', error)
    errorMessage.value =
      error?.response?.data?.detail ||
      'Failed to load product returns.'
  } finally {
    loading.value = false
  }
}

async function fetchCustomers() {
  try {
    const { data } = await api.get('/api/customers/')
    const raw = Array.isArray(data) ? data : data?.results || []
    customers.value = raw.map((item: any) => ({
      id: item.id,
      name: item.name || item.display_name || item.full_name || `Customer #${item.id}`,
    }))
  } catch (error) {
    console.warn('Failed to load customers:', error)
  }
}

async function fetchProducts() {
  try {
    const { data } = await api.get('/api/products/')
    const raw = Array.isArray(data) ? data : data?.results || []
    products.value = raw.map((item: any) => ({
      id: item.id,
      name: item.name,
    }))
  } catch (error) {
    console.warn('Failed to load products:', error)
  }
}

async function saveReturn() {
  if (!validateForm()) return

  submitting.value = true
  errorMessage.value = ''

  try {
    const payload = buildPayload()

    if (modalMode.value === 'create') {
      await api.post('/api/productreturns/', payload)
    } else if (modalMode.value === 'edit' && editingId.value !== null) {
      await api.put(`/api/productreturns/${editingId.value}/`, payload)
    }

    await fetchReturns()
    closeModal()
  } catch (error: any) {
    console.error('Failed to save product return:', error)
    const serverMessage =
      error?.response?.data?.detail ||
      JSON.stringify(error?.response?.data || {}) ||
      'Failed to save product return.'
    alert(serverMessage)
  } finally {
    submitting.value = false
  }
}

async function removeReturn(id: number) {
  const ok = window.confirm('Delete this product return?')
  if (!ok) return

  submitting.value = true
  try {
    await api.delete(`/api/productreturns/${id}/`)
    productReturns.value = productReturns.value.filter((item) => item.id !== id)
  } catch (error: any) {
    console.error('Failed to delete product return:', error)
    alert(
      error?.response?.data?.detail ||
      'Failed to delete product return.'
    )
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  resetForm()
  await Promise.all([fetchReturns(), fetchCustomers(), fetchProducts()])
})
</script>

<style scoped>
.product-returns-page {
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

.stat-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
.filter-input:focus,
.filter-select:focus,
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
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

.filter-input,
.filter-select {
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

.table-meta {
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.alert-error {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 14px;
}

.table-wrapper {
  overflow-x: auto;
}

.return-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1180px;
}

.return-table th,
.return-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.return-table th {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  background: #fbfcfe;
  white-space: nowrap;
}

.return-table tbody tr:hover {
  background: #fafcff;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.item-count-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f0fdf4;
  color: #15803d;
  font-size: 12px;
  font-weight: 700;
}

.order-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.order-code {
  color: #2563eb;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.order-sub {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

.customer-block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.customer-avatar {
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

.customer-name {
  font-weight: 700;
  color: #162033;
  line-height: 1.4;
  word-break: break-word;
}

.customer-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8798;
  line-height: 1.4;
}

.note-cell {
  max-width: 240px;
  color: #334155;
  word-break: break-word;
  line-height: 1.5;
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

.mobile-customer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.mobile-time {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  padding: 6px 10px;
  white-space: nowrap;
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

.modal-lg {
  max-width: 980px;
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

.return-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.quick-link {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.items-section {
  margin-top: 6px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid #e8edf5;
  background: #fafcff;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.items-header h4 {
  margin: 0;
  font-size: 18px;
  color: #162033;
}

.items-header p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.empty-items {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  border: 1px dashed #d6deea;
  border-radius: 14px;
  background: #fff;
}

.item-row {
  padding: 14px;
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 16px;
  margin-bottom: 12px;
}

.item-row:last-child {
  margin-bottom: 0;
}

.item-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 120px;
  gap: 14px;
  align-items: end;
}

.item-remove-wrap {
  justify-content: flex-end;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .item-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .product-returns-page {
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .product-returns-page {
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

  .desktop-table {
    display: none;
  }

  .mobile-list {
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
  .modal-lg {
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
  .item-grid {
    grid-template-columns: 1fr;
  }

  .mobile-actions {
    grid-template-columns: 1fr;
  }

  .mobile-actions .btn {
    height: 40px;
  }
}

@media (max-width: 480px) {
  .product-returns-page {
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

  .mobile-card {
    padding: 14px;
    border-radius: 16px;
  }

  .customer-avatar {
    width: 36px;
    height: 36px;
    font-size: 11px;
  }

  .mobile-time {
    font-size: 11px;
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
}
.cell-primary {
  color: #162033 !important;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  display: block;
  white-space: normal;
  word-break: break-word;
}

.value-strong {
  color: #162033 !important;
  font-weight: 600;
}
</style>