<template>
    <div class="warehouse-page">
      <section class="page-header">
        <div>
          <h1 class="page-title">{{ t('warehousesPage.title') }}</h1>
          <p class="page-subtitle">
            {{ t('warehousesPage.subtitle') }}
          </p>
  
          <div class="breadcrumb">
            <span>{{ t('warehousesPage.breadcrumbHome') }}</span>
            <span>›</span>
            <span>{{ t('warehousesPage.breadcrumbInventory') }}</span>
            <span>›</span>
            <span class="active">{{ t('warehousesPage.title') }}</span>
          </div>
        </div>
  
        <div class="page-actions">
          <button class="btn btn-light" @click="resetFilters">
            {{ t('warehousesPage.resetButton') }}
          </button>
          <button class="btn btn-primary" @click="openAddModal">
            + {{ t('warehousesPage.addWarehouse') }}
          </button>
        </div>
      </section>
  
      <section class="summary-grid">
        <article class="summary-card emerald">
          <p>{{ t('warehousesPage.totalWarehouses') }}</p>
          <h3>{{ warehouses.length }}</h3>
          <span>{{ t('warehousesPage.summaryWarehouseText') }}</span>
        </article>
  
        <article class="summary-card blue">
          <p>{{ t('warehousesPage.activeWarehouses') }}</p>
          <h3>{{ activeCount }}</h3>
          <span>{{ t('warehousesPage.summaryActiveText') }}</span>
        </article>
  
        <article class="summary-card amber">
          <p>{{ t('warehousesPage.inactiveWarehouses') }}</p>
          <h3>{{ inactiveCount }}</h3>
          <span>{{ t('warehousesPage.summaryInactiveText') }}</span>
        </article>
      </section>
  
      <section class="toolbar-card">
        <div class="toolbar-left">
          <input
            v-model="search"
            type="text"
            class="search-input"
            :placeholder="t('warehousesPage.searchPlaceholder')"
          />
  
          <select v-model="statusFilter" class="filter-select">
            <option value="">{{ t('warehousesPage.allStatus') }}</option>
            <option value="active">{{ t('warehousesPage.activeLabel') }}</option>
            <option value="inactive">{{ t('warehousesPage.inactiveLabel') }}</option>
          </select>
        </div>
  
        <div class="toolbar-right">
          <span class="results-count">
            {{ t('warehousesPage.resultsCount', { count: filteredWarehouses.length }) }}
          </span>
        </div>
      </section>
  
      <section class="table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ t('warehousesPage.nameLabel') }}</th>
                <th>{{ t('warehousesPage.codeLabel') }}</th>
                <th>{{ t('warehousesPage.phoneLabel') }}</th>
                <th>{{ t('warehousesPage.addressLabel') }}</th>
                <th>{{ t('warehousesPage.activeLabel') }}</th>
                <th>{{ t('warehousesPage.createdAtLabel') }}</th>
                <th>{{ t('warehousesPage.actionsLabel') }}</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredWarehouses.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-wrap">
                    <h3>{{ t('warehousesPage.emptyTitle') }}</h3>
                    <p>{{ t('warehousesPage.emptySubtitle') }}</p>
                  </div>
                </td>
              </tr>
  
              <tr v-for="warehouse in filteredWarehouses" :key="warehouse.id">
                <td class="id-cell">#{{ warehouse.id }}</td>
                <td>
                  <div class="primary-cell">
                    <strong>{{ warehouse.name }}</strong>
                    <span v-if="warehouse.note">{{ warehouse.note }}</span>
                  </div>
                </td>
                <td>{{ warehouse.code || '-' }}</td>
                <td>{{ warehouse.phone || '-' }}</td>
                <td>{{ warehouse.address || '-' }}</td>
                <td>
                  <span
                    class="status-badge"
                    :class="warehouse.is_active ? 'status-active' : 'status-inactive'"
                  >
                    {{
                      warehouse.is_active
                        ? t('warehousesPage.activeLabel')
                        : t('warehousesPage.inactiveLabel')
                    }}
                  </span>
                </td>
                <td>{{ formatDate(warehouse.created_at) }}</td>
                <td>
                  <div class="table-actions">
                    <button class="action-btn edit" @click="openEditModal(warehouse)">
                      {{ t('warehousesPage.editButton') }}
                    </button>
                    <button class="action-btn delete" @click="removeWarehouse(warehouse.id)">
                      {{ t('warehousesPage.deleteButton') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
  
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h2>
                {{ isEditing ? t('warehousesPage.editWarehouse') : t('warehousesPage.addWarehouse') }}
              </h2>
              <p>{{ t('warehousesPage.formSubtitle') }}</p>
            </div>
  
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <form class="modal-body" @submit.prevent="saveWarehouse">
            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('warehousesPage.nameLabel') }}</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  :placeholder="t('warehousesPage.namePlaceholder')"
                />
              </div>
  
              <div class="form-group">
                <label>{{ t('warehousesPage.codeLabel') }}</label>
                <input
                  v-model="form.code"
                  type="text"
                  class="form-input"
                  :placeholder="t('warehousesPage.codePlaceholder')"
                />
              </div>
  
              <div class="form-group">
                <label>{{ t('warehousesPage.phoneLabel') }}</label>
                <input
                  v-model="form.phone"
                  type="text"
                  class="form-input"
                  :placeholder="t('warehousesPage.phonePlaceholder')"
                />
              </div>
  
              <div class="form-group">
                <label>{{ t('warehousesPage.managerLabel') }}</label>
                <input
                  v-model="form.manager"
                  type="text"
                  class="form-input"
                  :placeholder="t('warehousesPage.managerPlaceholder')"
                />
              </div>
  
              <div class="form-group full-width">
                <label>{{ t('warehousesPage.addressLabel') }}</label>
                <textarea
                  v-model="form.address"
                  class="form-textarea"
                  rows="3"
                  :placeholder="t('warehousesPage.addressPlaceholder')"
                />
              </div>
  
              <div class="form-group full-width">
                <label>{{ t('warehousesPage.noteLabel') }}</label>
                <textarea
                  v-model="form.note"
                  class="form-textarea"
                  rows="3"
                  :placeholder="t('warehousesPage.notePlaceholder')"
                />
              </div>
  
              <div class="form-group full-width checkbox-group">
                <label class="checkbox-label">
                  <input v-model="form.is_active" type="checkbox" />
                  <span>{{ t('warehousesPage.activeWarehouseLabel') }}</span>
                </label>
              </div>
            </div>
  
            <div class="modal-footer">
              <button type="button" class="btn btn-light" @click="closeModal">
                {{ t('warehousesPage.cancelButton') }}
              </button>
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? t('warehousesPage.updateButton') : t('warehousesPage.saveButton') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  
  type Warehouse = {
    id: number
    name: string
    code: string
    phone: string
    manager: string
    address: string
    note: string
    is_active: boolean
    created_at: string
  }
  
  const { t, locale } = useI18n()
  
  const search = ref('')
  const statusFilter = ref('')
  const showModal = ref(false)
  const isEditing = ref(false)
  const editingId = ref<number | null>(null)
  
  const warehouses = ref<Warehouse[]>([
    {
      id: 1,
      name: 'Main Warehouse',
      code: 'WH-001',
      phone: '+670 7777 1111',
      manager: 'Admin',
      address: 'Dili, Timor-Leste',
      note: 'Primary warehouse for daily stock',
      is_active: true,
      created_at: '2026-03-10T10:30:00',
    },
    {
      id: 2,
      name: 'Kitchen Warehouse',
      code: 'WH-002',
      phone: '+670 7777 2222',
      manager: 'Kitchen Lead',
      address: 'Becora, Dili',
      note: 'Ingredients and kitchen stock',
      is_active: true,
      created_at: '2026-03-14T14:15:00',
    },
    {
      id: 3,
      name: 'Old Storage',
      code: 'WH-003',
      phone: '',
      manager: 'Staff',
      address: 'Comoro, Dili',
      note: 'Legacy storage room',
      is_active: false,
      created_at: '2026-03-20T09:00:00',
    },
  ])
  
  const form = reactive({
    name: '',
    code: '',
    phone: '',
    manager: '',
    address: '',
    note: '',
    is_active: true,
  })
  
  const filteredWarehouses = computed(() => {
    return warehouses.value.filter((item) => {
      const keyword = search.value.toLowerCase()
  
      const matchesSearch =
        item.name.toLowerCase().includes(keyword) ||
        item.code.toLowerCase().includes(keyword) ||
        item.address.toLowerCase().includes(keyword)
  
      const matchesStatus =
        statusFilter.value === ''
          ? true
          : statusFilter.value === 'active'
            ? item.is_active
            : !item.is_active
  
      return matchesSearch && matchesStatus
    })
  })
  
  const activeCount = computed(() => warehouses.value.filter((item) => item.is_active).length)
  const inactiveCount = computed(() => warehouses.value.filter((item) => !item.is_active).length)
  
  const resetForm = () => {
    form.name = ''
    form.code = ''
    form.phone = ''
    form.manager = ''
    form.address = ''
    form.note = ''
    form.is_active = true
  }
  
  const resetFilters = () => {
    search.value = ''
    statusFilter.value = ''
  }
  
  const openAddModal = () => {
    resetForm()
    isEditing.value = false
    editingId.value = null
    showModal.value = true
  }
  
  const openEditModal = (warehouse: Warehouse) => {
    form.name = warehouse.name
    form.code = warehouse.code
    form.phone = warehouse.phone
    form.manager = warehouse.manager
    form.address = warehouse.address
    form.note = warehouse.note
    form.is_active = warehouse.is_active
  
    isEditing.value = true
    editingId.value = warehouse.id
    showModal.value = true
  }
  
  const closeModal = () => {
    showModal.value = false
  }
  
  const saveWarehouse = () => {
    if (!form.name.trim()) {
      alert(t('warehousesPage.validationNameRequired'))
      return
    }
  
    if (isEditing.value && editingId.value !== null) {
      const index = warehouses.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        warehouses.value[index] = {
          ...warehouses.value[index],
          name: form.name,
          code: form.code,
          phone: form.phone,
          manager: form.manager,
          address: form.address,
          note: form.note,
          is_active: form.is_active,
        }
      }
    } else {
      warehouses.value.unshift({
        id: Date.now(),
        name: form.name,
        code: form.code,
        phone: form.phone,
        manager: form.manager,
        address: form.address,
        note: form.note,
        is_active: form.is_active,
        created_at: new Date().toISOString(),
      })
    }
  
    closeModal()
    resetForm()
  }
  
  const removeWarehouse = (id: number) => {
    const confirmed = window.confirm(t('warehousesPage.deleteConfirm'))
    if (!confirmed) return
  
    warehouses.value = warehouses.value.filter((item) => item.id !== id)
  }
  
  const formatDate = (value: string) => {
    if (!value) return '-'
  
    const currentLocale =
      locale.value === 'id' ? 'id-ID' :
      locale.value === 'tet' ? 'id-ID' :
      'en-US'
  
    return new Intl.DateTimeFormat(currentLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(value))
  }
  </script>
  
  <style scoped>
  .warehouse-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .page-header,
  .toolbar-card,
  .table-card,
  .summary-card,
  .modal-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  }
  
  .page-header {
    padding: 24px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  
  .page-title {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    color: #0f172a;
  }
  
  .page-subtitle {
    margin: 8px 0 0;
    font-size: 14px;
    color: #64748b;
    max-width: 760px;
  }
  
  .breadcrumb {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
    font-size: 13px;
    color: #94a3b8;
  }
  
  .breadcrumb .active {
    color: #16a34a;
    font-weight: 700;
  }
  
  .page-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  
  .summary-card {
    padding: 20px;
  }
  
  .summary-card p {
    margin: 0 0 10px;
    font-size: 14px;
    color: #64748b;
  }
  
  .summary-card h3 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    color: #0f172a;
  }
  
  .summary-card span {
    display: inline-block;
    margin-top: 10px;
    font-size: 13px;
    color: #64748b;
  }
  
  .summary-card.emerald {
    border-top: 4px solid #16a34a;
  }
  
  .summary-card.blue {
    border-top: 4px solid #2563eb;
  }
  
  .summary-card.amber {
    border-top: 4px solid #f59e0b;
  }
  
  .toolbar-card {
    padding: 18px 20px;
    display: flex;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    align-items: center;
  }
  
  .toolbar-left {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  
  .search-input,
  .filter-select,
  .form-input,
  .form-textarea {
    border: 1px solid #dbe3ef;
    border-radius: 14px;
    outline: none;
    transition: 0.2s ease;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
  }
  
  .search-input,
  .filter-select,
  .form-input {
    min-height: 46px;
    padding: 0 14px;
  }
  
  .search-input {
    width: 280px;
  }
  
  .filter-select {
    min-width: 180px;
  }
  
  .form-textarea {
    width: 100%;
    padding: 12px 14px;
    resize: vertical;
  }
  
  .search-input:focus,
  .filter-select:focus,
  .form-input:focus,
  .form-textarea:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
  }
  
  .results-count {
    font-size: 14px;
    color: #64748b;
    font-weight: 700;
  }
  
  .table-card {
    overflow: hidden;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .data-table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
  }
  
  .data-table thead th {
    background: #f8fafc;
    color: #475569;
    text-align: left;
    padding: 14px 16px;
    font-size: 13px;
    font-weight: 800;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .data-table tbody td {
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
    color: #0f172a;
    vertical-align: middle;
  }
  
  .data-table tbody tr:hover {
    background: #f8fafc;
  }
  
  .id-cell {
    font-weight: 800;
    color: #16a34a;
  }
  
  .primary-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .primary-cell strong {
    font-size: 14px;
    color: #0f172a;
  }
  
  .primary-cell span {
    font-size: 12px;
    color: #64748b;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 88px;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
  }
  
  .status-active {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-inactive {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .table-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .action-btn {
    border: none;
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  
  .action-btn.edit {
    background: #e0f2fe;
    color: #0369a1;
  }
  
  .action-btn.delete {
    background: #fee2e2;
    color: #b91c1c;
  }
  
  .empty-state {
    padding: 42px 16px !important;
  }
  
  .empty-wrap {
    text-align: center;
  }
  
  .empty-wrap h3 {
    margin: 0 0 8px;
    color: #0f172a;
    font-size: 18px;
  }
  
  .empty-wrap p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }
  
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 80;
  }
  
  .modal-card {
    width: 100%;
    max-width: 760px;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
    padding: 22px 24px 14px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 22px;
    color: #0f172a;
  }
  
  .modal-header p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 14px;
  }
  
  .close-btn {
    border: none;
    background: #f1f5f9;
    color: #334155;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    font-size: 24px;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 22px 24px 24px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-group label {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }
  
  .full-width {
    grid-column: 1 / -1;
  }
  
  .checkbox-group {
    padding-top: 4px;
  }
  
  .checkbox-label {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    font-weight: 700;
    color: #334155;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
    flex-wrap: wrap;
  }
  
  .btn {
    min-height: 44px;
    padding: 0 16px;
    border: none;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    transition: 0.2s ease;
  }
  
  .btn-light {
    background: #f1f5f9;
    color: #334155;
  }
  
  .btn-light:hover {
    background: #e2e8f0;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
  }
  
  .btn-primary:hover {
    filter: brightness(0.98);
  }
  
  @media (max-width: 992px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  
    .form-grid {
      grid-template-columns: 1fr;
    }
  
    .search-input,
    .filter-select {
      width: 100%;
    }
  }
  
  @media (max-width: 640px) {
    .page-header {
      padding: 18px;
    }
  
    .page-title {
      font-size: 24px;
    }
  
    .toolbar-card,
    .summary-card,
    .modal-body {
      padding-left: 16px;
      padding-right: 16px;
    }
  
    .modal-header {
      padding: 18px 16px 14px;
    }
  
    .page-actions,
    .modal-footer {
      width: 100%;
    }
  
    .page-actions .btn,
    .modal-footer .btn {
      width: 100%;
    }
  }
  </style>