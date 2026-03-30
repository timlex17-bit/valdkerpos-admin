<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

type AccountType = 'BANK' | 'EWALLET' | 'QRIS'

type BankAccount = {
  id: number
  shop_id: number
  shop_name: string
  shop_code: string
  name: string
  bank_name: string
  account_number: string
  account_holder: string
  account_type: AccountType
  opening_balance: string
  current_balance: string
  is_active: boolean
  note: string
  created_at: string
}

type FormState = {
  name: string
  bank_name: string
  account_number: string
  account_holder: string
  account_type: AccountType
  opening_balance: string
  is_active: boolean
  note: string
}

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

const bankAccounts = ref<BankAccount[]>([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

const search = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const form = reactive<FormState>({
  name: '',
  bank_name: '',
  account_number: '',
  account_holder: '',
  account_type: 'BANK',
  opening_balance: '',
  is_active: true,
  note: '',
})

const ACCOUNT_TYPE_OPTIONS: AccountType[] = ['BANK', 'EWALLET', 'QRIS']

const filteredAccounts = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return bankAccounts.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.name?.toLowerCase().includes(keyword) ||
      item.bank_name?.toLowerCase().includes(keyword) ||
      item.account_number?.toLowerCase().includes(keyword) ||
      item.account_holder?.toLowerCase().includes(keyword) ||
      item.shop_name?.toLowerCase().includes(keyword)

    const matchesType = !typeFilter.value || item.account_type === typeFilter.value

    const matchesStatus =
      !statusFilter.value ||
      (statusFilter.value === 'active' && item.is_active) ||
      (statusFilter.value === 'inactive' && !item.is_active)

    return matchesKeyword && matchesType && matchesStatus
  })
})

const totalAccounts = computed(() => bankAccounts.value.length)

const activeAccounts = computed(() =>
  bankAccounts.value.filter((item) => item.is_active).length
)

const totalCurrentBalance = computed(() =>
  bankAccounts.value.reduce((sum, item) => sum + toNumber(item.current_balance), 0)
)

const totalOpeningBalance = computed(() =>
  bankAccounts.value.reduce((sum, item) => sum + toNumber(item.opening_balance), 0)
)

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(toNumber(value))
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getAccountTypeLabel(type: AccountType | string) {
  if (type === 'BANK') return 'Bank'
  if (type === 'EWALLET') return 'E-Wallet'
  if (type === 'QRIS') return 'QRIS'
  return type || '-'
}

function resetForm() {
  form.name = ''
  form.bank_name = ''
  form.account_number = ''
  form.account_holder = ''
  form.account_type = 'BANK'
  form.opening_balance = ''
  form.is_active = true
  form.note = ''
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  errorMessage.value = ''
  successMessage.value = ''
  showModal.value = true
}

function openEditModal(item: BankAccount) {
  form.name = item.name || ''
  form.bank_name = item.bank_name || ''
  form.account_number = item.account_number || ''
  form.account_holder = item.account_holder || ''
  form.account_type = (item.account_type || 'BANK') as AccountType
  form.opening_balance = item.opening_balance || ''
  form.is_active = Boolean(item.is_active)
  form.note = item.note || ''

  isEditMode.value = true
  editingId.value = item.id
  errorMessage.value = ''
  successMessage.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function validateForm() {
  if (!form.name.trim()) {
    errorMessage.value = 'Account name is required.'
    return false
  }

  if (!form.bank_name.trim()) {
    errorMessage.value = 'Bank name is required.'
    return false
  }

  if (!form.account_type) {
    errorMessage.value = 'Account type is required.'
    return false
  }

  if (form.opening_balance && Number.isNaN(Number(form.opening_balance))) {
    errorMessage.value = 'Opening balance must be a valid number.'
    return false
  }

  return true
}

function getPayload() {
  return {
    name: form.name.trim(),
    bank_name: form.bank_name.trim(),
    account_number: form.account_number.trim(),
    account_holder: form.account_holder.trim(),
    account_type: form.account_type,
    opening_balance: form.opening_balance === '' ? '0.00' : String(form.opening_balance),
    is_active: form.is_active,
    note: form.note.trim(),
  }
}

async function fetchBankAccounts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/api/bank-accounts/')
    bankAccounts.value = Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    console.error('Failed to load bank accounts:', error)
    errorMessage.value =
      error?.response?.data?.detail ||
      'Failed to load bank accounts.'
  } finally {
    loading.value = false
  }
}

