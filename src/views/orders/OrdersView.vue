<template>
  <section class="orders-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <div>
          <h1 class="page-title">Orders</h1>
          <p class="page-subtitle">
            Manage sales orders for your current shop.
          </p>
        </div>

        <nav class="breadcrumb">
          <span>Home</span>
          <span class="sep">/</span>
          <span>POS</span>
          <span class="sep">/</span>
          <span class="current">Orders</span>
        </nav>
      </div>

      <button class="btn btn-primary add-btn" @click="openCreateModal">
        <span class="btn-icon">＋</span>
        Add Order
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Orders</div>
        <div class="stat-value">{{ filteredOrders.length }}</div>
        <div class="stat-note">Orders shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Paid Orders</div>
        <div class="stat-value">{{ paidOrdersCount }}</div>
        <div class="stat-note">Orders marked as paid</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Amount</div>
        <div class="stat-value">${{ filteredTotalAmount }}</div>
        <div class="stat-note">Total from visible orders</div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box toolbar-item toolbar-search">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by invoice, customer id, payment, notes..."
          />
        </div>

        <div class="toolbar-item">
          <select v-model="paymentFilter" class="filter-select">
            <option value="">All payment methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="TRANSFER">Transfer</option>
            <option value="QRIS">QRIS</option>
            <option value="BANK">Bank</option>
            <option value="SPLIT">Split</option>
          </select>
        </div>

        <div class="toolbar-item">
          <select v-model="paidFilter" class="filter-select">
            <option value="">All status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
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
          <h2>Order List</h2>
          <p>{{ filteredOrders.length }} order(s) found</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        Loading orders...
      </div>

      <div v-else-if="errorMessage" class="error-state">
        {{ errorMessage }}
      </div>

      <div v-else class="table-wrapper desktop-table">
        <table class="order-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Order Type</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="8" class="empty-cell">
                No orders found.
              </td>
            </tr>

            <tr v-for="order in filteredOrders" :key="order.id">
              <td>
                <div class="invoice-block">
                  <span class="invoice-code">{{ order.invoice_number }}</span>
                  <span class="invoice-type">{{ order.default_order_type || '-' }}</span>
                </div>
              </td>

              <td>
                <div class="customer-block">
                  <div class="customer-avatar">
                    {{ getInitials(getCustomerLabel(order.customer)) }}
                  </div>
                  <div>
                    <div class="customer-name">{{ getCustomerLabel(order.customer) }}</div>
                    <div class="customer-sub">Order #{{ order.id }}</div>
                  </div>
                </div>
              </td>

              <td>
                <span
                  class="payment-badge"
                  :class="paymentBadgeClass(order.payment_method)"
                >
                  {{ displayPaymentMethod(order.payment_method) }}
                </span>
              </td>

              <td class="amount-cell">${{ formatMoney(order.total) }}</td>

              <td>
                <span :class="['status-badge', order.is_paid ? 'status-paid' : 'status-unpaid']">
                  {{ order.is_paid ? 'Paid' : 'Unpaid' }}
                </span>
              </td>

              <td>
                <span class="date-text">
                  {{ order.created_at ? formatDateTime(order.created_at) : '-' }}
                </span>
              </td>

              <td>
                <span
                  class="order-type-badge"
                  :class="orderTypeBadgeClass(order.default_order_type)"
                >
                  {{ order.default_order_type || '-' }}
                </span>
              </td>

              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(order)">
                    View
                  </button>
                  <button class="btn btn-sm btn-warning" @click="openEditModal(order)">
                    Edit
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    :disabled="deletingId === order.id"
                    @click="removeOrder(order.id)"
                  >
                    {{ deletingId === order.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !errorMessage" class="mobile-list">
        <div v-if="filteredOrders.length === 0" class="mobile-empty">
          No orders found.
        </div>

        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div class="mobile-card-head-left">
              <div class="invoice-code">{{ order.invoice_number }}</div>
              <div class="customer-sub">Order #{{ order.id }}</div>
            </div>

            <span :class="['status-badge', order.is_paid ? 'status-paid' : 'status-unpaid']">
              {{ order.is_paid ? 'Paid' : 'Unpaid' }}
            </span>
          </div>

          <div class="mobile-customer-row">
            <div class="customer-avatar">
              {{ getInitials(getCustomerLabel(order.customer)) }}
            </div>
            <div>
              <div class="customer-name">{{ getCustomerLabel(order.customer) }}</div>
              <div class="customer-sub">{{ order.notes || 'No notes' }}</div>
            </div>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">Payment</span>
              <span class="value">
                <span
                  class="payment-badge"
                  :class="paymentBadgeClass(order.payment_method)"
                >
                  {{ displayPaymentMethod(order.payment_method) }}
                </span>
              </span>
            </div>

            <div class="info-item">
              <span class="label">Order Type</span>
              <span class="value">
                <span
                  class="order-type-badge"
                  :class="orderTypeBadgeClass(order.default_order_type)"
                >
                  {{ order.default_order_type || '-' }}
                </span>
              </span>
            </div>

            <div class="info-item">
              <span class="label">Total</span>
              <span class="value strong">${{ formatMoney(order.total) }}</span>
            </div>

            <div class="info-item">
              <span class="label">Discount</span>
              <span class="value">${{ formatMoney(order.discount) }}</span>
            </div>

            <div class="info-item full">
              <span class="label">Created At</span>
              <span class="value">{{ order.created_at ? formatDateTime(order.created_at) : '-' }}</span>
            </div>

            <div class="info-item full">
              <span class="label">Delivery / Table</span>
              <span class="value">
                Table: {{ order.table_number || '-' }} · Address: {{ order.delivery_address || '-' }}
              </span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(order)">
              View
            </button>
            <button class="btn btn-sm btn-warning" @click="openEditModal(order)">
              Edit
            </button>
            <button
              class="btn btn-sm btn-danger"
              :disabled="deletingId === order.id"
              @click="removeOrder(order.id)"
            >
              {{ deletingId === order.id ? 'Deleting...' : 'Delete' }}
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
                    ? 'Add Order'
                    : modalMode === 'edit'
                    ? 'Edit Order'
                    : 'Order Detail'
                }}
              </h3>
              <p>
                {{
                  modalMode === 'view'
                    ? 'View order information'
                    : 'Fill in the order form below'
                }}
              </p>
            </div>

            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <form class="order-form" @submit.prevent="saveOrder">
              <div class="form-grid">
                <div class="form-group">
                  <label>Customer ID</label>
                  <input
                    v-model="form.customer"
                    type="number"
                    min="1"
                    placeholder="Leave empty for walk-in"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group">
                  <label>Payment Method</label>
                  <input
                    v-model="form.payment_method"
                    type="text"
                    placeholder="CASH / CARD / TRANSFER / QRIS / BANK / SPLIT"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group">
                  <label>Order Type</label>
                  <select v-model="form.order_type" :disabled="modalMode === 'view' || saving">
                    <option value="GENERAL">GENERAL</option>
                    <option value="DINE_IN">DINE_IN</option>
                    <option value="TAKE_OUT">TAKE_OUT</option>
                    <option value="DELIVERY">DELIVERY</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Default Order Type</label>
                  <select v-model="form.default_order_type" :disabled="modalMode === 'view' || saving">
                    <option value="GENERAL">GENERAL</option>
                    <option value="DINE_IN">DINE_IN</option>
                    <option value="TAKE_OUT">TAKE_OUT</option>
                    <option value="DELIVERY">DELIVERY</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Discount</label>
                  <input
                    v-model="form.discount"
                    type="text"
                    placeholder="0.00"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group">
                  <label>Tax</label>
                  <input
                    v-model="form.tax"
                    type="text"
                    placeholder="0.00"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group">
                  <label>Delivery Fee</label>
                  <input
                    v-model="form.delivery_fee"
                    type="text"
                    placeholder="0.00"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group checkbox-group">
                  <label>Paid Status</label>
                  <div class="checkbox-wrap">
                    <input
                      v-model="form.is_paid"
                      type="checkbox"
                      :disabled="modalMode === 'view' || saving"
                    />
                    <span>Mark this order as paid</span>
                  </div>
                </div>

                <div class="form-group full">
                  <label>Table Number</label>
                  <input
                    v-model="form.table_number"
                    type="text"
                    placeholder="Table 01"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group full">
                  <label>Delivery Address</label>
                  <textarea
                    v-model="form.delivery_address"
                    rows="3"
                    placeholder="Enter delivery address"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group full">
                  <label>Notes</label>
                  <textarea
                    v-model="form.notes"
                    rows="4"
                    placeholder="Enter order notes"
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group full">
                  <label>Items JSON <span>*</span></label>
                  <textarea
                    v-model="itemsJson"
                    rows="8"
                    placeholder='Example: [{"product":1,"quantity":"2","unit_price":"5.00"}]'
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>

                <div class="form-group full">
                  <label>Payments JSON</label>
                  <textarea
                    v-model="paymentsJson"
                    rows="6"
                    placeholder='Example: [{"method":"CASH","amount":"10.00"}]'
                    :disabled="modalMode === 'view' || saving"
                  />
                </div>
              </div>

              <div v-if="modalMode === 'view'" class="summary-grid">
                <div class="summary-card">
                  <div class="summary-label">Invoice</div>
                  <div class="summary-value">{{ selectedOrder?.invoice_number || '-' }}</div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">Payment</div>
                  <div class="summary-value">
                    {{ displayPaymentMethod(selectedOrder?.payment_method) }}
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">Created At</div>
                  <div class="summary-value">
                    {{ selectedOrder?.created_at ? formatDateTime(selectedOrder.created_at) : '-' }}
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">Subtotal</div>
                  <div class="summary-value">${{ formatMoney(selectedOrder?.subtotal) }}</div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">Total</div>
                  <div class="summary-value">${{ formatMoney(selectedOrder?.total) }}</div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">Order Type</div>
                  <div class="summary-value">{{ selectedOrder?.default_order_type || '-' }}</div>
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
                      : (modalMode === 'create' ? 'Save Order' : 'Update Order')
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
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type OrderType = 'GENERAL' | 'DINE_IN' | 'TAKE_OUT' | 'DELIVERY'

