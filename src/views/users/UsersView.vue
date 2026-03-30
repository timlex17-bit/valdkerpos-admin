<template>
  <div class="dashboard-page">
    <!-- Header -->
    <section class="page-header">
      <div>
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">
          Manage shop users and access roles for your current shop.
        </p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Users</span>
          <span>/</span>
          <span class="active">Users</span>
        </div>
      </div>

      <button class="add-btn" @click="openAddModal" :disabled="saving">
        <span>+</span>
        Add User
      </button>
    </section>

    <!-- Alert -->
    <section v-if="errorMessage" class="alert-card alert-error">
      <div>
        <strong>Request failed.</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <button class="alert-close" @click="errorMessage = ''">×</button>
    </section>

    <section v-if="successMessage" class="alert-card alert-success">
      <div>
        <strong>Success.</strong>
        <p>{{ successMessage }}</p>
      </div>
      <button class="alert-close" @click="successMessage = ''">×</button>
    </section>

    <!-- Summary -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Users</div>
        <div class="stat-value">{{ filteredUsers.length }}</div>
        <div class="stat-note">Users shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Active Users</div>
        <div class="stat-value">{{ activeCount }}</div>
        <div class="stat-note">Users currently active</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Managers & Owners</div>
        <div class="stat-value">{{ adminCount }}</div>
        <div class="stat-note">Higher access users</div>
      </div>
    </section>

    <!-- Toolbar -->
    <section class="toolbar-card">
      <div class="toolbar-grid toolbar-grid-4">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by username, name, email..."
          />
        </div>

        <select v-model="roleFilter" class="filter-select">
          <option value="">All roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
        </select>

        <select v-model="activeFilter" class="filter-select">
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <div class="toolbar-actions">
          <button class="reset-btn" @click="resetFilters">Reset</button>
          <button class="refresh-btn" @click="fetchUsers" :disabled="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Table -->
    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>User List</h2>
          <p v-if="loading">Loading users...</p>
          <p v-else>{{ filteredUsers.length }} user(s) found</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Loading user data from API...</p>
      </div>

      <div v-else-if="filteredUsers.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>First name</th>
              <th>Last name</th>
              <th>Email address</th>
              <th>Role</th>
              <th>Active</th>
              <th>Date joined</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">
                    {{ getInitials(user.firstName, user.lastName, user.username) }}
                  </div>
                  <div>
                    <div class="title-main">{{ user.username }}</div>
                    <div class="sub-text">
                      {{ user.fullName || `@${String(user.username || '').toLowerCase()}` }}
                    </div>
                  </div>
                </div>
              </td>

              <td>{{ user.firstName || '-' }}</td>
              <td>{{ user.lastName || '-' }}</td>
              <td>{{ user.email || '-' }}</td>

              <td>
                <span class="status-badge" :class="roleClass(user.role)">
                  {{ user.roleLabel }}
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="user.isActive ? 'paid' : 'cancelled'"
                >
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td>{{ formatDate(user.dateJoined) }}</td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openViewModal(user)">View</button>
                  <button class="btn-edit" @click="openEditModal(user)">Edit</button>
                  <button
                    class="btn-delete"
                    @click="deleteUser(user)"
                    :disabled="deletingId === user.id"
                  >
                    {{ deletingId === user.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>No users found</h3>
        <p>Try another keyword or create a new user.</p>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-card-wide">
        <div class="modal-header">
          <div>
            <h2>
              {{
                viewOnly
                  ? 'User Details'
                  : isEditMode
                    ? 'Edit User'
                    : 'Add User'
              }}
            </h2>
            <p>
              {{
                viewOnly
                  ? 'Read-only staff information for this shop.'
                  : 'Fill in the form below to save user data.'
              }}
            </p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid two-col">
            <div class="form-group">
              <label>Username</label>
              <input
                v-model="form.username"
                type="text"
                class="form-input"
                placeholder="Enter username"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>Email address</label>
              <input
                v-model="form.email"
                type="email"
                class="form-input"
                placeholder="Enter email address"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>First name</label>
              <input
                v-model="form.firstName"
                type="text"
                class="form-input"
                placeholder="Enter first name"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>Last name</label>
              <input
                v-model="form.lastName"
                type="text"
                class="form-input"
                placeholder="Enter last name"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>Role</label>
              <select
                v-model="form.role"
                class="form-input"
                :disabled="viewOnly || saving"
              >
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>

            <div class="form-group">
              <label>Status</label>
              <select
                v-model="form.isActive"
                class="form-input"
                :disabled="viewOnly || saving"
              >
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>

            <div class="form-group" v-if="!viewOnly">
              <label>{{ isEditMode ? 'New password (optional)' : 'Password' }}</label>
              <input
                v-model="form.password"
                type="password"
                class="form-input"
                :placeholder="isEditMode ? 'Leave blank to keep current password' : 'Enter password'"
                :disabled="saving"
              />
            </div>

            <div class="form-group" v-if="!viewOnly">
              <label>
                {{ isEditMode ? 'Confirm new password' : 'Confirm password' }}
              </label>
              <input
                v-model="form.confirmPassword"
                type="password"
                class="form-input"
                :placeholder="isEditMode ? 'Confirm new password' : 'Confirm password'"
                :disabled="saving"
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>Shop</label>
              <input
                :value="selectedUser?.shopName || '-'"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>Shop code</label>
              <input
                :value="selectedUser?.shopCode || '-'"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>Date joined</label>
              <input
                :value="formatDate(selectedUser?.dateJoined || '')"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>Full name</label>
              <input
                :value="selectedUser?.fullName || '-'"
                type="text"
                class="form-input"
                disabled
              />
            </div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="closeModal">
              {{ viewOnly ? 'Close' : 'Cancel' }}
            </button>

            <button
              v-if="!viewOnly"
              class="save-btn"
              @click="saveUser"
              :disabled="saving"
            >
              {{ saving ? 'Saving...' : isEditMode ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '@/services/api'
import { computed, onMounted, reactive, ref } from 'vue'

type UserRoleApi = 'owner' | 'manager' | 'cashier'

type StaffApiItem = {
  id: number
  username: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  role: UserRoleApi
  role_label: string
  shop_id: number | null
  shop_name: string
  shop_code: string
  is_active: boolean
  date_joined: string
}

type ShopUser = {
  id: number
  username: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  role: UserRoleApi
  roleLabel: string
  shopId: number | null
  shopName: string
  shopCode: string
  isActive: boolean
  dateJoined: string
}

const users = ref<ShopUser[]>([])
const search = ref('')
const roleFilter = ref('')
const activeFilter = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const viewOnly = ref(false)
const editingId = ref<number | null>(null)
const selectedUser = ref<ShopUser | null>(null)

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'cashier' as UserRoleApi,
  isActive: true,
  password: '',
  confirmPassword: '',
})

const filteredUsers = computed(() => {
  let results = [...users.value]
  const keyword = search.value.trim().toLowerCase()

  if (keyword) {
    results = results.filter((item) => {
      const haystack = [
        item.username,
        item.fullName,
        item.firstName,
        item.lastName,
        item.email,
        item.roleLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }

  if (roleFilter.value) {
    results = results.filter((item) => item.role === roleFilter.value)
  }

  if (activeFilter.value !== '') {
    const activeValue = activeFilter.value === 'true'
    results = results.filter((item) => item.isActive === activeValue)
  }

  return results
})

const activeCount = computed(() => users.value.filter((item) => item.isActive).length)
const adminCount = computed(() =>
  users.value.filter((item) => item.role === 'owner' || item.role === 'manager').length
)

function normalizeUser(item: StaffApiItem): ShopUser {
  return {
    id: Number(item.id),
    username: item.username || '',
    fullName: item.full_name || buildFullName(item.first_name, item.last_name),
    firstName: item.first_name || '',
    lastName: item.last_name || '',
    email: item.email || '',
    role: normalizeRole(item.role),
    roleLabel: item.role_label || roleToLabel(item.role),
    shopId: item.shop_id ?? null,
    shopName: item.shop_name || '',
    shopCode: item.shop_code || '',
    isActive: Boolean(item.is_active),
    dateJoined: item.date_joined || '',
  }
}

function normalizeRole(role: unknown): UserRoleApi {
  const value = String(role || '').toLowerCase()
  if (value === 'owner' || value === 'manager' || value === 'cashier') return value
  return 'cashier'
}

function roleToLabel(role: unknown) {
  const value = normalizeRole(role)
  if (value === 'owner') return 'Owner'
  if (value === 'manager') return 'Manager'
  return 'Cashier'
}

function buildFullName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/api/staff/')
    const raw = Array.isArray(response.data) ? response.data : []
    users.value = raw.map(normalizeUser)
  } catch (error: any) {
    errorMessage.value = extractErrorMessage(error, 'Failed to load staff list.')
    users.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  search.value = ''
  roleFilter.value = ''
  activeFilter.value = ''
}

function resetForm() {
  form.username = ''
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.role = 'cashier'
  form.isActive = true
  form.password = ''
  form.confirmPassword = ''
}

function openAddModal() {
  successMessage.value = ''
  errorMessage.value = ''
  selectedUser.value = null
  resetForm()
  editingId.value = null
  isEditMode.value = false
  viewOnly.value = false
  showModal.value = true
}

function openViewModal(user: ShopUser) {
  selectedUser.value = user
  resetForm()

  form.username = user.username
  form.firstName = user.firstName
  form.lastName = user.lastName
  form.email = user.email
  form.role = user.role
  form.isActive = user.isActive

  editingId.value = user.id
  isEditMode.value = false
  viewOnly.value = true
  showModal.value = true
}

function openEditModal(user: ShopUser) {
  successMessage.value = ''
  errorMessage.value = ''
  selectedUser.value = user

  form.username = user.username
  form.firstName = user.firstName
  form.lastName = user.lastName
  form.email = user.email
  form.role = user.role
  form.isActive = user.isActive
  form.password = ''
  form.confirmPassword = ''

  editingId.value = user.id
  isEditMode.value = true
  viewOnly.value = false
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  viewOnly.value = false
  isEditMode.value = false
  editingId.value = null
  selectedUser.value = null
  resetForm()
}

function validateForm() {
  if (!form.username.trim()) {
    errorMessage.value = 'Username is required.'
    return false
  }

  if (!/^[\w.@+-]+$/.test(form.username.trim())) {
    errorMessage.value =
      'Username may contain only letters, numbers, and @/./+/-/_ characters.'
    return false
  }

  if (!form.role) {
    errorMessage.value = 'Role is required.'
    return false
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errorMessage.value = 'Email address format is invalid.'
    return false
  }

  if (!isEditMode.value) {
    if (!form.password) {
      errorMessage.value = 'Password is required.'
      return false
    }

    if (form.password !== form.confirmPassword) {
      errorMessage.value = 'Password confirmation does not match.'
      return false
    }
  }

  if (isEditMode.value && (form.password || form.confirmPassword)) {
    if (form.password !== form.confirmPassword) {
      errorMessage.value = 'Password confirmation does not match.'
      return false
    }
  }

  return true
}

function buildPayload(isEdit = false) {
  const payload: Record<string, any> = {
    username: form.username.trim(),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    role: form.role,
    is_active: Boolean(form.isActive),
  }

  if (!isEdit || form.password) {
    payload.password = form.password
  }

  return payload
}

async function saveUser() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) return

  saving.value = true
  try {
    if (isEditMode.value && editingId.value !== null) {
      const response = await api.patch(`/api/staff/${editingId.value}/`, buildPayload(true))
      const normalized = normalizeUser(response.data)
      const index = users.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        users.value[index] = normalized
      } else {
        users.value.unshift(normalized)
      }
      successMessage.value = 'User updated successfully.'
    } else {
      const response = await api.post('/api/staff/', buildPayload(false))
      const normalized = normalizeUser(response.data)
      users.value.unshift(normalized)
      successMessage.value = 'User created successfully.'
    }

    closeModal()
    await fetchUsers()
  } catch (error: any) {
    errorMessage.value = extractErrorMessage(error, 'Failed to save user.')
  } finally {
    saving.value = false
  }
}

async function deleteUser(user: ShopUser) {
  errorMessage.value = ''
  successMessage.value = ''

  const confirmed = window.confirm(`Delete user "${user.username}"?`)
  if (!confirmed) return

  deletingId.value = user.id
  try {
    await api.delete(`/api/staff/${user.id}/`)
    users.value = users.value.filter((item) => item.id !== user.id)
    successMessage.value = 'User deleted successfully.'
  } catch (error: any) {
    errorMessage.value = extractErrorMessage(error, 'Failed to delete user.')
  } finally {
    deletingId.value = null
  }
}

function extractErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) return data

  if (data?.detail) return String(data.detail)

  if (data && typeof data === 'object') {
    const messages: string[] = []

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        messages.push(`${humanizeKey(key)}: ${value.join(', ')}`)
      } else if (value && typeof value === 'object') {
        messages.push(`${humanizeKey(key)}: ${JSON.stringify(value)}`)
      } else if (value !== undefined && value !== null) {
        messages.push(`${humanizeKey(key)}: ${String(value)}`)
      }
    })

    if (messages.length) return messages.join(' | ')
  }

  return fallback
}

