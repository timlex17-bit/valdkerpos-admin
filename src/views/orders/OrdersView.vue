<template>
  <section class="orders-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <div>
          <h1 class="page-title">{{ t('ordersPage.title') }}</h1>
          <p class="page-subtitle">
            {{ t('ordersPage.subtitle') }}
          </p>
        </div>

        <nav class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span class="sep">/</span>
          <span>{{ t('common.pos') }}</span>
          <span class="sep">/</span>
          <span class="current">{{ t('ordersPage.title') }}</span>
        </nav>
      </div>
    </div>

    <!--
      No Add Order here on purpose: orders are created at the POS, where stock,
      pricing and rounding rules are enforced. This page views orders, settles
      open bills and deletes unpaid drafts.
    -->
    <div v-if="notice" class="notice-banner" :class="notice.type" role="status">
      <span>{{ notice.text }}</span>
      <button type="button" class="notice-close" :aria-label="t('common.close')" @click="notice = null">×</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">{{ t('ordersPage.visibleOrders') }}</div>
        <div class="stat-value">{{ filteredOrders.length }}</div>
        <div class="stat-note">{{ t('ordersPage.visibleOrdersNote') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">{{ t('ordersPage.paidOrders') }}</div>
        <div class="stat-value">{{ paidOrdersCount }}</div>
        <div class="stat-note">{{ t('ordersPage.paidOrdersNote') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">{{ t('ordersPage.totalAmount') }}</div>
        <div class="stat-value">${{ filteredTotalAmount }}</div>
        <div class="stat-note">{{ t('ordersPage.totalAmountNote') }}</div>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box toolbar-item toolbar-search">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            :placeholder="t('ordersPage.searchPlaceholder')"
          />
        </div>

        <div class="toolbar-item">
          <select v-model="paymentFilter" class="filter-select">
            <option value="">{{ t('ordersPage.allPaymentMethods') }}</option>
            <option value="CASH">{{ t('ordersPage.paymentCash') }}</option>
            <option value="CARD">{{ t('ordersPage.paymentCard') }}</option>
            <option value="TRANSFER">{{ t('ordersPage.paymentTransfer') }}</option>
            <option value="QRIS">{{ t('ordersPage.paymentQris') }}</option>
            <option value="BANK">{{ t('ordersPage.paymentBank') }}</option>
            <option value="SPLIT">{{ t('ordersPage.paymentSplit') }}</option>
          </select>
        </div>

        <div class="toolbar-item">
          <select v-model="paidFilter" class="filter-select">
            <option value="">{{ t('ordersPage.allStatus') }}</option>
            <option value="paid">{{ t('ordersPage.paid') }}</option>
            <option value="unpaid">{{ t('ordersPage.unpaid') }}</option>
          </select>
        </div>

        <div class="toolbar-item toolbar-reset">
          <button class="btn btn-light" @click="resetFilters">
            {{ t('common.reset') }}
          </button>
        </div>
      </div>
    </div>

    <div class="table-card" @click.capture="handleOrderActionClick">
      <div class="table-header">
        <div>
          <h2>{{ t('ordersPage.orderList') }}</h2>
          <p>{{ t('ordersPage.ordersFound', { count: filteredOrders.length }) }}</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        {{ t('ordersPage.loadingOrders') }}
      </div>

      <div v-else-if="errorMessage" class="error-state">
        {{ errorMessage }}
      </div>

      <div v-else class="table-wrapper desktop-table">
        <table class="order-table">
          <thead>
            <tr>
              <th>{{ t('common.invoice') }}</th>
              <th>{{ t('common.customer') }}</th>
              <th>{{ t('common.payment') }}</th>
              <th>{{ t('common.total') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th>{{ t('common.orderType') }}</th>
              <th class="text-right">{{ t('common.action') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="8" class="empty-cell">
                {{ t('ordersPage.noOrdersFound') }}
              </td>
            </tr>

            <tr v-for="order in filteredOrders" :key="order.id">
              <td>
                <div class="invoice-block">
                  <span class="invoice-code">{{ order.invoice_number }}</span>
                  <span class="invoice-type">{{ displayOrderType(order.default_order_type || '-') }}</span>
                </div>
              </td>

              <td>
                <div class="customer-block">
                  <div class="customer-avatar">
                    {{ getInitials(getCustomerLabel(order.customer)) }}
                  </div>
                  <div>
                    <div class="customer-name">{{ getCustomerLabel(order.customer) }}</div>
                    <div class="customer-sub">{{ t('ordersPage.orderNumber', { id: order.id }) }}</div>
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
                  {{ order.is_paid ? t('ordersPage.paid') : t('ordersPage.unpaid') }}
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
                  {{ displayOrderType(order.default_order_type || '-') }}
                </span>
              </td>

              <td class="text-right">
                <div class="row-actions">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline"
                    data-order-action="view"
                    :data-order-id="String(order.id)"
                  >
                    {{ t('common.view') }}
                  </button>
                  <button
                    v-if="!order.is_paid"
                    type="button"
                    class="btn btn-sm btn-primary"
                    data-order-action="settle"
                    :data-order-id="String(order.id)"
                  >
                    {{ t('ordersPage.settle') }}
                  </button>
                  <button
                    v-if="!order.is_paid"
                    type="button"
                    class="btn btn-sm btn-danger"
                    :disabled="deletingId === order.id"
                    data-order-action="delete"
                    :data-order-id="String(order.id)"
                  >
                    {{ deletingId === order.id ? t('ordersPage.deleting') : t('common.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !errorMessage" class="mobile-list">
        <div v-if="filteredOrders.length === 0" class="mobile-empty">
          {{ t('ordersPage.noOrdersFound') }}
        </div>

        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div class="mobile-card-head-left">
              <div class="invoice-code">{{ order.invoice_number }}</div>
              <div class="customer-sub">{{ t('ordersPage.orderNumber', { id: order.id }) }}</div>
            </div>

            <span :class="['status-badge', order.is_paid ? 'status-paid' : 'status-unpaid']">
              {{ order.is_paid ? t('ordersPage.paid') : t('ordersPage.unpaid') }}
            </span>
          </div>

          <div class="mobile-customer-row">
            <div class="customer-avatar">
              {{ getInitials(getCustomerLabel(order.customer)) }}
            </div>
            <div>
              <div class="customer-name">{{ getCustomerLabel(order.customer) }}</div>
              <div class="customer-sub">{{ order.notes || t('ordersPage.noNotes') }}</div>
            </div>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">{{ t('common.payment') }}</span>
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
              <span class="label">{{ t('common.orderType') }}</span>
              <span class="value">
                <span
                  class="order-type-badge"
                  :class="orderTypeBadgeClass(order.default_order_type)"
                >
                  {{ displayOrderType(order.default_order_type || '-') }}
                </span>
              </span>
            </div>

            <div class="info-item">
              <span class="label">{{ t('common.total') }}</span>
              <span class="value strong">${{ formatMoney(order.total) }}</span>
            </div>

            <div class="info-item">
              <span class="label">{{ t('common.discount') }}</span>
              <span class="value">${{ formatMoney(order.discount) }}</span>
            </div>

            <div class="info-item full">
              <span class="label">{{ t('common.createdAt') }}</span>
              <span class="value">{{ order.created_at ? formatDateTime(order.created_at) : '-' }}</span>
            </div>

            <div class="info-item full">
              <span class="label">{{ t('ordersPage.deliveryTable') }}</span>
              <span class="value">
                {{
                  t('ordersPage.tableAddress', {
                    table: order.table_number || '-',
                    address: order.delivery_address || '-',
                  })
                }}
              </span>
            </div>
          </div>

          <div class="mobile-actions">
            <button
              type="button"
              class="btn btn-sm btn-outline"
              data-order-action="view"
              :data-order-id="String(order.id)"
            >
              {{ t('common.view') }}
            </button>
            <button
              v-if="!order.is_paid"
              type="button"
              class="btn btn-sm btn-primary"
              data-order-action="settle"
              :data-order-id="String(order.id)"
            >
              {{ t('ordersPage.settle') }}
            </button>
            <button
              v-if="!order.is_paid"
              type="button"
              class="btn btn-sm btn-danger"
              :disabled="deletingId === order.id"
              data-order-action="delete"
              :data-order-id="String(order.id)"
            >
              {{ deletingId === order.id ? t('ordersPage.deleting') : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order detail: read-only. Orders cannot be edited after creation. -->
    <transition name="fade">
      <div v-if="viewOrder" class="modal-overlay" @click.self="closeView">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div>
              <h3>{{ t('ordersPage.orderDetailTitle') }} · {{ viewOrder.invoice_number }}</h3>
              <p>{{ t('ordersPage.viewOrderInformation') }}</p>
            </div>
            <button class="modal-close" @click="closeView">×</button>
          </div>

          <div class="modal-body">
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">{{ t('common.status') }}</div>
                <div class="summary-value">
                  <span :class="['status-badge', viewOrder.is_paid ? 'status-paid' : 'status-unpaid']">
                    {{ viewOrder.is_paid ? t('ordersPage.paid') : t('ordersPage.unpaid') }}
                  </span>
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-label">{{ t('common.payment') }}</div>
                <div class="summary-value">{{ displayPaymentMethod(viewOrder.payment_method) }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">{{ t('common.customer') }}</div>
                <div class="summary-value">{{ getCustomerLabel(viewOrder.customer) }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">{{ t('common.createdAt') }}</div>
                <div class="summary-value">{{ viewOrder.created_at ? formatDateTime(viewOrder.created_at) : '-' }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">{{ t('common.orderType') }}</div>
                <div class="summary-value">{{ displayOrderType(viewOrder.default_order_type || '-') }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">{{ t('ordersPage.deliveryTable') }}</div>
                <div class="summary-value">
                  {{ t('ordersPage.tableAddress', { table: viewOrder.table_number || '-', address: viewOrder.delivery_address || '-' }) }}
                </div>
              </div>
              <div v-if="viewOrder.settled_at" class="summary-card">
                <div class="summary-label">{{ t('ordersPage.settledAt') }}</div>
                <div class="summary-value">{{ formatDateTime(viewOrder.settled_at) }}</div>
              </div>
            </div>

            <h4 class="section-title">{{ t('ordersPage.items') }}</h4>
            <div class="table-wrapper">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>{{ t('ordersPage.product') }}</th>
                    <th class="text-right">{{ t('ordersPage.quantity') }}</th>
                    <th class="text-right">{{ t('ordersPage.price') }}</th>
                    <th class="text-right">{{ t('common.subtotal') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="viewOrder.items.length === 0">
                    <td colspan="4" class="empty-cell">-</td>
                  </tr>
                  <tr v-for="(item, index) in viewOrder.items" :key="index">
                    <td>{{ productLabel(item.product) }}</td>
                    <td class="text-right">{{ item.quantity }}</td>
                    <td class="text-right">${{ formatMoney(item.price) }}</td>
                    <td class="text-right">${{ lineTotal(item) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="totals-box">
              <div><span>{{ t('common.subtotal') }}</span><strong>${{ formatMoney(viewOrder.subtotal) }}</strong></div>
              <div><span>{{ t('common.discount') }}</span><strong>${{ formatMoney(viewOrder.discount) }}</strong></div>
              <div><span>{{ t('common.tax') }}</span><strong>${{ formatMoney(viewOrder.tax) }}</strong></div>
              <div><span>{{ t('ordersPage.deliveryFee') }}</span><strong>${{ formatMoney(viewOrder.delivery_fee) }}</strong></div>
              <div class="grand"><span>{{ t('common.total') }}</span><strong>${{ formatMoney(viewOrder.total) }}</strong></div>
            </div>

            <h4 class="section-title">{{ t('ordersPage.payments') }}</h4>
            <div class="table-wrapper">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>{{ t('ordersPage.paymentMethod') }}</th>
                    <th>{{ t('ordersPage.bankAccount') }}</th>
                    <th>{{ t('ordersPage.referenceNumber') }}</th>
                    <th class="text-right">{{ t('ordersPage.amount') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="viewOrder.payment_records.length === 0">
                    <td colspan="4" class="empty-cell">{{ t('ordersPage.noPaymentRecords') }}</td>
                  </tr>
                  <tr v-for="record in viewOrder.payment_records" :key="record.id">
                    <td>{{ record.payment_method_name || record.payment_method || '-' }}</td>
                    <td>{{ record.bank_account_name || '-' }}</td>
                    <td>{{ record.reference_number || '-' }}</td>
                    <td class="text-right">${{ formatMoney(record.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p v-if="viewOrder.notes" class="notes-text">{{ viewOrder.notes }}</p>

            <div class="modal-footer">
              <button
                v-if="!viewOrder.is_paid"
                type="button"
                class="btn btn-primary modal-btn"
                @click="openSettleFromView"
              >
                {{ t('ordersPage.settle') }}
              </button>
              <button type="button" class="btn btn-light modal-btn" @click="closeView">
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Settle an open bill: POST /api/orders/{id}/settle/ -->
    <transition name="fade">
      <div v-if="settleOrder" class="modal-overlay" @click.self="closeSettle">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div>
              <h3>{{ t('ordersPage.settleTitle', { invoice: settleOrder.invoice_number }) }}</h3>
              <p>{{ t('ordersPage.settleSubtitle') }}</p>
            </div>
            <button class="modal-close" :disabled="settling" @click="closeSettle">×</button>
          </div>

          <div class="modal-body">
            <div class="settle-total">
              <span>{{ t('ordersPage.orderTotal') }}</span>
              <strong>${{ formatMoney(settleOrder.total) }}</strong>
            </div>

            <div v-if="loadingPaymentOptions" class="loading-state">{{ t('ordersPage.loadingPaymentOptions') }}</div>
            <div v-else-if="paymentOptionsError" class="form-error">{{ paymentOptionsError }}</div>
            <div v-else-if="paymentMethods.length === 0" class="form-error">{{ t('ordersPage.noActivePaymentMethods') }}</div>

            <template v-else>
              <div
                v-for="(row, index) in settleRows"
                :key="index"
                class="payment-row"
                :class="{ 'has-issue': rowMessages(index).length }"
                data-testid="settle-payment-row"
              >
                <div class="payment-row-grid">
                  <div class="form-group">
                    <label>{{ t('ordersPage.paymentMethod') }} <span>*</span></label>
                    <select
                      v-model.number="row.paymentMethodId"
                      :disabled="settling"
                      @change="onMethodChange(row)"
                    >
                      <option :value="null">{{ t('ordersPage.selectPaymentMethod') }}</option>
                      <option v-for="method in paymentMethods" :key="method.id" :value="method.id">
                        {{ method.name }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>
                      {{ t('ordersPage.bankAccount') }}
                      <span v-if="methodFor(row)?.requires_bank_account">*</span>
                    </label>
                    <select
                      v-model.number="row.bankAccountId"
                      :disabled="settling || methodIsCash(methodFor(row)) || !row.paymentMethodId"
                    >
                      <option :value="null">
                        {{ methodIsCash(methodFor(row)) ? t('ordersPage.noBankForCash') : t('ordersPage.selectBankAccount') }}
                      </option>
                      <option v-for="account in bankAccounts" :key="account.id" :value="account.id">
                        {{ account.name }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>{{ t('ordersPage.amount') }} <span>*</span></label>
                    <input v-model="row.amount" type="text" inputmode="decimal" placeholder="0.00" :disabled="settling" />
                  </div>

                  <div class="form-group">
                    <label>{{ t('ordersPage.referenceNumber') }}</label>
                    <input v-model="row.referenceNumber" type="text" :disabled="settling" />
                  </div>
                </div>

                <div class="payment-row-footer">
                  <ul v-if="rowMessages(index).length" class="row-issues">
                    <li v-for="message in rowMessages(index)" :key="message">{{ message }}</li>
                  </ul>
                  <div class="row-buttons">
                    <button
                      v-if="settleCheck.remainingCents > 0"
                      type="button"
                      class="btn btn-sm btn-outline"
                      :disabled="settling"
                      @click="fillRemaining(row)"
                    >
                      {{ t('ordersPage.fillRemaining') }}
                    </button>
                    <button
                      v-if="settleRows.length > 1"
                      type="button"
                      class="btn btn-sm btn-light"
                      :disabled="settling"
                      @click="removePaymentRow(index)"
                    >
                      {{ t('ordersPage.removePayment') }}
                    </button>
                  </div>
                </div>
              </div>

              <button type="button" class="btn btn-light add-payment-btn" :disabled="settling" @click="addPaymentRow">
                ＋ {{ t('ordersPage.addPayment') }}
              </button>

              <div
                class="remaining-box"
                :class="settleCheck.remainingCents === 0 ? 'ok' : 'off'"
                data-testid="settle-remaining"
              >
                <span>{{ t('ordersPage.paidSoFar') }}: <strong>${{ formatCents(settleCheck.paidCents) }}</strong></span>
                <span v-if="settleCheck.remainingCents > 0">
                  {{ t('ordersPage.remaining') }}: <strong>${{ formatCents(settleCheck.remainingCents) }}</strong>
                </span>
                <span v-else-if="settleCheck.remainingCents < 0">
                  {{ t('ordersPage.overpaid') }}: <strong>${{ formatCents(-settleCheck.remainingCents) }}</strong>
                </span>
                <span v-else>{{ t('ordersPage.fullyCovered') }}</span>
              </div>
            </template>

            <div v-if="settleGeneralErrors.length" class="form-error" role="alert">
              <div v-for="message in settleGeneralErrors" :key="message">{{ message }}</div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-light modal-btn" :disabled="settling" @click="closeSettle">
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                class="btn btn-primary modal-btn"
                :disabled="!settleCheck.canSubmit || settling"
                @click="submitSettle"
              >
                {{ settling ? t('ordersPage.settling') : t('ordersPage.settleNow', { amount: formatMoney(settleOrder.total) }) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { getApiErrorMessage } from '@/utils/apiError'
import {
  buildSettlePayload,
  checkSettle,
  formatCents,
  methodIsCash,
  newClientSettleId,
  parseSettleErrors,
  toCents,
  type BankAccountOption,
  type PaymentMethodOption,
  type SettleRow,
  type SettleRowIssue,
} from '@/services/orderSettle'

type OrderType = 'GENERAL' | 'DINE_IN' | 'TAKE_OUT' | 'DELIVERY'

type OrderItem = {
  product: number | null
  quantity: number | string
  price: string
  order_type?: string
}

type PaymentRecord = {
  id: number
  payment_method?: number | string
  payment_method_name?: string
  bank_account_name?: string
  amount: string
  reference_number?: string
}

type Order = {
  id: number | string
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
  items: OrderItem[]
  payment_records: PaymentRecord[]
  settled_at: string | null
}

const { t, locale } = useI18n()

const search = ref('')
const paymentFilter = ref('')
const paidFilter = ref('')
const loading = ref(false)
const deletingId = ref<number | string | null>(null)
const errorMessage = ref('')
const notice = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const orders = ref<Order[]>([])
const productNames = ref<Record<number, string>>({})

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
        String(order.default_order_type || '').toLowerCase().includes(q) ||
        displayPaymentMethod(order.payment_method).toLowerCase().includes(q) ||
        displayOrderType(order.default_order_type).toLowerCase().includes(q)
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
  const cents = filteredOrders.value.reduce((sum, order) => sum + (toCents(order.total) ?? 0), 0)
  return formatCents(cents)
})

function resetFilters() {
  search.value = ''
  paymentFilter.value = ''
  paidFilter.value = ''
}

function currentDateLocale() {
  const current = String(locale.value || 'en').toLowerCase()

  if (current === 'id') return 'id-ID'
  if (current === 'tet') return 'pt-PT'
  return 'en-US'
}

function formatMoney(value: unknown) {
  const cents = toCents(value)
  return cents === null ? Number(value || 0).toFixed(2) : formatCents(cents)
}

function formatDateTime(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat(currentDateLocale(), {
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
  return customer ? t('ordersPage.customerLabel', { id: customer }) : t('ordersPage.walkIn')
}

function normalizeDecimalInput(value: unknown, fallback = '0.00') {
  const text = String(value ?? '').trim()
  return text === '' ? fallback : text
}

function normalizeOrder(order: any): Order {
  const rawId = order?.id ?? order?.uuid ?? order?.pk ?? ''
  const numericId = Number(rawId)
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
    id: rawId === '' ? 0 : Number.isFinite(numericId) ? numericId : String(rawId),
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
    payment_records: Array.isArray(order?.payment_records) ? order.payment_records : [],
    settled_at: order?.settled_at || null,
  }
}

function displayPaymentMethod(value: unknown) {
  const raw = String(value || '-').toUpperCase()

  if (raw === 'CASH') return t('ordersPage.paymentCash')
  if (raw === 'CARD') return t('ordersPage.paymentCard')
  if (raw === 'TRANSFER') return t('ordersPage.paymentTransfer')
  if (raw === 'QRIS') return t('ordersPage.paymentQris')
  if (raw === 'BANK') return t('ordersPage.paymentBank')
  if (raw === 'SPLIT') return t('ordersPage.paymentSplit')
  if (raw === 'UNPAID') return t('ordersPage.unpaid')
  return raw || '-'
}

function displayOrderType(value: unknown) {
  const raw = String(value || '').toUpperCase()

  if (raw === 'GENERAL') return t('ordersPage.general')
  if (raw === 'DINE_IN') return t('ordersPage.dineIn')
  if (raw === 'TAKE_OUT') return t('ordersPage.takeOut')
  if (raw === 'DELIVERY') return t('ordersPage.delivery')
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

function rowsOf(data: any): any[] {
  return Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
}

async function fetchOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(ENDPOINTS.ORDERS)
    orders.value = rowsOf(response.data).map(normalizeOrder)
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, t('ordersPage.failedLoad'))
  } finally {
    loading.value = false
  }
}

function findOrderById(id: string) {
  return orders.value.find((order) => String(order.id) === id) ?? null
}

function handleOrderActionClick(event: MouseEvent) {
  const actionButton = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
    '[data-order-action]'
  )

  if (!actionButton) return

  const action = actionButton.dataset.orderAction
  const orderId = actionButton.dataset.orderId
  const order = orderId ? findOrderById(orderId) : null

  if (!action || !order || actionButton.disabled) return

  event.preventDefault()
  event.stopPropagation()

  if (action === 'view') openView(order)
  else if (action === 'settle') openSettle(order)
  else if (action === 'delete') removeOrder(order)
}

// ---------------------------------------------------------------- detail

const viewOrder = ref<Order | null>(null)

async function loadProductNames() {
  if (Object.keys(productNames.value).length) return
  try {
    const response = await api.get(ENDPOINTS.PRODUCTS)
    productNames.value = Object.fromEntries(
      rowsOf(response.data).map((product) => [Number(product.id), String(product.name ?? '')])
    )
  } catch {
    // Names are a convenience; the product id is still shown.
  }
}

function productLabel(productId: number | null) {
  if (productId === null || productId === undefined) return '-'
  const name = productNames.value[Number(productId)]
  return name ? `${name} (#${productId})` : `#${productId}`
}

function lineTotal(item: OrderItem) {
  const price = toCents(item.price) ?? 0
  const quantity = Number(item.quantity) || 0
  return formatCents(Math.round(price * quantity))
}

function openView(order: Order) {
  viewOrder.value = order
  loadProductNames()
}

function closeView() {
  viewOrder.value = null
}

function openSettleFromView() {
  const order = viewOrder.value
  closeView()
  if (order) openSettle(order)
}

// ---------------------------------------------------------------- settle

const settleOrder = ref<Order | null>(null)
const settleRows = ref<SettleRow[]>([])
const settling = ref(false)
const settleGeneralErrors = ref<string[]>([])
const settleServerRowErrors = ref<string[][]>([])
const paymentMethods = ref<PaymentMethodOption[]>([])
const bankAccounts = ref<BankAccountOption[]>([])
const loadingPaymentOptions = ref(false)
const paymentOptionsError = ref('')
// One key per settle dialog, reused if the same attempt is retried, so a
// response lost on the way back replays instead of charging twice.
let clientSettleId = ''

const settleCheck = computed(() =>
  checkSettle(settleRows.value, paymentMethods.value, settleOrder.value?.total ?? '0')
)

function emptyRow(amount = ''): SettleRow {
  return { paymentMethodId: null, bankAccountId: null, amount, referenceNumber: '' }
}

async function loadPaymentOptions() {
  loadingPaymentOptions.value = true
  paymentOptionsError.value = ''
  try {
    const [methodsResponse, accountsResponse] = await Promise.all([
      api.get('/api/payment-methods/'),
      api.get(ENDPOINTS.BANK_ACCOUNTS),
    ])
    paymentMethods.value = rowsOf(methodsResponse.data)
      .filter((method) => method.is_active !== false)
      .map((method) => ({
        id: Number(method.id),
        name: String(method.name ?? method.code ?? `#${method.id}`),
        payment_type: String(method.payment_type ?? ''),
        requires_bank_account: !!method.requires_bank_account,
      }))
    bankAccounts.value = rowsOf(accountsResponse.data)
      .filter((account) => account.is_active !== false)
      .map((account) => ({
        id: Number(account.id),
        name: [account.name, account.bank_name].filter(Boolean).join(' · ') || `#${account.id}`,
      }))
  } catch (error: unknown) {
    paymentOptionsError.value = getApiErrorMessage(error, t('ordersPage.failedLoadPaymentOptions'))
  } finally {
    loadingPaymentOptions.value = false
  }
}

function openSettle(order: Order) {
  if (order.is_paid) return
  settleOrder.value = order
  settleRows.value = [emptyRow(formatMoney(order.total))]
  settleGeneralErrors.value = []
  settleServerRowErrors.value = []
  clientSettleId = newClientSettleId()
  loadPaymentOptions()
}

function closeSettle() {
  if (settling.value) return
  settleOrder.value = null
  settleRows.value = []
}

function methodFor(row: SettleRow) {
  return paymentMethods.value.find((method) => method.id === row.paymentMethodId)
}

function onMethodChange(row: SettleRow) {
  const method = methodFor(row)
  if (methodIsCash(method)) row.bankAccountId = null
  if (method?.requires_bank_account && !row.bankAccountId && bankAccounts.value.length === 1) {
    row.bankAccountId = bankAccounts.value[0].id
  }
}

function addPaymentRow() {
  const remaining = settleCheck.value.remainingCents
  settleRows.value.push(emptyRow(remaining > 0 ? formatCents(remaining) : ''))
}

function removePaymentRow(index: number) {
  settleRows.value.splice(index, 1)
  settleServerRowErrors.value.splice(index, 1)
}

function fillRemaining(row: SettleRow) {
  const current = toCents(row.amount) ?? 0
  row.amount = formatCents(current + settleCheck.value.remainingCents)
}

const ISSUE_KEYS: Record<SettleRowIssue, string> = {
  method_required: 'ordersPage.issueMethodRequired',
  amount_invalid: 'ordersPage.issueAmountInvalid',
  bank_required: 'ordersPage.issueBankRequired',
  bank_not_allowed: 'ordersPage.issueBankNotAllowed',
}

function rowMessages(index: number) {
  const row = settleRows.value[index]
  const local = (settleCheck.value.rowIssues[index] || [])
    // An untouched amount or method is not an error yet, just incomplete.
    .filter((issue) => !(issue === 'method_required' && row.paymentMethodId === null))
    .filter((issue) => !(issue === 'amount_invalid' && row.amount.trim() === ''))
    .map((issue) => t(ISSUE_KEYS[issue]))
  return [...local, ...(settleServerRowErrors.value[index] || [])]
}

async function submitSettle() {
  const order = settleOrder.value
  if (!order || !settleCheck.value.canSubmit) return

  settling.value = true
  settleGeneralErrors.value = []
  settleServerRowErrors.value = []

  try {
    const response = await api.post(
      `${ENDPOINTS.ORDERS}${order.id}/settle/`,
      buildSettlePayload(settleRows.value, clientSettleId)
    )
    const settled = normalizeOrder(response.data)
    orders.value = orders.value.map((item) => (String(item.id) === String(settled.id) ? settled : item))
    settling.value = false
    closeSettle()
    notice.value = {
      type: 'success',
      text: t('ordersPage.settleSuccess', { invoice: settled.invoice_number, amount: formatMoney(settled.total) }),
    }
  } catch (error: any) {
    const status = error?.response?.status
    const parsed = parseSettleErrors(error?.response?.data, settleRows.value.length)
    settleServerRowErrors.value = parsed.rows
    settleGeneralErrors.value = parsed.general.length
      ? parsed.general
      : parsed.rows.some((messages) => messages.length)
        ? []
        : [getApiErrorMessage(error, t('ordersPage.failedSettle'))]
    if (status === 409) {
      // Already paid, by this attempt or someone else: show the current state.
      await fetchOrders()
    }
  } finally {
    settling.value = false
  }
}

// ---------------------------------------------------------------- delete

async function removeOrder(order: Order) {
  if (order.is_paid) return
  const ok = window.confirm(t('ordersPage.deleteConfirm'))
  if (!ok) return

  deletingId.value = order.id

  try {
    await api.delete(`${ENDPOINTS.ORDERS}${order.id}/`)
    orders.value = orders.value.filter((o) => o.id !== order.id)
    notice.value = { type: 'success', text: t('ordersPage.deleted', { invoice: order.invoice_number }) }
  } catch (error: unknown) {
    notice.value = { type: 'error', text: getApiErrorMessage(error, t('ordersPage.failedDelete')) }
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
  position: relative;
  z-index: 1;
}

.row-actions .btn,
.mobile-actions .btn {
  pointer-events: auto;
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

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notice-banner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.notice-banner.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.notice-banner.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.notice-close {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.section-title {
  margin: 22px 0 10px;
  font-size: 15px;
  color: #0f172a;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.detail-table th,
.detail-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
}

.detail-table th {
  color: #64748b;
  font-weight: 700;
}

.detail-table .text-right {
  text-align: right;
}

.totals-box {
  margin: 12px 0 0 auto;
  max-width: 320px;
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.totals-box > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.totals-box .grand {
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-size: 16px;
}

.notes-text {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
  white-space: pre-wrap;
}

.settle-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #eff6ff;
  color: #1e3a8a;
}

.settle-total strong {
  font-size: 22px;
}

.payment-row {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.payment-row.has-issue {
  border-color: #fca5a5;
}

.payment-row-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.payment-row-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.row-issues {
  margin: 0;
  padding-left: 18px;
  color: #b91c1c;
  font-size: 13px;
  line-height: 1.5;
}

.row-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.add-payment-btn {
  width: 100%;
}

.remaining-box {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
}

.remaining-box.ok {
  background: #f0fdf4;
  color: #166534;
}

.remaining-box.off {
  background: #fff7ed;
  color: #9a3412;
}

@media (max-width: 640px) {
  .payment-row-grid {
    grid-template-columns: 1fr;
  }
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
