<template>
    <div class="report-page">
      <!-- Header -->
      <section class="page-header">
        <div>
          <h1 class="page-title">Sales Report</h1>
          <p class="page-subtitle">
            Monitor transaction details, invoice performance, quantity sold, and total sales value.
          </p>
  
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Reports</span>
            <span>›</span>
            <span class="active">Sales Report</span>
          </div>
        </div>
  
        <div class="page-actions">
          <button class="btn btn-danger" @click="showFlash('PDF export started.')">
            Print PDF
          </button>
          <button class="btn btn-success" @click="showFlash('Excel export started.')">
            Imprime Excel
          </button>
          <button class="btn btn-info" @click="showFlash('Print preview opened.')">
            Previaun Imprime
          </button>
        </div>
      </section>
  
      <!-- Stats -->
      <section class="stats-grid">
        <article class="stat-card emerald">
          <div class="stat-icon">💰</div>
          <div>
            <p class="stat-label">Total Sales</p>
            <h3 class="stat-value">{{ currency(totalSalesAmount) }}</h3>
            <p class="stat-meta">From {{ filteredRows.length }} sales rows</p>
          </div>
        </article>
  
        <article class="stat-card blue">
          <div class="stat-icon">🧾</div>
          <div>
            <p class="stat-label">Invoices</p>
            <h3 class="stat-value">{{ uniqueInvoices }}</h3>
            <p class="stat-meta">Unique invoice count</p>
          </div>
        </article>
  
        <article class="stat-card amber">
          <div class="stat-icon">📦</div>
          <div>
            <p class="stat-label">Quantity Sold</p>
            <h3 class="stat-value">{{ totalQuantity }}</h3>
            <p class="stat-meta">Total units sold</p>
          </div>
        </article>
  
        <article class="stat-card violet">
          <div class="stat-icon">⚖️</div>
          <div>
            <p class="stat-label">Weight</p>
            <h3 class="stat-value">{{ totalWeight }}</h3>
            <p class="stat-meta">Accumulated product weight</p>
          </div>
        </article>
      </section>
  
      <!-- Filter -->
      <section class="toolbar-card">
        <div class="toolbar-left">
          <div class="toolbar-field">
            <label>Filter by Month</label>
            <input v-model="selectedMonth" type="month" class="form-input" />
          </div>
  
          <div class="toolbar-field search-field">
            <label>Search</label>
            <input
              v-model="search"
              type="text"
              class="form-input"
              placeholder="Search product or invoice..."
            />
          </div>
        </div>
  
        <div class="toolbar-right">
          <button class="btn btn-primary" @click="applyFilter">Filter</button>
          <button class="btn btn-light" @click="resetFilter">Reset</button>
        </div>
      </section>
  
      <!-- Table -->
      <section class="table-card">
        <div class="card-header">
          <div>
            <h2>Sales transaction details</h2>
            <p>Detailed list of sales rows by product and invoice.</p>
          </div>
  
          <div class="table-summary">
            Showing <strong>{{ filteredRows.length }}</strong> rows
          </div>
        </div>
  
        <div class="table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Naran Produtu</th>
                <th>ID Invoice</th>
                <th>Quantidade</th>
                <th>Weight</th>
                <th>Presu Total</th>
                <th>Data Order</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRows.length === 0">
                <td colspan="6" class="empty-state">No sales data found.</td>
              </tr>
  
              <tr v-for="item in filteredRows" :key="item.id">
                <td>
                  <div class="primary-cell">{{ item.product }}</div>
                </td>
                <td>{{ item.invoice }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.weight || '-' }}</td>
                <td class="amount-cell">{{ currency(item.total) }}</td>
                <td>{{ item.orderDate }}</td>
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
  
  type SalesRow = {
    id: number
    product: string
    invoice: string
    quantity: number
    weight: string
    total: number
    orderDate: string
    month: string
  }
  
  const flashMessage = ref('')
  const selectedMonth = ref('2026-03')
  const appliedMonth = ref('2026-03')
  const search = ref('')
  
  const rows = ref<SalesRow[]>([
    { id: 1, product: 'Pizza Sosis', invoice: 'INV000000000001', quantity: 2, weight: '-', total: 30000, orderDate: '26 February, 2026', month: '2026-02' },
    { id: 2, product: 'Pizza Sosis', invoice: 'INV000000000002', quantity: 2, weight: '-', total: 30000, orderDate: '26 February, 2026', month: '2026-02' },
    { id: 3, product: 'Donats', invoice: 'INV000000000004', quantity: 1, weight: '-', total: 10, orderDate: '08 March, 2026', month: '2026-03' },
    { id: 4, product: 'Ice Cemilds', invoice: 'INV000000000004', quantity: 1, weight: '-', total: 1.5, orderDate: '08 March, 2026', month: '2026-03' },
    { id: 5, product: 'Pizza Sosis', invoice: 'INV000000000005', quantity: 1, weight: '-', total: 1.25, orderDate: '09 March, 2026', month: '2026-03' },
    { id: 6, product: 'Donats', invoice: 'INV000000000006', quantity: 20, weight: '-', total: 200, orderDate: '10 March, 2026', month: '2026-03' },
    { id: 7, product: 'Ice Cemilds', invoice: 'INV000000000006', quantity: 20, weight: '-', total: 30, orderDate: '10 March, 2026', month: '2026-03' },
    { id: 8, product: 'Pizza Sosis', invoice: 'INV000000000006', quantity: 20, weight: '-', total: 25, orderDate: '10 March, 2026', month: '2026-03' },
    { id: 9, product: 'Redbull', invoice: 'INV000000000010', quantity: 1, weight: '-', total: 2.5, orderDate: '15 March, 2026', month: '2026-03' },
    { id: 10, product: 'Oli Yamaha Lube', invoice: 'INV000000000023', quantity: 50, weight: '-', total: 50, orderDate: '18 March, 2026', month: '2026-03' },
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
          item.product.toLowerCase().includes(keyword) ||
          item.invoice.toLowerCase().includes(keyword)
      )
    }
  
    return result
  })
  
  const totalSalesAmount = computed(() =>
    filteredRows.value.reduce((sum, item) => sum + item.total, 0)
  )
  
  const totalQuantity = computed(() =>
    filteredRows.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  
  const uniqueInvoices = computed(() => {
    const invoices = new Set(filteredRows.value.map((item) => item.invoice))
    return invoices.size
  })
  
  const totalWeight = computed(() => {
    return '-'
  })
  
  function applyFilter() {
    appliedMonth.value = selectedMonth.value
    showFlash('Filter applied.')
  }
  
  function resetFilter() {
    selectedMonth.value = '2026-03'
    appliedMonth.value = '2026-03'
    search.value = ''
    showFlash('Filter reset.')
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
  
  .stat-card.emerald { border-top: 4px solid #16a34a; }
  .stat-card.blue { border-top: 4px solid #2563eb; }
  .stat-card.amber { border-top: 4px solid #f59e0b; }
  .stat-card.violet { border-top: 4px solid #7c3aed; }
  
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
    font-size: 1.35rem;
    font-weight: 800;
    color: #111827;
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
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    flex-wrap: wrap;
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
  
  .table-summary {
    color: #475569;
    font-size: 0.95rem;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .modern-table {
    width: 100%;
    min-width: 920px;
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
    color: #059669;
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
  
  .btn-success:hover {
    filter: brightness(0.97);
  }
  
  .btn-danger {
    background: linear-gradient(90deg, #ef4444, #dc2626);
    color: #fff;
  }
  
  .btn-info {
    background: linear-gradient(90deg, #06b6d4, #0891b2);
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