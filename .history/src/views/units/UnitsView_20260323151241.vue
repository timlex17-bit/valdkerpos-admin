<template>
    <div class="page">
      <!-- Header -->
      <section class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">Units</h1>
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Pos</span>
            <span>›</span>
            <span class="active">Units</span>
          </div>
        </div>
  
        <button class="btn btn-success" @click="openAddModal">
          <span>＋</span>
          <span>Add unit</span>
        </button>
      </section>
  
      <!-- Toolbar -->
      <section class="toolbar-card">
        <div class="toolbar-grid">

          <div class="search-box toolbar-item toolbar-search">
            <span class="search-icon">⌕</span>
            <input
              v-model="search"
              type="text"
              placeholder="Search unit..."
            />
          </div>

          <div class="toolbar-item">
            <button class="btn btn-light" @click="resetFilters">
              Reset
            </button>
          </div>

          <div class="toolbar-item toolbar-info">
            <span class="selection-text">
              {{ filteredUnits.length }} units
            </span>
          </div>

        </div>
      </section>
  
      <!-- Table -->
      <section class="table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Unit name</th>
                <th>Description</th>
                <th>Created at</th>
                <th>Status</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="filteredUnits.length === 0">
                <td colspan="6" class="empty-cell">No units found.</td>
              </tr>

              <tr v-for="unit in filteredUnits" :key="unit.id">
                <td class="id-text">{{ unit.id }}</td>
                <td class="name-text">{{ unit.name }}</td>
                <td>{{ unit.description || '-' }}</td>
                <td>{{ formatDate(unit.createdAt) }}</td>
                <td>
                  <span
                    class="status-badge"
                    :class="{
                      active: unit.status === 'Active',
                      inactive: unit.status === 'Inactive',
                    }"
                  >
                    {{ unit.status }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn-action edit" @click="openEditModal(unit)">Edit</button>
                    <button class="btn-action delete" @click="deleteUnit(unit.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div class="table-footer">
          {{ filteredUnits.length }} units
        </div>
      </section>
  
      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div>
              <h2>{{ isEditMode ? 'Edit unit' : 'Add unit' }}</h2>
              <p>
                {{
                  isEditMode
                    ? 'Update unit information'
                    : 'Create a new unit'
                }}
              </p>
            </div>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
  
          <div class="modal-body">
            <div class="modal-layout">
              <div class="form-card">
                <div class="form-row">
                  <label>Unit name <span class="required">*</span></label>
                  <div class="form-control">
                    <input
                      v-model="form.name"
                      type="text"
                      class="form-input"
                      placeholder="Enter unit name"
                    />
                  </div>
                </div>
  
                <div class="form-row form-row--top">
                  <label>Description</label>
                  <div class="form-control">
                    <textarea
                      v-model="form.description"
                      class="form-textarea"
                      rows="6"
                      placeholder="Write description here..."
                    />
                  </div>
                </div>
  
                <div class="form-row">
                  <label>Status <span class="required">*</span></label>
                  <div class="form-control">
                    <select v-model="form.status" class="form-select">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
  
              <div class="side-actions">
                <button class="btn btn-success full-btn" @click="saveUnit">Save</button>
                <button class="btn btn-info full-btn" @click="saveAndAddAnother">
                  Save and add another
                </button>
                <button class="btn btn-info full-btn" @click="saveAndContinueEditing">
                  Save and continue editing
                </button>
              </div>
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
  description: string
  createdAt: string
  status: 'Active' | 'Inactive'
}

const units = ref<Unit[]>([
  {
    id: 3,
    name: 'PCS',
    description: 'Piece unit for general product items.',
    createdAt: '2026-03-20T10:00:00',
    status: 'Active',
  },
  {
    id: 2,
    name: 'BOX',
    description: 'Box packaging unit.',
    createdAt: '2026-03-18T09:20:00',
    status: 'Active',
  },
  {
    id: 1,
    name: 'KG',
    description: 'Weight unit in kilogram.',
    createdAt: '2026-03-15T08:10:00',
    status: 'Inactive',
  },
])

const search = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  description: '',
  status: 'Active' as 'Active' | 'Inactive',
})