async function saveBankAccount() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) return

  saving.value = true

  try {
    const payload = getPayload()

    if (isEditMode.value && editingId.value) {
      await api.put(`/api/bank-accounts/${editingId.value}/`, payload)
      successMessage.value = 'Bank account updated successfully.'
    } else {
      await api.post('/api/bank-accounts/', payload)
      successMessage.value = 'Bank account created successfully.'
    }

    await fetchBankAccounts()
    closeModal()
  } catch (error: any) {
    console.error('Failed to save bank account:', error)
    const data = error?.response?.data

    if (typeof data === 'object' && data !== null) {
      const firstKey = Object.keys(data)[0]
      const firstValue = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]
      errorMessage.value = String(firstValue || 'Failed to save bank account.')
    } else {
      errorMessage.value = data?.detail || 'Failed to save bank account.'
    }
  } finally {
    saving.value = false
  }
}

async function deleteBankAccount(id: number) {
  const confirmed = window.confirm('Delete this bank account?')
  if (!confirmed) return

  deletingId.value = id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.delete(`/api/bank-accounts/${id}/`)
    successMessage.value = 'Bank account deleted successfully.'
    await fetchBankAccounts()
  } catch (error: any) {
    console.error('Failed to delete bank account:', error)
    errorMessage.value =
      error?.response?.data?.detail ||
      'Failed to delete bank account.'
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchBankAccounts()
})
</script>

