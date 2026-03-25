<template>
    <div class="dashboard-page">
      <!-- Header -->
      <section class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          <p class="page-subtitle">Manage shop users and access roles for your current shop.</p>
  
          <div class="breadcrumb">
            <span>Home</span>
            <span>/</span>
            <span>Users</span>
            <span>/</span>
            <span class="active">Users</span>
          </div>
        </div>
  
        <button class="add-btn" @click="openAddModal">
          <span>+</span>
          Add User
        </button>
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
            <option value="Owner">Owner</option>
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
          </select>
  
          <select v-model="activeFilter" class="filter-select">
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
  
          <button class="reset-btn" @click="resetFilters">Reset</button>
        </div>
      </section>
  
      <!-- Table -->
      <section class="table-card">
        <div class="table-header">
          <div>
            <h2>User List</h2>
            <p>{{ filteredUsers.length }} user(s) found</p>
          </div>
        </div>
  
        <div class="table-wrap" v-if="filteredUsers.length">
          <table class="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>First name</th>
                <th>Last name</th>
                <th>Email address</th>
                <th>Role</th>
                <th>Active</th>
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
                      <div class="sub-text">@{{ user.username.toLowerCase() }}</div>
                    </div>
                  </div>
                </td>
  
                <td>{{ user.firstName || '-' }}</td>
                <td>{{ user.lastName || '-' }}</td>
                <td>{{ user.email || '-' }}</td>
  
                <td>
                  <span class="status-badge" :class="roleClass(user.role)">
                    {{ user.role }}
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
  
                <td>
                  <div class="action-buttons">
                    <button class="btn-view" @click="openEditModal(user)">View</button>
                    <button class="btn-edit" @click="openEditModal(user)">Edit</button>
                    <button class="btn-delete" @click="deleteUser(user.id)">Delete</button>
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
              <h2>{{ isEditMode ? 'Edit User' : 'Add User' }}</h2>
              <p>Fill in the form below to save user data.</p>
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
                />
              </div>
  
              <div class="form-group">
                <label>Email address</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-input"
                  placeholder="Enter email address"
                />
              </div>
  
              <div class="form-group">
                <label>First name</label>
                <input
                  v-model="form.firstName"
                  type="text"
                  class="form-input"
                  placeholder="Enter first name"
                />
              </div>
  
              <div class="form-group">
                <label>Last name</label>
                <input
                  v-model="form.lastName"
                  type="text"
                  class="form-input"
                  placeholder="Enter last name"
                />
              </div>
  
              <div class="form-group">
                <label>Role</label>
                <select v-model="form.role" class="form-input">
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                </select>
              </div>
  
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.isActive" class="form-input">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
  
              <div class="form-group" v-if="!isEditMode">
                <label>Password</label>
                <input
                  v-model="form.password"
                  type="password"
                  class="form-input"
                  placeholder="Enter password"
                />
              </div>
  
              <div class="form-group" v-if="!isEditMode">
                <label>Confirm password</label>
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  class="form-input"
                  placeholder="Confirm password"
                />
              </div>
            </div>
  
            <div class="modal-actions">
              <button class="secondary-btn" @click="closeModal">Cancel</button>
              <button class="save-btn" @click="saveUser">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  
  type UserRole = 'Owner' | 'Manager' | 'Cashier'
  
  type ShopUser = {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    role: UserRole
    isActive: boolean
  }
  
  const users = ref<ShopUser[]>([
    {
      id: 4,
      username: 'rivaldo',
      firstName: 'Rivaldo',
      lastName: 'Guterres',
      email: 'rivaldo@example.com',
      role: 'Owner',
      isActive: true,
    },
    {
      id: 3,
      username: 'jeffri',
      firstName: 'Jeffri',
      lastName: 'Da Costa',
      email: 'jeffri@example.com',
      role: 'Manager',
      isActive: true,
    },
    {
      id: 2,
      username: 'julio',
      firstName: 'Julio',
      lastName: 'Martins',
      email: 'julio@example.com',
      role: 'Cashier',
      isActive: true,
    },
    {
      id: 1,
      username: 'cashier2',
      firstName: 'Ana',
      lastName: 'Soares',
      email: 'ana@example.com',
      role: 'Cashier',
      isActive: false,
    },
  ])
  
  const search = ref('')
  const roleFilter = ref('')
  const activeFilter = ref('')
  
  const showModal = ref(false)
  const isEditMode = ref(false)
  const editingId = ref<number | null>(null)
  
  const form = reactive({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'Cashier' as UserRole,
    isActive: true,
    password: '',
    confirmPassword: '',
  })
  
  const filteredUsers = computed(() => {
    let results = [...users.value]
    const keyword = search.value.trim().toLowerCase()
  
    if (keyword) {
      results = results.filter((item) =>
        item.username.toLowerCase().includes(keyword) ||
        item.firstName.toLowerCase().includes(keyword) ||
        item.lastName.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword)
      )
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
    users.value.filter((item) => item.role === 'Owner' || item.role === 'Manager').length
  )
  
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
    form.role = 'Cashier'
    form.isActive = true
    form.password = ''
    form.confirmPassword = ''
  }
  
  function openAddModal() {
    resetForm()
    editingId.value = null
    isEditMode.value = false
    showModal.value = true
  }
  
  function openEditModal(user: ShopUser) {
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
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
  }
  
  function validateForm() {
    if (!form.username.trim()) {
      alert('Username is required.')
      return false
    }
  
    if (!form.email.trim()) {
      alert('Email address is required.')
      return false
    }
  
    if (!isEditMode.value) {
      if (!form.password) {
        alert('Password is required.')
        return false
      }
  
      if (form.password !== form.confirmPassword) {
        alert('Password confirmation does not match.')
        return false
      }
    }
  
    return true
  }
  
  function nextId() {
    return users.value.length ? Math.max(...users.value.map((item) => item.id)) + 1 : 1
  }
  
  function saveUser() {
    if (!validateForm()) return
  
    const payload: ShopUser = {
      id: editingId.value ?? nextId(),
      username: form.username.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      role: form.role,
      isActive: form.isActive,
    }
  
    if (isEditMode.value && editingId.value !== null) {
      const index = users.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) users.value[index] = payload
    } else {
      users.value.unshift(payload)
    }
  
    closeModal()
    resetForm()
  }
  
  function deleteUser(id: number) {
    if (!window.confirm('Delete this user?')) return
    users.value = users.value.filter((item) => item.id !== id)
  }
  
  function getInitials(firstName: string, lastName: string, username: string) {
    const a = firstName?.trim()?.charAt(0) || ''
    const b = lastName?.trim()?.charAt(0) || ''
    if (a || b) return `${a}${b}`.toUpperCase()
    return username?.trim()?.charAt(0)?.toUpperCase() || 'U'
  }
  
  function roleClass(role: UserRole) {
    return {
      info: role === 'Owner',
      unpaid: role === 'Manager',
      paid: role === 'Cashier',
    }
  }
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
  
  .add-btn span {
    font-size: 1.3rem;
    line-height: 1;
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
    min-width: 1100px;
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
  
  @media (max-width: 1100px) {
    .toolbar-grid-4,
    .stats-grid,
    .two-col {
      grid-template-columns: 1fr;
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
  
    .modal-actions {
      flex-direction: column;
    }
  
    .secondary-btn,
    .save-btn {
      width: 100%;
    }
  }
  </style>