const filteredUnits = computed(() => {
  let results = [...units.value]

  const keyword = search.value.trim().toLowerCase()
  if (keyword) {
    results = results.filter((item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
    )
  }

  results.sort((a, b) => b.id - a.id)
  return results
})

function resetFilters() {
  search.value = ''
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.status = 'Active'
}

function openAddModal() {
  resetForm()
  isEditMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEditModal(unit: Unit) {
  form.name = unit.name
  form.description = unit.description
  form.status = unit.status
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
        description: form.description.trim(),
        status: form.status,
      }
    }
  } else {
    units.value.unshift({
      id: getNextId(),
      name: form.name.trim().toUpperCase(),
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
      status: form.status,
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
    description: form.description.trim(),
    createdAt: new Date().toISOString(),
    status: form.status,
  })

  resetForm()
}

function saveAndContinueEditing() {
  if (!validateForm()) return

  if (isEditMode.value && editingId.value !== null) {
    const index = units.value.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      units.value[index] = {
        ...units.value[index],
        name: form.name.trim().toUpperCase(),
        description: form.description.trim(),
        status: form.status,
      }
    }
  } else {
    const nextId = getNextId()
    units.value.unshift({
      id: nextId,
      name: form.name.trim().toUpperCase(),
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
      status: form.status,
    })
    editingId.value = nextId
    isEditMode.value = true
  }
}