type Order = {
  id: number
  invoice_number: string
  customer: number | null
  created_at: string
  payment_method: string
  subtotal: string
  discount: string
  tax: string
  total: string
  notes: string
  is_paid: boolean
  default_order_type: OrderType | string
  table_number: string
  delivery_address: string
  delivery_fee: string
  items: any[]
  payments: any[]
  payment_records?: any[]
  order_type?: OrderType | string
}

type ModalMode = 'create' | 'edit' | 'view'

const search = ref('')
const paymentFilter = ref('')
const paidFilter = ref('')
const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const formError = ref('')
const selectedOrder = ref<Order | null>(null)

const orders = ref<Order[]>([])

const form = reactive({
  customer: '' as string | number,
  payment_method: 'CASH',
  discount: '0.00',
  tax: '0.00',
  notes: '',
  is_paid: true,
  order_type: 'GENERAL' as OrderType,
  default_order_type: 'GENERAL' as OrderType,
  table_number: '',
  delivery_address: '',
  delivery_fee: '0.00',
})

const itemsJson = ref('[]')
const paymentsJson = ref('[]')

const filteredOrders = computed(() => {
  let result = [...orders.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((order) => {
      return (
        String(order.invoice_number || '').toLowerCase().includes(q) ||
        getCustomerLabel(order.customer).toLowerCase().includes(q) ||
        String(order.payment_method || '').toLowerCase().includes(q) ||
        String(order.notes || '').toLowerCase().includes(q) ||
        String(order.default_order_type || '').toLowerCase().includes(q)
      )
    })
  }

  if (paymentFilter.value) {
    result = result.filter(
      (order) => String(order.payment_method || '').toUpperCase() === paymentFilter.value
    )
  }

  if (paidFilter.value === 'paid') {
    result = result.filter((order) => order.is_paid)
  } else if (paidFilter.value === 'unpaid') {
    result = result.filter((order) => !order.is_paid)
  }

  return result
})

