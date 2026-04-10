<template>
    <div class="transfer-page">
      <section class="page-header">
        <div>
          <h1 class="page-title">{{ t('transferStocksPage.title') }}</h1>
          <p class="page-subtitle">
            {{ t('transferStocksPage.subtitle') }}
          </p>
  
          <div class="breadcrumb">
            <span>{{ t('transferStocksPage.breadcrumbHome') }}</span>
            <span>›</span>
            <span>{{ t('transferStocksPage.breadcrumbInventory') }}</span>
            <span>›</span>
            <span class="active">{{ t('transferStocksPage.title') }}</span>
          </div>
        </div>
  
        <div class="page-actions">
          <button class="btn btn-light" @click="resetFilters">
            {{ t('transferStocksPage.resetButton') }}
          </button>
          <button class="btn btn-primary" @click="openAddModal">
            + {{ t('transferStocksPage.addTransfer') }}
          </button>
        </div>
      </section>
  
      <section class="summary-grid">
        <article class="summary-card emerald">
          <p>{{ t('transferStocksPage.totalTransfers') }}</p>
          <h3>{{ transfers.length }}</h3>
          <span>{{ t('transferStocksPage.summaryTransfersText') }}</span>
        </article>
  
        <article class="summary-card blue">
          <p>{{ t('transferStocksPage.totalQuantity') }}</p>
          <h3>{{ totalQuantity }}</h3>
          <span>{{ t('transferStocksPage.summaryQuantityText') }}</span>
        </article>
  
        <article class="summary-card amber">
          <p>{{ t('transferStocksPage.completedTransfers') }}</p>
          <h3>{{ completedCount }}</h3>
          <span>{{ t('transferStocksPage.summaryCompletedText') }}</span>
        </article>
      </section>
  
      <section class="toolbar-card">
        <div class="toolbar-left">
          <input
            v-model="search"
            type="text"
            class="search-input"
            :placeholder="t('transferStocksPage.searchPlaceholder')"
          />
  
          <select v-model="statusFilter" class="filter-select">
            <option value="">{{ t('transferStocksPage.allStatus') }}</option>
            <option value="draft">{{ t('transferStocksPage.statusDraft') }}</option>
            <option value="completed">{{ t('transferStocksPage.statusCompleted') }}</option>
            <option value="cancelled">{{ t('transferStocksPage.statusCancelled') }}</option>
          </select>
        </div>
  
        <div class="toolbar-right">
          <span class="results-count">
            {{ t('transferStocksPage.resultsCount', { count: filteredTransfers.length }) }}
          </span>
        </div>
      </section>
  
      <section class="table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ t('transferStocksPage.productLabel') }}</th>
                <th>{{ t('transferStocksPage.fromWarehouseLabel') }}</th>
                <th>{{ t('transferStocksPage.toWarehouseLabel') }}</th>
                <th>{{ t('transferStocksPage.quantityLabel') }}</th>
                <th>{{ t('transferStocksPage.statusLabel') }}</th>
                <th>{{ t('transferStocksPage.createdAtLabel') }}</th>
                <th>{{ t('transferStocksPage.actionsLabel') }}</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredTransfers.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-wrap">
                    <h3>{{ t('transferStocksPage.emptyTitle') }}</h3>
                    <p>{{ t('transferStocksPage.emptySubtitle') }}</p>
                  </div>
                </td>
              </tr>
  
              <tr v-for="item in filteredTransfers" :key="item.id">
                <td class="id-cell">#{{ item.id }}</td>
                <td>
                  <div class="primary-cell">
                    <strong>{{ item.product }}</strong>
                    <span v-if="item.note">{{ item.note }}</span>
                  </div>
                </td>
                <td>{{ item.from_warehouse }}</td>
                <td>{{ item.to_warehouse }}</td>
                <td>{{ item.quantity }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td>{{ formatDate(item.created_at) }}</td>
                <td>
                  <div class="table-actions">
                    <button class="action-btn edit" @click="openEditModal(item)">
                      {{ t('transferStocksPage.editButton') }}
                    </button>
                    <button class="action-btn delete" @click="removeTransfer(item.id)">
                      {{ t('transferStocksPage.deleteButton') }}
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
                {{
                  isEditing
                    ? t('transferStocksPage.editTransfer')
                    : t('transferStocksPage.addTransfer')
                }}
              </h2>
              <p>{{ t('transferStocksPage.formSubtitle') }}</p>
            </div>
  
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <form class="modal-body" @submit.prevent="saveTransfer">
            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('transferStocksPage.productLabel') }}</label>
                <input
                  v-model="form.product"
                  type="text"
                  class="form-input"
                  :placeholder="t('transferStocksPage.productPlaceholder')"
                />
              </div>
  
              <div class="form-group">
                <label>{{ t('transferStocksPage.quantityLabel') }}</label>
                <input
                  v-model.number="form.quantity"
                  type="number"
                  min="1"
                  class="form-input"
                  :placeholder="t('transferStocksPage.quantityPlaceholder')"
                />
              </div>
  
              <div class="form-group">
                <label>{{ t('transferStocksPage.fromWarehouseLabel') }}</label>
                <select v-model="form.from_warehouse" class="form-input">
                  <option value="">{{ t('transferStocksPage.selectWarehouse') }}</option>
                  <option v-for="warehouse in warehouseOptions" :key="warehouse" :value="warehouse">
                    {{ warehouse }}
                  </option>
                </select>
              </div>
  
              <div class="form-group">
                <label>{{ t('transferStocksPage.toWarehouseLabel') }}</label>
                <select v-model="form.to_warehouse" class="form-input">
                  <option value="">{{ t('transferStocksPage.selectWarehouse') }}</option>
                  <option v-for="warehouse in warehouseOptions" :key="warehouse" :value="warehouse">
                    {{ warehouse }}
                  </option>
                </select>
              </div>
  
              <div class="form-group">
                <label>{{ t('transferStocksPage.statusLabel') }}</label>
                <select v-model="form.status" class="form-input">
                  <option value="draft">{{ t('transferStocksPage.statusDraft') }}</option>
                  <option value="completed">{{ t('transferStocksPage.statusCompleted') }}</option>
                  <option value="cancelled">{{ t('transferStocksPage.statusCancelled') }}</option>
                </select>
              </div>
  
              <div class="form-group full-width">
                <label>{{ t('transferStocksPage.noteLabel') }}</label>
                <textarea
                  v-model="form.note"
                  class="form-textarea"
                  rows="4"
                  :placeholder="t('transferStocksPage.notePlaceholder')"
                />
              </div>
            </div>
  
            <div class="modal-footer">
              <button type="button" class="btn btn-light" @click="closeModal">
                {{ t('transferStocksPage.cancelButton') }}
              </button>
              <button type="submit" class="btn btn-primary">
                {{
                  isEditing
                    ? t('transferStocksPage.updateButton')
                    : t('transferStocksPage.saveButton')
                }}
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
  
  type TransferStatus = 'draft' | 'completed' | 'cancelled'
  
  type TransferStock = {
    id: number
    product: string
    from_warehouse: string
    to_warehouse: string
    quantity: number
    status: TransferStatus
    note: string
    created_at: string
  }
  
  const { t, locale } = useI18n()
  
  const warehouseOptions = ref<string[]>([
    'Main Warehouse',
    'Kitchen Warehouse',
    'Old Storage',
  ])
  
  const search = ref('')
  const statusFilter = ref('')
  const showModal = ref(false)
  const isEditing = ref(false)
  const editingId = ref<number | null>(null)
  
  const transfers = ref<TransferStock[]>([
    {
      id: 1,
      product: 'Coca Cola 1L',
      from_warehouse: 'Main Warehouse',
      to_warehouse: 'Kitchen Warehouse',
      quantity: 12,
      status: 'completed',
      note: 'Daily stock movement',
      created_at: '2026-03-20T08:30:00',
    },
    {
      id: 2,
      product: 'Pizza Cheese',
      from_warehouse: 'Main Warehouse',
      to_warehouse: 'Kitchen Warehouse',
      quantity: 8,
      status: 'draft',
      note: 'Waiting for approval',
      created_at: '2026-03-22T11:00:00',
    },
    {
      id: 3,
      product: 'Paper Cup',
      from_warehouse: 'Old Storage',
      to_warehouse: 'Main Warehouse',
      quantity: 30,
      status: 'cancelled',
      note: 'Source stock unavailable',
      created_at: '2026-03-25T15:20:00',
    },
  ])
  
  const form = reactive<{
    product: string
    from_warehouse: string
    to_warehouse: string
    quantity: number
    status: TransferStatus
    note: string
  }>({
    product: '',
    from_warehouse: '',
    to_warehouse: '',
    quantity: 1,
    status: 'draft',
    note: '',
  })
  
  const filteredTransfers = computed(() => {
    return transfers.value.filter((item) => {
      const q = search.value.toLowerCase()
  
      const matchesSearch =
        item.product.toLowerCase().includes(q) ||
        item.from_warehouse.toLowerCase().includes(q) ||
        item.to_warehouse.toLowerCase().includes(q)
  
      const matchesStatus = statusFilter.value ? item.status === statusFilter.value : true
  
      return matchesSearch && matchesStatus
    })
  })
  
  const totalQuantity = computed(() =>
    transfers.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  )
  
  const completedCount = computed(
    () => transfers.value.filter((item) => item.status === 'completed').length,
  )
  
  const resetForm = () => {
    form.product = ''
    form.from_warehouse = ''
    form.to_warehouse = ''
    form.quantity = 1
    form.status = 'draft'
    form.note = ''
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
  
  const openEditModal = (item: TransferStock) => {
    form.product = item.product
    form.from_warehouse = item.from_warehouse
    form.to_warehouse = item.to_warehouse
    form.quantity = item.quantity
    form.status = item.status
    form.note = item.note
  
    isEditing.value = true
    editingId.value = item.id
    showModal.value = true
  }
  
  const closeModal = () => {
    showModal.value = false
  }
  
  const saveTransfer = () => {
    if (!form.product.trim()) {
      alert(t('transferStocksPage.validationProductRequired'))
      return
    }
  
    if (!form.from_warehouse) {
      alert(t('transferStocksPage.validationFromWarehouseRequired'))
      return
    }
  
    if (!form.to_warehouse) {
      alert(t('transferStocksPage.validationToWarehouseRequired'))
      return
    }
  
    if (form.from_warehouse === form.to_warehouse) {
      alert(t('transferStocksPage.validationWarehouseDifferent'))
      return
    }
  
    if (form.quantity <= 0) {
      alert(t('transferStocksPage.validationQuantityInvalid'))
      return
    }
  
    if (isEditing.value && editingId.value !== null) {
      const index = transfers.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        transfers.value[index] = {
          ...transfers.value[index],
          product: form.product,
          from_warehouse: form.from_warehouse,
          to_warehouse: form.to_warehouse,
          quantity: form.quantity,
          status: form.status,
          note: form.note,
        }
      }
    } else {
      transfers.value.unshift({
        id: Date.now(),
        product: form.product,
        from_warehouse: form.from_warehouse,
        to_warehouse: form.to_warehouse,
        quantity: form.quantity,
        status: form.status,
        note: form.note,
        created_at: new Date().toISOString(),
      })
    }
  
    closeModal()
    resetForm()
  }
  
  const removeTransfer = (id: number) => {
    const confirmed = window.confirm(t('transferStocksPage.deleteConfirm'))
    if (!confirmed) return
    transfers.value = transfers.value.filter((item) => item.id !== id)
  }
  
  const statusLabel = (status: TransferStatus) => {
    if (status === 'draft') return t('transferStocksPage.statusDraft')
    if (status === 'completed') return t('transferStocksPage.statusCompleted')
    return t('transferStocksPage.statusCancelled')
  }
  
  const statusClass = (status: TransferStatus) => {
    return {
      'status-draft': status === 'draft',
      'status-completed': status === 'completed',
      'status-cancelled': status === 'cancelled',
    }
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
  .transfer-page {
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
    min-width: 95px;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
  }
  
  .status-draft {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status-completed {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-cancelled {
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