function humanizeKey(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getInitials(firstName: string, lastName: string, username: string) {
  const a = String(firstName || '').trim().charAt(0)
  const b = String(lastName || '').trim().charAt(0)
  if (a || b) return `${a}${b}`.toUpperCase()
  return String(username || '').trim().charAt(0).toUpperCase() || 'U'
}

function roleClass(role: UserRoleApi) {
  return {
    info: role === 'owner',
    unpaid: role === 'manager',
    paid: role === 'cashier',
  }
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

onMounted(() => {
  fetchUsers()
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
  margin: 10px 0 12px;
  color: #6b7280;
  font-size: 1rem;
}

.breadcrumb {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 0.98rem;
}

.breadcrumb .active {
  color: #2563eb;
  font-weight: 700;
}

.add-btn {
  border: none;
  background: #22c55e;
  color: white;
  padding: 14px 22px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.18);
}

.add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-btn span {
  font-size: 1.3rem;
  line-height: 1;
}

.alert-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 18px;
  margin-bottom: 18px;
  border: 1px solid transparent;
}

.alert-card strong {
  display: block;
  margin-bottom: 6px;
}

.alert-card p {
  margin: 0;
  color: inherit;
}

.alert-error {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}

.alert-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.alert-close {
  border: none;
  background: rgba(255, 255, 255, 0.7);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.2rem;
  color: inherit;
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
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
  grid-template-columns: 1.8fr 1fr 1fr auto;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
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

.reset-btn,
.refresh-btn {
  height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.reset-btn {
  background: #eef2f7;
  color: #334155;
}

.refresh-btn {
  background: #e0f2fe;
  color: #0369a1;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.loading-state {
  padding: 42px 20px 48px;
  text-align: center;
}

.loading-state p {
  margin: 14px 0 0;
  color: #64748b;
  font-weight: 600;
}

.loader {
  width: 42px;
  height: 42px;
  border: 4px solid #e2e8f0;
  border-top-color: #22c55e;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 0.8s linear infinite;
}

.table-wrap {
  overflow-x: auto;
  padding: 8px 18px 18px;
}

.data-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 0.93rem;
  color: #64748b;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 16px;
  vertical-align: middle;
  border-bottom: 1px solid #edf2f7;
  color: #1f2937;
  font-size: 0.96rem;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.title-main {
  font-weight: 700;
  color: #1f2937;
}

.sub-text {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 4px;
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

.btn-view,
.btn-edit,
.btn-delete {
  height: 38px;
  padding: 0 14px;
  border-radius: 14px;
  background: white;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.92rem;
}

.btn-view {
  border: 1px solid #bfdbfe;
  color: #2563eb;
}

.btn-edit {
  border: 1px solid #fdba74;
  color: #ea580c;
}

.btn-delete {
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.btn-delete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.empty-state {
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
  width: min(920px, 100%);
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

.form-grid {
  display: grid;
  gap: 16px;
}

.two-col {
  grid-template-columns: 1fr 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 700;
  color: #334155;
  font-size: 0.95rem;
}

.form-input {
  min-height: 46px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 10px 14px;
  outline: none;
  font-size: 0.96rem;
  color: #334155;
  box-sizing: border-box;
}

.form-input:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.secondary-btn,
.save-btn {
  height: 46px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.secondary-btn {
  background: #eef2f7;
  color: #334155;
}

.save-btn {
  background: #22c55e;
  color: white;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .toolbar-grid-4,
  .stats-grid,
  .two-col {
    grid-template-columns: 1fr;
  }

  .toolbar-actions {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .page-title {
    font-size: 32px;
    line-height: 1.15;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .reset-btn,
  .refresh-btn {
    width: 100%;
  }

  .modal-actions {
    flex-direction: column;
  }

  .secondary-btn,
  .save-btn {
    width: 100%;
  }
}
</style>