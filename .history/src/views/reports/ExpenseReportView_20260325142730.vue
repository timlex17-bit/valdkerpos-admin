<template>
    <div class="report-page">
      <section class="page-header">
        <div>
          <h1 class="page-title">Expense Report</h1>
          <p class="page-subtitle">
            Review expense entries, operational notes, daily totals, and monthly spending activity.
          </p>
  
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Reports</span>
            <span>›</span>
            <span class="active">Expense Report</span>
          </div>
        </div>
  
        <div class="page-actions">
          <button class="btn btn-success" @click="showFlash('Expense Excel export started.')">
            Export Excel
          </button>
          <button class="btn btn-primary" @click="showFlash('Expense PDF export started.')">
            Export PDF
          </button>
        </div>
      </section>
  
      <section class="stats-grid">
        <article class="stat-card red">
          <div class="stat-icon">💸</div>
          <div>
            <p class="stat-label">Total Expense</p>
            <h3 class="stat-value">{{ currency(totalExpense) }}</h3>
            <p class="stat-meta">Current filtered results</p>
          </div>
        </article>
  
        <article class="stat-card blue">
          <div class="stat-icon">📋</div>
          <div>
            <p class="stat-label">Entries</p>
            <h3 class="stat-value">{{ filteredRows.length }}</h3>
            <p class="stat-meta">Expense records count</p>
          </div>
        </article>
  
        <article class="stat-card emerald">
          <div class="stat-icon">📅</div>
          <div>
            <p class="stat-label">Latest Expense</p>
            <h3 class="stat-value">{{ latestExpenseDate }}</h3>
            <p class="stat-meta">Most recent expense date</p>
          </div>
        </article>
  
        <article class="stat-card amber">
          <div class="stat-icon">📝</div>
          <div>
            <p class="stat-label">Top Note</p>
            <h3 class="stat-value note-preview">{{ topNote }}</h3>
            <p class="stat-meta">Most visible description</p>
          </div>
        </article>
      </section>
  
      <section class="toolbar-card">
        <div class="toolbar-left">
          <div class="toolbar-field">
            <label>Month</label>
            <input v-model="selectedMonth" type="month" class="form-input" />
          </div>
  
          <div class="toolbar-field search-field">
            <label>Search</label>
            <input
              v-model="search"
              type="text"
              class="form-input"
              placeholder="Search name or note..."
            />
          </div>
        </div>
  
        <div class="toolbar-right">
          <button class="btn btn-primary" @click="applyFilter">Apply Filter</button>
          <button class="btn btn-light" @click="resetFilter">Reset</button>
        </div>
      </section>
  
      <section class="table-card">
        <div class="card-header">
          <div>
            <h2>Expense list</h2>
            <p>Operational and daily spending entries for the selected month.</p>
          </div>
        </div>
  
        <div class="table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Note</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRows.length === 0">
                <td colspan="5" class="empty-state">No expense data found.</td>
              </tr>
  
              <tr v-for="item in filteredRows" :key="item.id">
                <td>
                  <div class="primary-cell">{{ item.name }}</div>
                </td>
                <td>{{ item.note }}</td>
                <td class="amount-cell">{{ currency(item.amount) }}</td>
                <td>{{ item.date }}</td>
                <td>{{ item.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
  
      <transition name="fade">
        <div v-if="flashMessage" class="flash-message">
          {{ flashMessage }}
        </div>
      </transition>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue'
  
  type ExpenseRow = {
    id: number
    name: string
    note: string
    amount: number
    date: string
    time: string
    month: string
  }
  
  const flashMessage = ref('')
  const selectedMonth = ref('2026-03')
  const appliedMonth = ref('2026-03')
  const search = ref('')
  
  const rows = ref<ExpenseRow[]>([
    { id: 1, name: 'Lem Cola', note: 'Resuse', amount: 1, date: 'March 22, 2026', time: '11:39 p.m.', month: '2026-03' },
    { id: 2, name: 'Tanggo', note: 'Qwerty', amount: 10, date: 'March 22, 2026', time: '3:24 a.m.', month: '2026-03' },
    { id: 3, name: 'Mina Delivery', note: 'Order Becoro', amount: 12.5, date: 'March 18, 2026', time: '10:16 p.m.', month: '2026-03' },
    { id: 4, name: 'Mina Trucks', note: 'Transfer stock to baucau', amount: 150, date: 'March 16, 2026', time: '12:51 p.m.', month: '2026-03' },
    { id: 5, name: 'QWERTY 01', note: 'Damage', amount: 35, date: 'March 10, 2026', time: '3:11 p.m.', month: '2026-03' },
    { id: 6, name: 'PULSA TELEMOR', note: 'Operasional', amount: 5, date: 'March 9, 2026', time: '11:18 a.m.', month: '2026-03' },
  ])
  
  const filteredRows = computed(() => {
    let result = [...rows.value]
  
    if (appliedMonth.value) {
      result = result.filter((item) => item.month === appliedMonth.value)
    }
  
    const keyword = search.value.trim().toLowerCase()
    if (keyword) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.note.toLowerCase().includes(keyword)
      )
    }
  
    return result
  })
  
  const totalExpense = computed(() =>
    filteredRows.value.reduce((sum, item) => sum + item.amount, 0)
  )
  
  const latestExpenseDate = computed(() => {
    return filteredRows.value[0]?.date || '-'
  })
  
  const topNote = computed(() => {
    return filteredRows.value[0]?.note || '-'
  })
  
  function applyFilter() {
    appliedMonth.value = selectedMonth.value
    showFlash('Expense filter applied.')
  }
  
  function resetFilter() {
    selectedMonth.value = '2026-03'
    appliedMonth.value = '2026-03'
    search.value = ''
    showFlash('Expense filter reset.')
  }
  
  function currency(value: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }
  
  function showFlash(message: string) {
    flashMessage.value = message
    setTimeout(() => {
      flashMessage.value = ''
    }, 2200)
  }
  </script>
  
  <style scoped>
  .report-page {
    padding: 24px;
    background: #f8fafc;
    min-height: 100vh;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    flex-wrap: wrap;
    margin-bottom: 22px;
  }
  
  .page-title {
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
  }
  
  .page-subtitle {
    margin: 8px 0 0;
    color: #64748b;
    line-height: 1.6;
  }
  
  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    color: #64748b;
    font-size: 0.92rem;
  }
  
  .breadcrumb .active {
    color: #059814;
    font-weight: 700;
  }
  
  .page-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }
  
  .stat-card {
    background: #fff;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    padding: 20px;
    display: flex;
    gap: 14px;
    align-items: flex-start;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  }
  
  .stat-card.red { border-top: 4px solid #ef4444; }
  .stat-card.blue { border-top: 4px solid #2563eb; }
  .stat-card.emerald { border-top: 4px solid #16a34a; }
  .stat-card.amber { border-top: 4px solid #f59e0b; }
  
  .stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    font-size: 24px;
    flex-shrink: 0;
  }
  
  .stat-label {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
    color: #64748b;
  }
  
  .stat-value {
    margin: 6px 0 4px;
    font-size: 1.3rem;
    font-weight: 800;
    color: #111827;
  }
  
  .note-preview {
    font-size: 1.05rem;
  }
  
  .stat-meta {
    margin: 0;
    color: #6b7280;
    font-size: 0.92rem;
  }
  
  .toolbar-card,
  .table-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  }
  
  .toolbar-card {
    padding: 20px;
    margin-bottom: 22px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  
  .toolbar-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .toolbar-field label {
    font-size: 0.9rem;
    font-weight: 700;
    color: #334155;
  }
  
  .search-field {
    min-width: 280px;
  }
  
  .form-input {
    min-height: 46px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #d1d5db;
    outline: none;
    background: #fff;
  }
  
  .form-input:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  }
  
  .card-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid #eef2f7;
  }
  
  .card-header h2 {
    margin: 0;
    font-size: 1.15rem;
    color: #111827;
  }
  
  .card-header p {
    margin: 6px 0 0;
    color: #6b7280;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .modern-table {
    width: 100%;
    min-width: 760px;
    border-collapse: collapse;
  }
  
  .modern-table thead th {
    text-align: left;
    padding: 16px 18px;
    color: #1677ff;
    font-size: 0.95rem;
    font-weight: 800;
    background: #fcfdff;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modern-table tbody td {
    padding: 16px 18px;
    border-bottom: 1px solid #eef2f7;
    color: #1e293b;
  }
  
  .modern-table tbody tr:hover {
    background: #f8fafc;
  }
  
  .primary-cell {
    font-weight: 700;
    color: #0f172a;
  }
  
  .amount-cell {
    font-weight: 700;
    color: #dc2626;
  }
  
  .empty-state {
    text-align: center;
    padding: 28px !important;
    color: #64748b;
  }
  
  .btn {
    min-height: 44px;
    padding: 0 16px;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s ease;
  }
  
  .btn-light {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  .btn-light:hover {
    background: #e2e8f0;
  }
  
  .btn-primary {
    background: #1677ff;
    color: #fff;
  }
  
  .btn-primary:hover {
    background: #0f67ea;
  }
  
  .btn-success {
    background: linear-gradient(90deg, #60e66c, #059814);
    color: #fff;
  }
  
  .flash-message {
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 999;
    background: #111827;
    color: #fff;
    padding: 14px 18px;
    border-radius: 14px;
    font-weight: 700;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.24);
  }
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.22s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  @media (max-width: 1200px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  
  @media (max-width: 768px) {
    .report-page {
      padding: 16px;
    }
  
    .page-title {
      font-size: 1.6rem;
    }
  
    .stats-grid {
      grid-template-columns: 1fr;
    }
  
    .toolbar-left,
    .toolbar-right,
    .search-field {
      width: 100%;
    }
  
    .form-input,
    .btn {
      width: 100%;
    }
  }
  </style>