const paidOrdersCount = computed(() => {
  return orders.value.filter((order) => order.is_paid).length
})

const filteredTotalAmount = computed(() => {
  const total = filteredOrders.value.reduce((sum, order) => sum + Number(order.total || 0), 0)
  return formatMoney(total)
})

function resetForm() {
  form.customer = ''
  form.payment_method = 'CASH'
  form.discount = '0.00'
  form.tax = '0.00'
  form.notes = ''
  form.is_paid = true
  form.order_type = 'GENERAL'
  form.default_order_type = 'GENERAL'
  form.table_number = ''
  form.delivery_address = ''
  form.delivery_fee = '0.00'
  itemsJson.value = '[]'
  paymentsJson.value = '[]'
  formError.value = ''
}

function fillForm(order: Order) {
  form.customer = order.customer ?? ''
  form.payment_method = String(order.payment_method || 'CASH')
  form.discount = normalizeDecimalInput(order.discount, '0.00')
  form.tax = normalizeDecimalInput(order.tax, '0.00')
  form.notes = order.notes || ''
  form.is_paid = !!order.is_paid
  form.order_type = (order.order_type || order.default_order_type || 'GENERAL') as OrderType
  form.default_order_type = (order.default_order_type || 'GENERAL') as OrderType
  form.table_number = order.table_number || ''
  form.delivery_address = order.delivery_address || ''
  form.delivery_fee = normalizeDecimalInput(order.delivery_fee, '0.00')
  itemsJson.value = JSON.stringify(order.items || [], null, 2)
  paymentsJson.value = JSON.stringify(order.payments || [], null, 2)
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  selectedOrder.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(order: Order) {
  modalMode.value = 'edit'
  editingId.value = order.id
  selectedOrder.value = order
  resetForm()
  fillForm(order)
  showModal.value = true
}

function openViewModal(order: Order) {
  modalMode.value = 'view'
  editingId.value = order.id
  selectedOrder.value = order
  resetForm()
  fillForm(order)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  selectedOrder.value = null
  resetForm()
}

function resetFilters() {
  search.value = ''
  paymentFilter.value = ''
  paidFilter.value = ''
}

function formatMoney(value: unknown) {
  return Number(value || 0).toFixed(2)
}

function formatDateTime(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getInitials(name: string) {
  return String(name || 'WI')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getCustomerLabel(customer: number | null) {
  return customer ? `Customer #${customer}` : 'Walk In'
}

function normalizeDecimalInput(value: unknown, fallback = '0.00') {
  const text = String(value ?? '').trim()
  return text === '' ? fallback : text
}

function safeParseJsonArray(raw: string, fieldName: string) {
  try {
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON array.`)
    }
    return parsed
  } catch (error: any) {
    throw new Error(error?.message || `Invalid JSON in ${fieldName}.`)
  }
}

function validateForm() {
  formError.value = ''

  if (!String(form.payment_method).trim()) {
    formError.value = 'Payment method is required.'
    return false
  }

  try {
    const parsedItems = safeParseJsonArray(itemsJson.value, 'Items')
    if (parsedItems.length === 0) {
      formError.value = 'Items JSON is required and cannot be empty.'
      return false
    }
    safeParseJsonArray(paymentsJson.value || '[]', 'Payments')
  } catch (error: any) {
    formError.value = error.message
    return false
  }

  return true
}

function buildPayload() {
  const customerValue =
    String(form.customer).trim() === '' ? null : Number(form.customer)

  return {
    customer: Number.isNaN(customerValue as number) ? null : customerValue,
    payment_method: String(form.payment_method).trim(),
    discount: normalizeDecimalInput(form.discount, '0.00'),
    tax: normalizeDecimalInput(form.tax, '0.00'),
    notes: String(form.notes).trim(),
    is_paid: form.is_paid,
    order_type: form.order_type,
    default_order_type: form.default_order_type,
    table_number: String(form.table_number).trim(),
    delivery_address: String(form.delivery_address).trim(),
    delivery_fee: normalizeDecimalInput(form.delivery_fee, '0.00'),
    items: safeParseJsonArray(itemsJson.value, 'Items'),
    payments: safeParseJsonArray(paymentsJson.value || '[]', 'Payments'),
  }
}

function normalizeOrder(order: any): Order {
  const paymentMethod = String(order?.payment_method ?? '-').trim() || '-'
  const createdAt = String(order?.created_at ?? '').trim()
  const defaultOrderType =
    String(
      order?.default_order_type ||
      order?.order_type ||
      order?.items?.[0]?.order_type ||
      '-'
    ).trim() || '-'

  return {
    id: Number(order?.id ?? 0),
    invoice_number: String(order?.invoice_number ?? '-'),
    customer: order?.customer ?? null,
    created_at: createdAt,
    payment_method: paymentMethod,
    subtotal: normalizeDecimalInput(order?.subtotal, '0.00'),
    discount: normalizeDecimalInput(order?.discount, '0.00'),
    tax: normalizeDecimalInput(order?.tax, '0.00'),
    total: normalizeDecimalInput(order?.total, '0.00'),
    notes: String(order?.notes ?? ''),
    is_paid: !!order?.is_paid,
    default_order_type: defaultOrderType,
    table_number: String(order?.table_number ?? ''),
    delivery_address: String(order?.delivery_address ?? ''),
    delivery_fee: normalizeDecimalInput(order?.delivery_fee, '0.00'),
    items: Array.isArray(order?.items) ? order.items : [],
    payments: Array.isArray(order?.payments) ? order.payments : [],
    payment_records: Array.isArray(order?.payment_records) ? order.payment_records : [],
    order_type: order?.order_type ?? undefined,
  }
}

function displayPaymentMethod(value: unknown) {
  const raw = String(value || '-').toUpperCase()

  if (raw === 'CASH') return 'Cash'
  if (raw === 'CARD') return 'Card'
  if (raw === 'TRANSFER') return 'Transfer'
  if (raw === 'QRIS') return 'QRIS'
  if (raw === 'BANK') return 'Bank'
  if (raw === 'SPLIT') return 'Split'
  return raw || '-'
}

function paymentBadgeClass(value: unknown) {
  const raw = String(value || '').toUpperCase()

  return {
    'payment-cash': raw === 'CASH',
    'payment-card': raw === 'CARD',
    'payment-transfer': raw === 'TRANSFER' || raw === 'BANK',
    'payment-qris': raw === 'QRIS',
    'payment-split': raw === 'SPLIT',
  }
}

function orderTypeBadgeClass(value: unknown) {
  const raw = String(value || '').toUpperCase()

  return {
    'type-general': raw === 'GENERAL',
    'type-dinein': raw === 'DINE_IN',
    'type-takeout': raw === 'TAKE_OUT',
    'type-delivery': raw === 'DELIVERY',
  }
}

async function fetchOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(ENDPOINTS.ORDERS)
    const rawOrders = Array.isArray(response.data) ? response.data : []
    orders.value = rawOrders.map(normalizeOrder)
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to load orders.'
  } finally {
    loading.value = false
  }
}

async function saveOrder() {
  if (!validateForm()) return

  saving.value = true
  formError.value = ''

  try {
    const payload = buildPayload()

    if (modalMode.value === 'create') {
      await api.post(ENDPOINTS.ORDERS, payload)
    } else if (modalMode.value === 'edit' && editingId.value !== null) {
      await api.patch(`${ENDPOINTS.ORDERS}${editingId.value}/`, payload)
    }

    await fetchOrders()
    closeModal()
  } catch (error: any) {
    const data = error?.response?.data

    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      if (firstKey) {
        const firstValue = data[firstKey as keyof typeof data]
        formError.value = Array.isArray(firstValue) ? firstValue[0] : String(firstValue)
      } else {
        formError.value = 'Failed to save order.'
      }
    } else {
      formError.value = error?.message || 'Failed to save order.'
    }
  } finally {
    saving.value = false
  }
}

async function removeOrder(id: number) {
  const ok = window.confirm('Delete this order?')
  if (!ok) return

  deletingId.value = id

  try {
    await api.delete(`${ENDPOINTS.ORDERS}${id}/`)
    orders.value = orders.value.filter((o) => o.id !== id)
  } catch (error: any) {
    alert(
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to delete order.'
    )
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-page {
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
  grid-template-columns: minmax(260px, 2fr) minmax(180px, 1fr) minmax(160px, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.toolbar-item {
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

.table-wrapper {
  overflow-x: auto;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1120px;
}

.order-table th,
.order-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.order-table th {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  background: #fbfcfe;
  white-space: nowrap;
}

.order-table tbody tr:hover {
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

.amount-cell {
  font-weight: 800;
  color: #162033;
  white-space: nowrap;
}

.status-badge,
.payment-badge,
.order-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-paid {
  background: #ecfdf3;
  color: #16a34a;
}

.status-unpaid {
  background: #fff7ed;
  color: #c2410c;
}

.payment-cash {
  background: #ecfdf3;
  color: #15803d;
}

.payment-card {
  background: #eff6ff;
  color: #1d4ed8;
}

.payment-transfer {
  background: #f5f3ff;
  color: #7c3aed;
}

.payment-qris {
  background: #ecfeff;
  color: #0f766e;
}

.payment-split {
  background: #fff7ed;
  color: #c2410c;
}

.type-general {
  background: #f3f4f6;
  color: #374151;
}

.type-dinein {
  background: #eff6ff;
  color: #1d4ed8;
}

.type-takeout {
  background: #f0fdf4;
  color: #15803d;
}

.type-delivery {
  background: #fff7ed;
  color: #c2410c;
}

.date-text {
  display: inline-block;
  color: #162033;
  font-weight: 600;
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

.info-item .value.strong {
  font-weight: 800;
  color: #162033;
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 6px;
}

.summary-card {
  border: 1px solid #edf2f7;
  border-radius: 16px;
  padding: 16px;
  background: #fbfcfe;
}

.summary-label {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 6px;
}

.summary-value {
  color: #162033;
  font-weight: 800;
  word-break: break-word;
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

.order-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.checkbox-group {
  justify-content: end;
}

.checkbox-wrap {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
  color: #334155;
  font-size: 14px;
  flex-wrap: wrap;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-btn {
  min-width: 140px;
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
}

@media (max-width: 1024px) {
  .orders-page {
    padding: 20px;
  }

  .stats-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .checkbox-group {
    justify-content: start;
  }
}

@media (max-width: 768px) {
  .orders-page {
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
  .mobile-actions {
    grid-template-columns: 1fr;
  }

  .mobile-actions .btn {
    height: 40px;
  }
}

@media (max-width: 480px) {
  .orders-page {
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

  .status-badge,
  .payment-badge,
  .order-type-badge {
    min-width: 70px;
    font-size: 11px;
    padding: 6px 10px;
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
</style>