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

      <button class="btn btn-primary" @click="openCreateModal">
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
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by invoice, customer, served by, notes..."
          />
        </div>

        <select v-model="paymentFilter" class="filter-select">
          <option value="">All payment methods</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="TRANSFER">Transfer</option>
          <option value="QRIS">QRIS</option>
        </select>

        <select v-model="paidFilter" class="filter-select">
          <option value="">All status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <button class="btn btn-light" @click="resetFilters">
          Reset
        </button>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <div>
          <h2>Order List</h2>
          <p>{{ filteredOrders.length }} order(s) found</p>
        </div>
      </div>

      <div class="table-wrapper desktop-table">
        <table class="order-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Served By</th>
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
                  <span class="invoice-type">{{ order.default_order_type }}</span>
                </div>
              </td>
              <td>
                <div class="customer-block">
                  <div class="customer-avatar">
                    {{ getInitials(order.customer_name || 'Walk In') }}
                  </div>
                  <div>
                    <div class="customer-name">{{ order.customer_name || 'Walk In' }}</div>
                    <div class="customer-sub">{{ order.payment_method }}</div>
                  </div>
                </div>
              </td>
              <td>{{ order.payment_method }}</td>
              <td class="amount-cell">${{ formatMoney(order.total) }}</td>
              <td>
                <span :class="['status-badge', order.is_paid ? 'status-paid' : 'status-unpaid']">
                  {{ order.is_paid ? 'Paid' : 'Unpaid' }}
                </span>
              </td>
              <td>{{ order.created_at }}</td>
              <td>{{ order.served_by || '-' }}</td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(order)">
                    View
                  </button>
                  <button class="btn btn-sm btn-warning" @click="openEditModal(order)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="removeOrder(order.id)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-list">
        <div v-if="filteredOrders.length === 0" class="mobile-empty">
          No orders found.
        </div>

        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div>
              <div class="invoice-code">{{ order.invoice_number }}</div>
              <div class="customer-sub">{{ order.default_order_type }}</div>
            </div>

            <span :class="['status-badge', order.is_paid ? 'status-paid' : 'status-unpaid']">
              {{ order.is_paid ? 'Paid' : 'Unpaid' }}
            </span>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">Customer</span>
              <span>{{ order.customer_name || 'Walk In' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Payment</span>
              <span>{{ order.payment_method }}</span>
            </div>
            <div class="info-item">
              <span class="label">Total</span>
              <span>${{ formatMoney(order.total) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Served By</span>
              <span>{{ order.served_by || '-' }}</span>
            </div>
            <div class="info-item full">
              <span class="label">Created At</span>
              <span>{{ order.created_at }}</span>
            </div>
            <div class="info-item full">
              <span class="label">Notes</span>
              <span>{{ order.notes || '-' }}</span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(order)">
              View
            </button>
            <button class="btn btn-sm btn-warning" @click="openEditModal(order)">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" @click="removeOrder(order.id)">
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
                  <label>Invoice Number <span>*</span></label>
                  <input
                    v-model="form.invoice_number"
                    type="text"
                    placeholder="Enter invoice number"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Customer</label>
                  <input
                    v-model="form.customer_name"
                    type="text"
                    placeholder="Walk In / Customer name"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Payment Method <span>*</span></label>
                  <select v-model="form.payment_method" :disabled="modalMode === 'view'">
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Order Type <span>*</span></label>
                  <select v-model="form.default_order_type" :disabled="modalMode === 'view'">
                    <option value="General">General</option>
                    <option value="Dine In">Dine In</option>
                    <option value="Take Away">Take Away</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Subtotal <span>*</span></label>
                  <input
                    v-model.number="form.subtotal"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateTotal"
                  />
                </div>

                <div class="form-group">
                  <label>Discount</label>
                  <input
                    v-model.number="form.discount"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateTotal"
                  />
                </div>

                <div class="form-group">
                  <label>Tax</label>
                  <input
                    v-model.number="form.tax"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateTotal"
                  />
                </div>

                <div class="form-group">
                  <label>Delivery Fee</label>
                  <input
                    v-model.number="form.delivery_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                    @input="recalculateTotal"
                  />
                </div>

                <div class="form-group">
                  <label>Total <span>*</span></label>
                  <input
                    :value="formatMoney(form.total)"
                    type="text"
                    disabled
                  />
                </div>

                <div class="form-group">
                  <label>Served By</label>
                  <input
                    v-model="form.served_by"
                    type="text"
                    placeholder="Cashier / Staff"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Created At</label>
                  <input
                    v-model="form.created_at"
                    type="text"
                    placeholder="March 21, 2026, 4:49 p.m."
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group checkbox-group">
                  <label>Is Paid</label>
                  <div class="checkbox-wrap">
                    <input
                      v-model="form.is_paid"
                      type="checkbox"
                      :disabled="modalMode === 'view'"
                    />
                    <span>Mark this order as paid</span>
                  </div>
                </div>

                <div class="form-group full">
                  <label>Notes</label>
                  <textarea
                    v-model="form.notes"
                    rows="5"
                    placeholder="Enter order notes"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group full">
                  <label>Delivery Address</label>
                  <textarea
                    v-model="form.delivery_address"
                    rows="4"
                    placeholder="Enter delivery address"
                    :disabled="modalMode === 'view'"
                  />
                </div>
              </div>

              <div v-if="modalMode !== 'view'" class="modal-footer">
                <button type="button" class="btn btn-light" @click="closeModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  {{ modalMode === 'create' ? 'Save Order' : 'Update Order' }}
                </button>
              </div>

              <div v-else class="modal-footer">
                <button type="button" class="btn btn-primary" @click="closeModal">
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
import { computed, reactive, ref } from 'vue'

type Order = {
  id: number
  invoice_number: string
  customer_name: string
  payment_method: 'CASH' | 'CARD' | 'TRANSFER' | 'QRIS'
  subtotal: number
  discount: number
  tax: number
  delivery_fee: number
  total: number
  notes: string
  is_paid: boolean
  default_order_type: 'General' | 'Dine In' | 'Take Away' | 'Workshop'
  delivery_address: string
  served_by: string
  created_at: string
}

type ModalMode = 'create' | 'edit' | 'view'

const search = ref('')
const paymentFilter = ref('')
const paidFilter = ref('')
const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)

const orders = ref<Order[]>([
  {
    id: 1,
    invoice_number: 'INV000000000030',
    customer_name: 'Doviana',
    payment_method: 'CASH',
    subtotal: 34.5,
    discount: 0,
    tax: 0,
    delivery_fee: 0,
    total: 34.5,
    notes: 'Workshop order | Customer: Doviana | Vehicle: Honda Scoopy | Plate: K 2353',
    is_paid: true,
    default_order_type: 'Workshop',
    delivery_address: '',
    served_by: 'Jefri',
    created_at: 'March 21, 2026, 4:49 p.m.',
  },
  {
    id: 2,
    invoice_number: 'INV000000000029',
    customer_name: 'Walk In',
    payment_method: 'CASH',
    subtotal: 3.5,
    discount: 0,
    tax: 0,
    delivery_fee: 0,
    total: 3.5,
    notes: 'Quick order from counter',
    is_paid: true,
    default_order_type: 'General',
    delivery_address: '',
    served_by: 'Julio',
    created_at: 'March 21, 2026, 3:33 p.m.',
  },
  {
    id: 3,
    invoice_number: 'INV000000000028',
    customer_name: 'Alexander Guterres',
    payment_method: 'TRANSFER',
    subtotal: 17.25,
    discount: 1.25,
    tax: 0,
    delivery_fee: 0,
    total: 16,
    notes: 'Transfer payment pending confirmation',
    is_paid: false,
    default_order_type: 'Take Away',
    delivery_address: '',
    served_by: 'Julio',
    created_at: 'March 21, 2026, 1:48 p.m.',
  },
  {
    id: 4,
    invoice_number: 'INV000000000027',
    customer_name: 'Doviana',
    payment_method: 'CARD',
    subtotal: 11.5,
    discount: 0,
    tax: 0,
    delivery_fee: 0,
    total: 11.5,
    notes: 'Repeat customer',
    is_paid: true,
    default_order_type: 'General',
    delivery_address: '',
    served_by: 'Jefri',
    created_at: 'March 21, 2026, 1:29 p.m.',
  },
])

const form = reactive<Order>({
  id: 0,
  invoice_number: '',
  customer_name: '',
  payment_method: 'CASH',
  subtotal: 0,
  discount: 0,
  tax: 0,
  delivery_fee: 0,
  total: 0,
  notes: '',
  is_paid: true,
  default_order_type: 'General',
  delivery_address: '',
  served_by: '',
  created_at: '',
})

const filteredOrders = computed(() => {
  let result = [...orders.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((order) => {
      return (
        order.invoice_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.payment_method.toLowerCase().includes(q) ||
        order.served_by.toLowerCase().includes(q) ||
        order.notes.toLowerCase().includes(q)
      )
    })
  }

  if (paymentFilter.value) {
    result = result.filter((order) => order.payment_method === paymentFilter.value)
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
  form.id = 0
  form.invoice_number = ''
  form.customer_name = ''
  form.payment_method = 'CASH'
  form.subtotal = 0
  form.discount = 0
  form.tax = 0
  form.delivery_fee = 0
  form.total = 0
  form.notes = ''
  form.is_paid = true
  form.default_order_type = 'General'
  form.delivery_address = ''
  form.served_by = ''
  form.created_at = ''
}

function fillForm(order: Order) {
  form.id = order.id
  form.invoice_number = order.invoice_number
  form.customer_name = order.customer_name
  form.payment_method = order.payment_method
  form.subtotal = order.subtotal
  form.discount = order.discount
  form.tax = order.tax
  form.delivery_fee = order.delivery_fee
  form.total = order.total
  form.notes = order.notes
  form.is_paid = order.is_paid
  form.default_order_type = order.default_order_type
  form.delivery_address = order.delivery_address
  form.served_by = order.served_by
  form.created_at = order.created_at
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  resetForm()
  form.invoice_number = generateInvoiceNumber()
  form.created_at = formatCurrentDateTime()
  showModal.value = true
}

function openEditModal(order: Order) {
  modalMode.value = 'edit'
  editingId.value = order.id
  fillForm(order)
  showModal.value = true
}

function openViewModal(order: Order) {
  modalMode.value = 'view'
  editingId.value = order.id
  fillForm(order)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  resetForm()
}

function saveOrder() {
  if (!form.invoice_number.trim()) {
    alert('Invoice number is required.')
    return
  }

  if (!form.payment_method.trim()) {
    alert('Payment method is required.')
    return
  }

  recalculateTotal()

  if (modalMode.value === 'create') {
    const nextId =
      orders.value.length > 0
        ? Math.max(...orders.value.map((o) => o.id)) + 1
        : 1

    orders.value.unshift({
      id: nextId,
      invoice_number: form.invoice_number.trim(),
      customer_name: form.customer_name.trim() || 'Walk In',
      payment_method: form.payment_method,
      subtotal: Number(form.subtotal) || 0,
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      delivery_fee: Number(form.delivery_fee) || 0,
      total: Number(form.total) || 0,
      notes: form.notes.trim(),
      is_paid: form.is_paid,
      default_order_type: form.default_order_type,
      delivery_address: form.delivery_address.trim(),
      served_by: form.served_by.trim(),
      created_at: form.created_at.trim() || formatCurrentDateTime(),
    })
  } else if (modalMode.value === 'edit' && editingId.value !== null) {
    const index = orders.value.findIndex((o) => o.id === editingId.value)
    if (index !== -1) {
      orders.value[index] = {
        id: editingId.value,
        invoice_number: form.invoice_number.trim(),
        customer_name: form.customer_name.trim() || 'Walk In',
        payment_method: form.payment_method,
        subtotal: Number(form.subtotal) || 0,
        discount: Number(form.discount) || 0,
        tax: Number(form.tax) || 0,
        delivery_fee: Number(form.delivery_fee) || 0,
        total: Number(form.total) || 0,
        notes: form.notes.trim(),
        is_paid: form.is_paid,
        default_order_type: form.default_order_type,
        delivery_address: form.delivery_address.trim(),
        served_by: form.served_by.trim(),
        created_at: form.created_at.trim(),
      }
    }
  }

  closeModal()
}

function removeOrder(id: number) {
  const ok = window.confirm('Delete this order?')
  if (!ok) return
  orders.value = orders.value.filter((o) => o.id !== id)
}

function resetFilters() {
  search.value = ''
  paymentFilter.value = ''
  paidFilter.value = ''
}

function recalculateTotal() {
  const subtotal = Number(form.subtotal) || 0
  const discount = Number(form.discount) || 0
  const tax = Number(form.tax) || 0
  const deliveryFee = Number(form.delivery_fee) || 0
  form.total = Math.max(subtotal - discount + tax + deliveryFee, 0)
}

function formatMoney(value: number) {
  return Number(value || 0).toFixed(2)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function generateInvoiceNumber() {
  const maxId = orders.value.length > 0 ? Math.max(...orders.value.map((o) => o.id)) : 0
  const next = maxId + 1
  return `INV${String(next).padStart(12, '0')}`
}

function formatCurrentDateTime() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
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
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #162033;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
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
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #172033;
}

.stat-note {
  margin-top: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.toolbar-card {
  padding: 18px;
  margin-bottom: 20px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1.6fr) repeat(2, minmax(180px, 1fr)) auto;
  gap: 12px;
  align-items: center;
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
  min-width: 1080px;
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
}

.invoice-type {
  font-size: 12px;
  color: #94a3b8;
}

.customer-block {
  display: flex;
  align-items: center;
  gap: 12px;
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
}

.customer-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8798;
}

.amount-cell {
  font-weight: 800;
  color: #162033;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-paid {
  background: #ecfdf3;
  color: #16a34a;
}

.status-unpaid {
  background: #fff7ed;
  color: #c2410c;
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
}

.mobile-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #334155;
}

.info-item .label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-item.full {
  grid-column: 1 / -1;
}

.mobile-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
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
}

.modal-body {
  padding: 24px;
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
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
  color: #334155;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
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
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 1024px) {
  .stats-grid {
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

  .page-title {
    font-size: 26px;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }

  .modal-card,
  .modal-lg {
    max-width: 100%;
    border-radius: 20px;
  }

  .modal-body,
  .modal-header {
    padding: 18px;
  }

  .btn-primary,
  .btn-light {
    width: 100%;
  }

  .page-header {
    align-items: stretch;
  }

  .page-header > .btn {
    width: 100%;
  }

  .toolbar-grid {
    grid-template-columns: 1fr;
  }

  .mobile-actions .btn {
    flex: 1 1 calc(33.333% - 8px);
  }

  .mobile-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>