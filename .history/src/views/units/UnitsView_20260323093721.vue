<template>
    <div class="units-page">
      <!-- Hero Header -->
      <section class="hero-card">
        <div class="hero-content">
          <div class="hero-copy">
            <div class="hero-badge">Owner dashboard</div>
            <h1>Units</h1>
            <p>
              Manage product measurement units for your store inventory, purchases,
              and sales workflow.
            </p>
  
            <div class="hero-meta">
              <span>Home</span>
              <span>•</span>
              <span>POS</span>
              <span>•</span>
              <span class="active">Units</span>
            </div>
          </div>
  
          <div class="hero-actions">
            <button class="btn btn-light" @click="applySearch">Refresh view</button>
            <button class="btn btn-primary" @click="openAddModal">
              <span class="btn-icon">＋</span>
              <span>Add unit</span>
            </button>
          </div>
        </div>
  
        <div class="stats-grid">
          <article class="stat-card">
            <div class="stat-icon blue">#</div>
            <div>
              <p class="stat-label">Total units</p>
              <h3>{{ units.length }}</h3>
            </div>
          </article>
  
          <article class="stat-card">
            <div class="stat-icon green">✓</div>
            <div>
              <p class="stat-label">Filtered result</p>
              <h3>{{ filteredUnits.length }}</h3>
            </div>
          </article>
  
          <article class="stat-card">
            <div class="stat-icon amber">◎</div>
            <div>
              <p class="stat-label">Selected</p>
              <h3>{{ selectedIds.length }}</h3>
            </div>
          </article>
        </div>
      </section>
  
      <!-- Filter Toolbar -->
      <section class="panel-card toolbar-card">
        <div class="toolbar-top">
          <div class="search-box">
            <span class="search-icon">⌕</span>
            <input
              v-model="search"
              type="text"
              class="search-input"
              placeholder="Search by unit name..."
              @keyup.enter="applySearch"
            />
          </div>
  
          <div class="toolbar-actions">
            <select v-model="sortBy" class="form-select">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Name A–Z</option>
              <option value="za">Name Z–A</option>
            </select>
  
            <button class="btn btn-outline" @click="resetFilters">Reset</button>
            <button class="btn btn-primary" @click="applySearch">Search</button>
          </div>
        </div>
  
        <div class="toolbar-bottom">
          <div class="bulk-left">
            <select v-model="bulkAction" class="form-select bulk-select">
              <option value="">Bulk action</option>
              <option value="delete">Delete selected</option>
            </select>
  
            <button class="btn btn-outline btn-sm" @click="handleBulkAction">Apply</button>
          </div>
  
          <div class="toolbar-summary">
            <span class="summary-chip">{{ selectedIds.length }} selected</span>
            <span class="summary-chip soft">{{ filteredUnits.length }} visible</span>
          </div>
        </div>
      </section>
  
      <!-- Table -->
      <section class="panel-card table-panel">
        <div class="panel-head">
          <div>
            <h2>Unit list</h2>
            <p>Clean and responsive unit management for owner dashboard.</p>
          </div>
        </div>
  
        <div class="table-wrap">
          <table class="units-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>ID</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Usage</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-if="filteredUnits.length === 0">
                <td colspan="6" class="empty-cell">
                  <div class="empty-state">
                    <div class="empty-icon">⌕</div>
                    <h3>No units found</h3>
                    <p>Try another keyword or add a new unit.</p>
                  </div>
                </td>
              </tr>
  
              <tr v-for="unit in filteredUnits" :key="unit.id">
                <td>
                  <input type="checkbox" :value="unit.id" v-model="selectedIds" />
                </td>
  
                <td>
                  <span class="id-badge">#{{ unit.id }}</span>
                </td>
  
                <td>
                  <div class="unit-cell">
                    <div class="unit-avatar">
                      {{ unit.name.slice(0, 1) }}
                    </div>
                    <div class="unit-copy">
                      <div class="unit-name">{{ unit.name }}</div>
                      <div class="unit-subtitle">Measurement unit</div>
                    </div>
                  </div>
                </td>
  
                <td>
                  <span class="status-badge active">Active</span>
                </td>
  
                <td>
                  <span class="usage-text">{{ getUsageLabel(unit.name) }}</span>
                </td>
  
                <td>
                  <div class="row-actions">
                    <button class="btn-action edit" @click="openEditModal(unit)">
                      Edit
                    </button>
                    <button class="btn-action delete" @click="deleteUnit(unit.id)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div class="table-footer">
          <span>Showing {{ filteredUnits.length }} unit(s)</span>
          <span>Total data: {{ units.length }}</span>
        </div>
      </section>
  
      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-shell">
          <div class="modal-side">
            <div class="modal-side__badge">
              {{ isEditMode ? 'Update unit' : 'Create unit' }}
            </div>
            <h2>{{ isEditMode ? 'Edit unit' : 'Add new unit' }}</h2>
            <p>
              Keep your inventory data consistent by managing clean measurement
              units used across products, purchases, and sales.
            </p>
  
            <div class="modal-tips">
              <div class="tip-card">
                <strong>Examples</strong>
                <span>PCS, BOX, KG, LTR, PACK, ROLL</span>
              </div>
              <div class="tip-card">
                <strong>Recommendation</strong>
                <span>Use short and standardized names for easier reporting.</span>
              </div>
            </div>
          </div>
  
          <div class="modal-main">
            <div class="modal-header">
              <div>
                <h3>{{ isEditMode ? 'Unit information' : 'New unit information' }}</h3>
                <p>Fill in the required field below.</p>
              </div>
              <button class="close-btn" @click="closeModal">×</button>
            </div>
  
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full">
                  <label>Unit name <span class="required">*</span></label>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-input"
                    placeholder="Enter unit name, e.g. PCS"
                  />
                </div>
  
                <div class="preview-card">
                  <div class="preview-label">Preview</div>
                  <div class="preview-badge">
                    {{ form.name.trim() || 'UNIT' }}
                  </div>
                </div>
              </div>
            </div>
  
            <div class="modal-footer">
              <button class="btn btn-outline" @click="closeModal">Cancel</button>
              <button class="btn btn-lightblue" @click="saveAndAddAnother">
                Save & add another
              </button>
              <button class="btn btn-primary" @click="saveUnit">Save unit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  
  type Unit = {
    id: number
    name: string
  }
  
  const units = ref<Unit[]>([
    { id: 19, name: 'LTR' },
    { id: 18, name: 'BOX' },
    { id: 17, name: 'KG' },
    { id: 16, name: 'PCS' },
    { id: 8, name: 'ROLL' },
    { id: 7, name: 'PACK' },
  ])
  
  const search = ref('')
  const appliedSearch = ref('')
  const sortBy = ref<'newest' | 'oldest' | 'az' | 'za'>('newest')
  const bulkAction = ref('')
  const selectedIds = ref<number[]>([])
  
  const showModal = ref(false)
  const isEditMode = ref(false)
  const editingId = ref<number | null>(null)
  
  const form = reactive({
    name: '',
  })
  
  const filteredUnits = computed(() => {
    let result = [...units.value]
  
    const keyword = appliedSearch.value.trim().toLowerCase()
    if (keyword) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(keyword)
      )
    }
  
    if (sortBy.value === 'newest') {
      result.sort((a, b) => b.id - a.id)
    } else if (sortBy.value === 'oldest') {
      result.sort((a, b) => a.id - b.id)
    } else if (sortBy.value === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy.value === 'za') {
      result.sort((a, b) => b.name.localeCompare(a.name))
    }
  
    return result
  })
  
  const isAllSelected = computed(() => {
    return (
      filteredUnits.value.length > 0 &&
      filteredUnits.value.every((item) => selectedIds.value.includes(item.id))
    )
  })
  
  function applySearch() {
    appliedSearch.value = search.value
    selectedIds.value = []
  }
  
  function resetFilters() {
    search.value = ''
    appliedSearch.value = ''
    sortBy.value = 'newest'
    bulkAction.value = ''
    selectedIds.value = []
  }
  
  function toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked
    selectedIds.value = checked ? filteredUnits.value.map((item) => item.id) : []
  }
  
  function resetForm() {
    form.name = ''
  }
  
  function openAddModal() {
    resetForm()
    isEditMode.value = false
    editingId.value = null
    showModal.value = true
  }
  
  function openEditModal(unit: Unit) {
    form.name = unit.name
    isEditMode.value = true
    editingId.value = unit.id
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
  }
  
  function validateForm() {
    if (!form.name.trim()) {
      alert('Unit name is required.')
      return false
    }
    return true
  }
  
  function getNextId() {
    return units.value.length > 0
      ? Math.max(...units.value.map((item) => item.id)) + 1
      : 1
  }
  
  function saveUnit() {
    if (!validateForm()) return
  
    if (isEditMode.value && editingId.value !== null) {
      const index = units.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        units.value[index] = {
          ...units.value[index],
          name: form.name.trim().toUpperCase(),
        }
      }
    } else {
      units.value.unshift({
        id: getNextId(),
        name: form.name.trim().toUpperCase(),
      })
    }
  
    closeModal()
    resetForm()
  }
  
  function saveAndAddAnother() {
    if (!validateForm()) return
  
    units.value.unshift({
      id: getNextId(),
      name: form.name.trim().toUpperCase(),
    })
  
    resetForm()
  }
  
  function deleteUnit(id: number) {
    const confirmed = window.confirm('Delete this unit?')
    if (!confirmed) return
  
    units.value = units.value.filter((item) => item.id !== id)
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
  }
  
  function handleBulkAction() {
    if (!bulkAction.value) {
      alert('Please select a bulk action first.')
      return
    }
  
    if (selectedIds.value.length === 0) {
      alert('Please select at least one unit.')
      return
    }
  
    if (bulkAction.value === 'delete') {
      const confirmed = window.confirm(
        `Delete ${selectedIds.value.length} selected unit(s)?`
      )
      if (!confirmed) return
  
      units.value = units.value.filter((item) => !selectedIds.value.includes(item.id))
      selectedIds.value = []
      bulkAction.value = ''
    }
  }
  
  function getUsageLabel(name: string) {
    const key = name.toUpperCase()
  
    if (['KG', 'GRAM', 'G'].includes(key)) return 'Weight based'
    if (['LTR', 'ML'].includes(key)) return 'Liquid based'
    if (['BOX', 'PACK', 'ROLL'].includes(key)) return 'Package based'
    return 'General unit'
  }
  </script>
  
  <style scoped>
  .units-page {
    min-height: 100%;
    padding: 24px;
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 22%),
      radial-gradient(circle at top right, rgba(16, 185, 129, 0.08), transparent 20%),
      #f6f8fc;
  }
  
  .hero-card {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #0f172a 0%, #172554 45%, #1d4ed8 100%);
    border-radius: 28px;
    padding: 28px;
    color: #fff;
    box-shadow: 0 22px 60px rgba(15, 23, 42, 0.18);
    margin-bottom: 20px;
  }
  
  .hero-card::before {
    content: '';
    position: absolute;
    right: -80px;
    top: -80px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
  }
  
  .hero-card::after {
    content: '';
    position: absolute;
    right: 80px;
    bottom: -70px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
  }
  
  .hero-copy {
    max-width: 720px;
  }
  
  .hero-badge {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    font-size: 0.88rem;
    font-weight: 700;
    margin-bottom: 14px;
  }
  
  .hero-copy h1 {
    margin: 0;
    font-size: 2.25rem;
    font-weight: 800;
    line-height: 1.1;
  }
  
  .hero-copy p {
    margin: 12px 0 0;
    max-width: 640px;
    color: rgba(255, 255, 255, 0.84);
    font-size: 1rem;
    line-height: 1.7;
  }
  
  .hero-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 18px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.95rem;
  }
  
  .hero-meta .active {
    color: #ffffff;
    font-weight: 700;
  }
  
  .hero-actions {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  
  .stats-grid {
    position: relative;
    z-index: 1;
    margin-top: 22px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(12px);
  }
  
  .stat-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-weight: 800;
    background: rgba(255, 255, 255, 0.16);
  }
  
  .stat-icon.blue { color: #bfdbfe; }
  .stat-icon.green { color: #bbf7d0; }
  .stat-icon.amber { color: #fde68a; }
  
  .stat-label {
    margin: 0 0 4px;
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.75);
  }
  
  .stat-card h3 {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 800;
    color: #fff;
  }
  
  .panel-card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 24px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(10px);
  }
  
  .toolbar-card {
    padding: 18px;
    margin-bottom: 20px;
  }
  
  .toolbar-top,
  .toolbar-bottom {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .toolbar-bottom {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #eef2f7;
  }
  
  .search-box {
    position: relative;
    flex: 1;
    min-width: 260px;
  }
  
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 1rem;
  }
  
  .search-input,
  .form-input,
  .form-select {
    width: 100%;
    min-height: 48px;
    border: 1px solid #dbe2ea;
    border-radius: 14px;
    background: #fff;
    padding: 0 14px;
    font-size: 0.96rem;
    color: #0f172a;
    outline: none;
    transition: 0.2s ease;
  }
  
  .search-input {
    padding-left: 40px;
  }
  
  .search-input:focus,
  .form-input:focus,
  .form-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  }
  
  .toolbar-actions,
  .bulk-left,
  .toolbar-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .bulk-select {
    min-width: 180px;
  }
  
  .summary-chip {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 0.88rem;
    font-weight: 700;
  }
  
  .summary-chip.soft {
    background: #eef2ff;
    color: #4338ca;
  }
  
  .btn {
    min-height: 46px;
    border: none;
    border-radius: 14px;
    padding: 0 18px;
    font-size: 0.96rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: 0.2s ease;
  }
  
  .btn-sm {
    min-height: 42px;
    padding: 0 16px;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff;
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
  }
  
  .btn-primary:hover {
    transform: translateY(-1px);
  }
  
  .btn-light {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.16);
  }
  
  .btn-outline {
    background: #fff;
    color: #334155;
    border: 1px solid #dbe2ea;
  }
  
  .btn-lightblue {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  
  .btn-icon {
    font-size: 1.05rem;
  }
  
  .table-panel {
    overflow: hidden;
  }
  
  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    padding: 22px 22px 16px;
    border-bottom: 1px solid #eef2f7;
  }
  
  .panel-head h2 {
    margin: 0;
    font-size: 1.18rem;
    color: #0f172a;
  }
  
  .panel-head p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 0.94rem;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .units-table {
    width: 100%;
    min-width: 880px;
    border-collapse: collapse;
  }
  
  .units-table thead th {
    text-align: left;
    padding: 16px 18px;
    font-size: 0.86rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #64748b;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .units-table tbody td {
    padding: 16px 18px;
    font-size: 0.95rem;
    color: #0f172a;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
  }
  
  .units-table tbody tr:hover {
    background: #f8fbff;
  }
  
  .checkbox-col {
    width: 58px;
  }
  
  .action-col {
    width: 180px;
  }
  
  .id-badge {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 800;
    font-size: 0.88rem;
  }
  
  .unit-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .unit-avatar {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #dbeafe, #eff6ff);
    color: #1d4ed8;
    font-weight: 800;
  }
  
  .unit-name {
    font-weight: 800;
    color: #0f172a;
  }
  
  .unit-subtitle {
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 3px;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 0.83rem;
    font-weight: 800;
  }
  
  .status-badge.active {
    background: #dcfce7;
    color: #15803d;
  }
  
  .usage-text {
    color: #334155;
    font-weight: 600;
  }
  
  .row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .btn-action {
    min-height: 36px;
    padding: 0 12px;
    border: none;
    border-radius: 12px;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
  }
  
  .btn-action.edit {
    background: #eff6ff;
    color: #1d4ed8;
  }
  
  .btn-action.delete {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .table-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 16px 20px;
    color: #64748b;
    font-size: 0.92rem;
    font-weight: 700;
  }
  
  .empty-cell {
    padding: 42px 20px !important;
  }
  
  .empty-state {
    text-align: center;
  }
  
  .empty-icon {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    margin: 0 auto 12px;
    display: grid;
    place-items: center;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 1.25rem;
    font-weight: 800;
  }
  
  .empty-state h3 {
    margin: 0;
    color: #0f172a;
  }
  
  .empty-state p {
    margin: 8px 0 0;
    color: #64748b;
  }
  
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .modal-shell {
    width: 100%;
    max-width: 1100px;
    min-height: 540px;
    display: grid;
    grid-template-columns: 360px 1fr;
    background: #fff;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
  }
  
  .modal-side {
    padding: 28px;
    background: linear-gradient(180deg, #0f172a, #1e3a8a);
    color: #fff;
  }
  
  .modal-side__badge {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    font-size: 0.82rem;
    font-weight: 700;
    margin-bottom: 16px;
  }
  
  .modal-side h2 {
    margin: 0;
    font-size: 1.8rem;
    line-height: 1.2;
  }
  
  .modal-side p {
    margin: 14px 0 0;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.7;
  }
  
  .modal-tips {
    margin-top: 24px;
    display: grid;
    gap: 12px;
  }
  
  .tip-card {
    padding: 16px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .tip-card strong {
    display: block;
    margin-bottom: 6px;
  }
  
  .tip-card span {
    color: rgba(255, 255, 255, 0.82);
    font-size: 0.92rem;
    line-height: 1.6;
  }
  
  .modal-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    padding: 24px 24px 16px;
    border-bottom: 1px solid #eef2f7;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.3rem;
    color: #0f172a;
  }
  
  .modal-header p {
    margin: 6px 0 0;
    color: #64748b;
  }
  
  .close-btn {
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 14px;
    background: #f1f5f9;
    color: #0f172a;
    font-size: 1.4rem;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 24px;
    flex: 1;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 18px;
    align-items: start;
  }
  
  .form-group label {
    display: inline-block;
    margin-bottom: 10px;
    color: #0f172a;
    font-size: 0.94rem;
    font-weight: 700;
  }
  
  .form-group.full {
    grid-column: 1 / 2;
  }
  
  .preview-card {
    border: 1px solid #e2e8f0;
    border-radius: 22px;
    padding: 18px;
    background: linear-gradient(180deg, #f8fbff, #ffffff);
  }
  
  .preview-label {
    font-size: 0.86rem;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 14px;
  }
  
  .preview-badge {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 16px;
    border-radius: 14px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 1rem;
    font-weight: 800;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
    padding: 16px 24px 24px;
    border-top: 1px solid #eef2f7;
  }
  
  .required {
    color: #ef4444;
  }
  
  @media (max-width: 1100px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  
    .modal-shell {
      grid-template-columns: 1fr;
    }
  
    .modal-side {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    .units-page {
      padding: 16px;
    }
  
    .hero-card {
      padding: 20px;
      border-radius: 22px;
    }
  
    .hero-copy h1 {
      font-size: 1.85rem;
    }
  
    .hero-actions,
    .toolbar-actions,
    .bulk-left,
    .toolbar-summary,
    .modal-footer {
      width: 100%;
    }
  
    .btn,
    .toolbar-actions .form-select {
      width: 100%;
    }
  
    .form-grid {
      grid-template-columns: 1fr;
    }
  
    .table-footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
  </style>