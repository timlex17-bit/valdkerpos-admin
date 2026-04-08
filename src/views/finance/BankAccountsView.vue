<template>
  <div class="page">
    <section class="hero-card">
      <div class="hero-left">
        <div class="hero-badge">{{ t('bankAccountsPage.heroBadge') }}</div>
        <h1 class="page-title">{{ t('bankAccountsPage.title') }}</h1>
        <p class="page-subtitle">
          {{ t('bankAccountsPage.subtitle') }}
        </p>
      </div>

      <div class="hero-actions">
        <button class="secondary-btn" @click="fetchBankAccounts" :disabled="loading">
          {{ loading ? t('common.refreshing') : t('common.refresh') }}
        </button>
        <button class="primary-btn" @click="openAddModal">
          <span>＋</span>
          {{ t('bankAccountsPage.addAccount') }}
        </button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <p class="stat-label">{{ t('bankAccountsPage.totalAccounts') }}</p>
        <h3 class="stat-value">{{ totalAccounts }}</h3>
        <p class="stat-note">{{ t('bankAccountsPage.totalAccountsNote') }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">{{ t('bankAccountsPage.activeAccounts') }}</p>
        <h3 class="stat-value">{{ activeAccounts }}</h3>
        <p class="stat-note">{{ t('bankAccountsPage.activeAccountsNote') }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">{{ t('bankAccountsPage.openingBalance') }}</p>
        <h3 class="stat-value">{{ formatCurrency(totalOpeningBalance) }}</h3>
        <p class="stat-note">{{ t('bankAccountsPage.openingBalanceNote') }}</p>
      </article>

      <article class="stat-card">
        <p class="stat-label">{{ t('bankAccountsPage.currentBalance') }}</p>
        <h3 class="stat-value">{{ formatCurrency(totalCurrentBalance) }}</h3>
        <p class="stat-note">{{ t('bankAccountsPage.currentBalanceNote') }}</p>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <div class="search-wrap">
          <input
            v-model="search"
            type="text"
            class="search-input"
            :placeholder="t('bankAccountsPage.searchPlaceholder')"
          />
        </div>

        <select v-model="typeFilter" class="filter-select">
          <option value="">{{ t('bankAccountsPage.allTypes') }}</option>
          <option value="BANK">{{ t('bankAccountsPage.typeBank') }}</option>
          <option value="EWALLET">{{ t('bankAccountsPage.typeEwallet') }}</option>
          <option value="QRIS">{{ t('bankAccountsPage.typeQris') }}</option>
        </select>

        <select v-model="statusFilter" class="filter-select">
          <option value="">{{ t('bankAccountsPage.allStatus') }}</option>
          <option value="active">{{ t('common.active') }}</option>
          <option value="inactive">{{ t('common.inactive') }}</option>
        </select>
      </div>

      <div class="toolbar-right">
        <div class="result-chip">{{ t('common.resultsCount', { count: filteredAccounts.length }) }}</div>
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
          <h2>{{ t('bankAccountsPage.accountList') }}</h2>
          <p>{{ t('bankAccountsPage.accountListNote') }}</p>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('bankAccountsPage.account') }}</th>
              <th>{{ t('bankAccountsPage.bankProvider') }}</th>
              <th>{{ t('bankAccountsPage.number') }}</th>
              <th>{{ t('bankAccountsPage.holder') }}</th>
              <th>{{ t('common.type') }}</th>
              <th>{{ t('bankAccountsPage.opening') }}</th>
              <th>{{ t('bankAccountsPage.current') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.createdAt') }}</th>
              <th class="action-col">{{ t('common.action') }}</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr>
              <td colspan="10" class="empty-row">{{ t('bankAccountsPage.loading') }}</td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredAccounts.length === 0">
            <tr>
              <td colspan="10" class="empty-row">{{ t('bankAccountsPage.empty') }}</td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="item in filteredAccounts" :key="item.id">
              <td>
                <div class="main-cell">
                  <div class="cell-title">{{ item.name || '-' }}</div>
                  <div class="cell-subtitle">
                    {{ item.shop_name || t('bankAccountsPage.currentShop') }}
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
                  {{ item.is_active ? t('common.active') : t('common.inactive') }}
                </span>
              </td>

              <td>{{ formatDateTime(item.created_at) }}</td>

              <td>
                <div class="action-buttons">
                  <button class="icon-btn edit" @click="openEditModal(item)">
                    {{ t('common.edit') }}
                  </button>
                  <button
                    class="icon-btn delete"
                    @click="deleteBankAccount(item.id)"
                    :disabled="deletingId === item.id"
                  >
                    {{ deletingId === item.id ? t('common.deleting') : t('common.delete') }}
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
            <h3>{{ isEditMode ? t('bankAccountsPage.editBankAccount') : t('bankAccountsPage.addBankAccount') }}</h3>
            <p>{{ t('bankAccountsPage.formSubtitle') }}</p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="field">
              <label>{{ t('bankAccountsPage.accountNameRequired') }}</label>
              <input v-model="form.name" type="text" class="form-input" :placeholder="t('bankAccountsPage.accountNamePlaceholder')" />
            </div>

            <div class="field">
              <label>{{ t('bankAccountsPage.bankProviderRequired') }}</label>
              <input v-model="form.bank_name" type="text" class="form-input" :placeholder="t('bankAccountsPage.bankProviderPlaceholder')" />
            </div>

            <div class="field">
              <label>{{ t('bankAccountsPage.accountNumber') }}</label>
              <input v-model="form.account_number" type="text" class="form-input" :placeholder="t('bankAccountsPage.accountNumberPlaceholder')" />
            </div>

            <div class="field">
              <label>{{ t('bankAccountsPage.accountHolder') }}</label>
              <input v-model="form.account_holder" type="text" class="form-input" :placeholder="t('bankAccountsPage.accountHolderPlaceholder')" />
            </div>

            <div class="field">
              <label>{{ t('bankAccountsPage.accountTypeRequired') }}</label>
              <select v-model="form.account_type" class="form-select">
                <option v-for="type in ACCOUNT_TYPE_OPTIONS" :key="type" :value="type">
                  {{ getAccountTypeLabel(type) }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>{{ t('bankAccountsPage.openingBalanceField') }}</label>
              <input v-model="form.opening_balance" type="number" step="0.01" class="form-input" :placeholder="t('bankAccountsPage.openingBalancePlaceholder')" />
            </div>

            <div class="field field-full">
              <label>{{ t('common.note') }}</label>
              <textarea
                v-model="form.note"
                class="form-textarea"
                rows="4"
                :placeholder="t('bankAccountsPage.notePlaceholder')"
              />
            </div>

            <div class="field checkbox-field field-full">
              <label class="checkbox-wrap">
                <input v-model="form.is_active" type="checkbox" />
                <span>{{ t('bankAccountsPage.activeAccount') }}</span>
              </label>
            </div>
          </div>

          <div v-if="errorMessage" class="alert error-alert modal-alert">
            {{ errorMessage }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="closeModal">{{ t('common.cancel') }}</button>
          <button class="primary-btn" @click="saveBankAccount" :disabled="saving">
            {{ saving ? t('common.saving') : isEditMode ? t('bankAccountsPage.updateAccount') : t('bankAccountsPage.saveAccount') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'

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

const { t, locale } = useI18n()

const BANK_ACCOUNTS_ENDPOINT = '/api/bank-accounts/'

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

function extractRows(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function normalizeBankAccount(raw: any): BankAccount {
  return {
    id: Number(raw?.id ?? 0),
    shop_id: Number(raw?.shop_id ?? 0),
    shop_name: raw?.shop_name ?? '',
    shop_code: raw?.shop_code ?? '',
    name: raw?.name ?? '',
    bank_name: raw?.bank_name ?? '',
    account_number: raw?.account_number ?? '',
    account_holder: raw?.account_holder ?? '',
    account_type: (raw?.account_type ?? 'BANK') as AccountType,
    opening_balance: String(raw?.opening_balance ?? '0.00'),
    current_balance: String(raw?.current_balance ?? '0.00'),
    is_active: Boolean(raw?.is_active),
    note: raw?.note ?? '',
    created_at: raw?.created_at ?? '',
  }
}

function getErrorMessage(error: any, fallback = 'Request failed.') {
  const data = error?.response?.data

  if (typeof data === 'string') return data
  if (data?.detail) return String(data.detail)
  if (data?.message) return String(data.message)
  if (data?.error) return String(data.error)

  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0]
    const firstValue = firstKey ? data[firstKey] : null

    if (Array.isArray(firstValue) && firstValue.length) {
      return String(firstValue[0])
    }

    if (typeof firstValue === 'string') {
      return firstValue
    }
  }

  return error?.message || fallback
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getIntlLocale() {
  if (locale.value === 'id') return 'id-ID'
  if (locale.value === 'tet') return 'id-ID'
  return 'en-US'
}

function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(toNumber(value))
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(getIntlLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getAccountTypeLabel(type: AccountType | string) {
  if (type === 'BANK') return t('bankAccountsPage.typeBank')
  if (type === 'EWALLET') return t('bankAccountsPage.typeEwallet')
  if (type === 'QRIS') return t('bankAccountsPage.typeQris')
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
    errorMessage.value = t('bankAccountsPage.validation.accountNameRequired')
    return false
  }

  if (!form.bank_name.trim()) {
    errorMessage.value = t('bankAccountsPage.validation.bankNameRequired')
    return false
  }

  if (!form.account_type) {
    errorMessage.value = t('bankAccountsPage.validation.accountTypeRequired')
    return false
  }

  if (form.opening_balance && Number.isNaN(Number(form.opening_balance))) {
    errorMessage.value = t('bankAccountsPage.validation.openingBalanceInvalid')
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
    const response = await api.get(BANK_ACCOUNTS_ENDPOINT)
    const rows = extractRows(response.data)
    bankAccounts.value = rows.map(normalizeBankAccount)
  } catch (error: any) {
    console.error('Failed to load bank accounts:', error)
    errorMessage.value = getErrorMessage(error, t('bankAccountsPage.messages.loadFailed'))
    bankAccounts.value = []
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
      await api.put(`${BANK_ACCOUNTS_ENDPOINT}${editingId.value}/`, payload)
      successMessage.value = t('bankAccountsPage.messages.updated')
    } else {
      await api.post(BANK_ACCOUNTS_ENDPOINT, payload)
      successMessage.value = t('bankAccountsPage.messages.created')
    }

    await fetchBankAccounts()
    closeModal()
  } catch (error: any) {
    console.error('Failed to save bank account:', error)
    errorMessage.value = getErrorMessage(error, t('bankAccountsPage.messages.saveFailed'))
  } finally {
    saving.value = false
  }
}

async function deleteBankAccount(id: number) {
  const confirmed = window.confirm(t('bankAccountsPage.messages.confirmDelete'))
  if (!confirmed) return

  deletingId.value = id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.delete(`${BANK_ACCOUNTS_ENDPOINT}${id}/`)
    successMessage.value = t('bankAccountsPage.messages.deleted')
    await fetchBankAccounts()
  } catch (error: any) {
    console.error('Failed to delete bank account:', error)
    errorMessage.value = getErrorMessage(error, t('bankAccountsPage.messages.deleteFailed'))
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchBankAccounts()
})
</script>

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