function deleteUnit(id: number) {
  const confirmed = window.confirm('Delete this unit?')
  if (!confirmed) return

  units.value = units.value.filter((item) => item.id !== id)
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
</script>
  
<style scoped>

.page{
min-height:100%;
padding:24px;
background:#f4f6f9;
}

/* HEADER */

.page-header{
display:flex;
align-items:center;
justify-content:space-between;
gap:16px;
background:#fff;
border:1px solid #e5e7eb;
border-radius:18px;
padding:20px 22px;
margin-bottom:20px;
flex-wrap:wrap;
}

.page-header__left{
display:flex;
align-items:center;
gap:18px;
flex-wrap:wrap;
}

.page-title{
margin:0;
font-size:2rem;
font-weight:700;
color:#1f2937;
padding-right:18px;
border-right:1px solid #e5e7eb;
}

.breadcrumb{
display:flex;
align-items:center;
gap:10px;
flex-wrap:wrap;
font-size:1rem;
color:#6b7280;
}

.breadcrumb .active{
color:#1677ff;
font-weight:600;
}

/* CARDS */

.toolbar-card,
.table-card{
background:#fff;
border:1px solid #e5e7eb;
border-radius:18px;
box-shadow:0 8px 24px rgba(15,23,42,0.05);
}

.toolbar-card{
padding:20px;
margin-bottom:20px;
}

/* TOOLBAR */

.toolbar-grid{
display:grid;
grid-template-columns:minmax(280px,2fr) auto auto;
gap:12px;
align-items:center;
}

.toolbar-item{
min-width:0;
}

.search-box{
position:relative;
}

.search-box input{
width:100%;
height:48px;
border-radius:12px;
border:1px solid #dbe3ef;
background:#f9fbff;
padding:0 16px 0 44px;
font-size:14px;
outline:none;
transition:.2s;
}

.search-box input:focus{
border-color:#3b82f6;
background:#fff;
box-shadow:0 0 0 4px rgba(59,130,246,.12);
}

.search-icon{
position:absolute;
left:16px;
top:50%;
transform:translateY(-50%);
color:#94a3b8;
font-size:15px;
}

.toolbar-info{
display:flex;
justify-content:flex-end;
align-items:center;
}

.selection-text{
background:#f1f5f9;
padding:10px 14px;
border-radius:12px;
font-size:.9rem;
font-weight:700;
color:#334155;
}

/* FORM */

.form-input,
.form-select,
.form-textarea{
width:100%;
border:1px solid #d1d5db;
border-radius:10px;
padding:0 14px;
font-size:.98rem;
color:#111827;
background:#fff;
outline:none;
transition:.2s;
}

.form-input,
.form-select{
min-height:48px;
}

.form-textarea{
min-height:160px;
padding-top:12px;
padding-bottom:12px;
resize:vertical;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus{
border-color:#2563eb;
box-shadow:0 0 0 4px rgba(37,99,235,.1);
}

/* BUTTON */

.btn{
min-height:46px;
border:none;
border-radius:10px;
padding:0 18px;
font-size:.95rem;
font-weight:700;
display:inline-flex;
align-items:center;
justify-content:center;
gap:8px;
cursor:pointer;
transition:.2s;
}

.btn-sm{
min-height:40px;
padding:0 14px;
}

.btn-primary{
background:#1677ff;
color:#fff;
}

.btn-primary:hover{
background:#0f67ea;
}

.btn-light{
background:#f3f4f6;
color:#374151;
}

.btn-light:hover{
background:#e5e7eb;
}

/* TABLE */

.table-wrap{
width:100%;
overflow-x:auto;
}

.data-table{
width:100%;
border-collapse:collapse;
min-width:900px;
}

.data-table thead th{
text-align:left;
padding:18px 16px;
font-size:.95rem;
font-weight:800;
color:#1677ff;
border-bottom:1px solid #e5e7eb;
}

.data-table tbody td{
padding:16px;
font-size:.95rem;
color:#1f2937;
border-bottom:1px solid #eef2f7;
vertical-align:middle;
}

.data-table tbody tr:hover{
background:#f9fbff;
}

.action-col{
width:160px;
}

.id-text{
color:#1677ff;
font-weight:800;
}

.name-text{
font-weight:700;
}

/* ACTION BUTTON */

.actions{
display:flex;
gap:8px;
flex-wrap:wrap;
}

.btn-action{
min-height:34px;
border:none;
border-radius:10px;
padding:0 12px;
font-size:.85rem;
font-weight:700;
cursor:pointer;
}

.btn-action.edit{
background:rgba(22,119,255,.12);
color:#1677ff;
}

.btn-action.delete{
background:rgba(220,38,38,.12);
color:#dc2626;
}

/* STATUS */

.status-badge{
display:inline-flex;
align-items:center;
min-height:30px;
padding:0 12px;
border-radius:999px;
font-size:.8rem;
font-weight:700;
}

.status-badge.active{
background:rgba(34,197,94,.12);
color:#15803d;
}

.status-badge.inactive{
background:rgba(107,114,128,.12);
color:#4b5563;
}

/* TABLE FOOTER */

.table-footer{
padding:18px 16px;
font-size:.95rem;
font-weight:700;
color:#374151;
}

.empty-cell{
text-align:center;
color:#6b7280;
padding:30px!important;
}

/* MODAL */

.modal-overlay{
position:fixed;
inset:0;
background:rgba(15,23,42,.45);
backdrop-filter:blur(4px);
z-index:999;
display:flex;
align-items:center;
justify-content:center;
padding:20px;
}

.modal-container{
width:100%;
max-width:1100px;
background:#fff;
border-radius:22px;
overflow:hidden;
box-shadow:0 20px 60px rgba(15,23,42,.24);
}

.modal-header{
display:flex;
align-items:flex-start;
justify-content:space-between;
gap:16px;
padding:22px 24px 16px;
border-bottom:1px solid #eef2f7;
}

.modal-header h2{
margin:0;
font-size:1.4rem;
color:#111827;
}

.modal-header p{
margin:6px 0 0;
color:#6b7280;
}

.close-btn{
width:40px;
height:40px;
border:none;
border-radius:12px;
background:#f3f4f6;
font-size:1.4rem;
cursor:pointer;
}

.modal-body{
padding:24px;
}

.modal-layout{
display:grid;
grid-template-columns:1fr 300px;
gap:18px;
align-items:start;
}

.form-card{
background:#fff;
border:1px solid #e5e7eb;
border-radius:16px;
padding:24px;
}

.form-row{
display:grid;
grid-template-columns:220px 1fr;
gap:18px;
align-items:center;
margin-bottom:20px;
}

.form-row:last-child{
margin-bottom:0;
}

.form-row label{
font-size:.95rem;
font-weight:700;
color:#1f2937;
}

.side-actions{
display:flex;
flex-direction:column;
gap:14px;
}

.full-btn{
width:100%;
min-height:48px;
}

.required{
color:#ef4444;
}

/* RESPONSIVE */

@media (max-width:992px){

.modal-layout{
grid-template-columns:1fr;
}

.side-actions{
order:-1;
}

}

@media (max-width:768px){

.page{
padding:16px;
}

.page-title{
font-size:1.6rem;
padding-right:0;
border-right:none;
}

.page-header__left{
flex-direction:column;
align-items:flex-start;
gap:10px;
}

.toolbar-grid{
grid-template-columns:1fr;
}

.toolbar-item{
width:100%;
}

.btn{
width:100%;
}

.form-row{
grid-template-columns:1fr;
gap:8px;
}

}

</style>