<template>
  <div class="page">
    <section class="hero-card">
      <div class="hero-left">
        <div class="hero-badge">Finance / Bank Accounts</div>
        <h1 class="page-title">Bank Accounts</h1>
        <p class="page-subtitle">
          Manage bank, e-wallet, and QRIS accounts used by your shop.
        </p>
      </div>

      <div class="hero-actions">
        <button class="secondary-btn" @click="fetchBankAccounts" :disabled="loading">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="primary-btn" @click="openAddModal">
          <span>＋</span>
          Add Account
        </button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <p class="stat-label">Total Accounts</p>
        <h3 class="stat-value">{{ totalAccounts }}</h3>
        <p class="stat-note">All payment destination accounts</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Active Accounts</p>
        <h3 class="stat-value">{{ activeAccounts }}</h3>
        <p class="stat-note">Accounts currently enabled</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Opening Balance</p>
        <h3 class="stat-value">{{ formatCurrency(totalOpeningBalance) }}</h3>
        <p class="stat-note">Total configured opening balance</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">Current Balance</p>
        <h3 class="stat-value">{{ formatCurrency(totalCurrentBalance) }}</h3>
        <p class="stat-note">Live combined balance</p>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <div class="search-wrap">
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search account, bank, number, holder..."
          />
        </div>

        <select v-model="typeFilter" class="filter-select">
          <option value="">All Types</option>
          <option value="BANK">Bank</option>
          <option value="EWALLET">E-Wallet</option>
          <option value="QRIS">QRIS</option>
        </select>

        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div class="toolbar-right">
        <div class="result-chip">{{ filteredAccounts.length }} result(s)</div>
      </div>
    </section>

    <section v-if="errorMessage" class="alert error-alert">
      {{ errorMessage }}
    </section>

    <section v-if="successMessage" class="alert success-alert">
      {{ successMessage }}
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Account List</h2>
          <p>Monitor balances and account configuration.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Bank / Provider</th>
              <th>Number</th>
              <th>Holder</th>
              <th>Type</th>
              <th>Opening</th>
              <th>Current</th>
              <th>Status</th>
              <th>Created At</th>
              <th class="action-col">Action</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr>
              <td colspan="10" class="empty-row">Loading bank accounts...</td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredAccounts.length === 0">
            <tr>
              <td colspan="10" class="empty-row">No bank accounts found.</td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="item in filteredAccounts" :key="item.id">
              <td>
                <div class="main-cell">
                  <div class="cell-title">{{ item.name || '-' }}</div>
                  <div class="cell-subtitle">
                    {{ item.shop_name || 'Current Shop' }}
                  </div>
                </div>
              </td>

              <td>{{ item.bank_name || '-' }}</td>
              <td>{{ item.account_number || '-' }}</td>
              <td>{{ item.account_holder || '-' }}</td>

              <td>
                <span class="type-badge" :class="item.account_type.toLowerCase()">
                  {{ getAccountTypeLabel(item.account_type) }}
                </span>
              </td>

              <td>{{ formatCurrency(item.opening_balance) }}</td>
              <td class="strong-money">{{ formatCurrency(item.current_balance) }}</td>

              <td>
                <span class="status-badge" :class="item.is_active ? 'active' : 'inactive'">
                  {{ item.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td>{{ formatDateTime(item.created_at) }}</td>

              <td>
                <div class="action-buttons">
                  <button class="icon-btn edit" @click="openEditModal(item)">Edit</button>
                  <button
                    class="icon-btn delete"
                    @click="deleteBankAccount(item.id)"
                    :disabled="deletingId === item.id"
                  >
                    {{ deletingId === item.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ isEditMode ? 'Edit Bank Account' : 'Add Bank Account' }}</h3>
            <p>Complete the account information below.</p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="field">
              <label>Account Name *</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="Main Bank Account" />
            </div>

            <div class="field">
              <label>Bank / Provider *</label>
              <input v-model="form.bank_name" type="text" class="form-input" placeholder="BNU / BNCTL / Mandiri / GoPay" />
            </div>

            <div class="field">
              <label>Account Number</label>
              <input v-model="form.account_number" type="text" class="form-input" placeholder="1234567890" />
            </div>

            <div class="field">
              <label>Account Holder</label>
              <input v-model="form.account_holder" type="text" class="form-input" placeholder="Store Name / Owner Name" />
            </div>

            <div class="field">
              <label>Account Type *</label>
              <select v-model="form.account_type" class="form-select">
                <option v-for="type in ACCOUNT_TYPE_OPTIONS" :key="type" :value="type">
                  {{ getAccountTypeLabel(type) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Opening Balance</label>
              <input v-model="form.opening_balance" type="number" step="0.01" class="form-input" placeholder="0.00" />
            </div>

            <div class="field field-full">
              <label>Note</label>
              <textarea
                v-model="form.note"
                class="form-textarea"
                rows="4"
                placeholder="Optional note for this account..."
              />
            </div>

            <div class="field checkbox-field field-full">
              <label class="checkbox-wrap">
                <input v-model="form.is_active" type="checkbox" />
                <span>Active account</span>
              </label>
            </div>
          </div>

          <div v-if="errorMessage" class="alert error-alert modal-alert">
            {{ errorMessage }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="closeModal">Cancel</button>
          <button class="primary-btn" @click="saveBankAccount" :disabled="saving">
            {{ saving ? 'Saving...' : isEditMode ? 'Update Account' : 'Save Account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100%;
  color: #0f172a;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #ffffff, #f0fdf4);
  border: 1px solid #dcfce7;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 20px;
}

.hero-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #111827;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #6b7280;
  max-width: 640px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn,
.icon-btn {
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  padding: 12px 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(34, 197, 94, 0.25);
}

.secondary-btn {
  background: white;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 12px 18px;
}

.secondary-btn:hover {
  background: #f0fdf4;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.stat-label {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.stat-value {
  margin: 10px 0 6px;
  font-size: 28px;
  font-weight: 800;
  color: #111827;
}

.stat-note {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.toolbar-card,
.table-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.search-wrap {
  flex: 1;
  min-width: 260px;
}

.search-input,
.filter-select,
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  border: 1px solid #dbe4ee;
  border-radius: 14px;
  padding: 12px 14px;
  outline: none;
  font-size: 14px;
  background: #fff;
  color: #111827;
}

.search-input:focus,
.filter-select:focus,
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.filter-select {
  min-width: 180px;
  max-width: 220px;
}

.result-chip {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
  font-weight: 700;
}

.alert {
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.success-alert {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.table-header h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
}

.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  font-size: 13px;
  color: #64748b;
  font-weight: 800;
  padding: 14px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #111827;
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.main-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-title {
  font-weight: 800;
  color: #111827;
}

.cell-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.type-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 800;
}

.type-badge.bank {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-badge.ewallet {
  background: #ede9fe;
  color: #6d28d9;
}

.type-badge.qris {
  background: #fef3c7;
  color: #b45309;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #f3f4f6;
  color: #475569;
}

.strong-money {
  font-weight: 800;
  color: #166534;
}

.action-col {
  width: 170px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.icon-btn {
  padding: 10px 12px;
  font-size: 13px;
}

.icon-btn.edit {
  background: #eff6ff;
  color: #1d4ed8;
}

.icon-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.icon-btn:disabled,
.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 32px !important;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal-card {
  width: min(780px, 100%);
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.25);
}

.modal-header,
.modal-footer {
  padding: 20px 22px;
}

.modal-header {
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 24px;
  color: #111827;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.close-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: none;
  background: #f8fafc;
  color: #334155;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 13px;
  font-weight: 800;
  color: #334155;
}

.field-full {
  grid-column: 1 / -1;
}

.form-textarea {
  resize: vertical;
  min-height: 110px;
}

.checkbox-field {
  align-items: flex-start;
}

.checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.modal-alert {
  margin-top: 16px;
  margin-bottom: 0;
}

.modal-footer {
  border-top: 1px solid #eef2f7;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .hero-card {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-actions > * {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer > * {
    width: 100%;
  }
}
</style>