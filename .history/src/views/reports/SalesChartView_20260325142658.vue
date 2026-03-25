<template>
    <div class="chart-page">
      <section class="page-header">
        <div>
          <h1 class="page-title">Sales Chart</h1>
          <p class="page-subtitle">
            Visual overview of monthly sales performance, total order price, tax, discount, and net sales amount.
          </p>
  
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Reports</span>
            <span>›</span>
            <span class="active">Sales Chart</span>
          </div>
        </div>
  
        <div class="page-actions">
          <button class="btn btn-light" @click="showFlash('Refresh chart data.')">Refresh</button>
        </div>
      </section>
  
      <section class="filter-card">
        <div class="filter-group">
          <div class="field">
            <label>Year</label>
            <select v-model="selectedYear" class="form-select">
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
  
          <div class="field">
            <label>Chart Period</label>
            <select v-model="selectedPeriod" class="form-select">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
  
        <div class="filter-actions">
          <button class="btn btn-primary" @click="showFlash('Chart filter applied.')">Apply</button>
        </div>
      </section>
  
      <section class="metric-grid">
        <article class="metric-card neutral">
          <p>Total Order Price</p>
          <h3>{{ currency(totalOrderPrice) }}</h3>
        </article>
  
        <article class="metric-card rose">
          <p>Total Tax</p>
          <h3>{{ currency(totalTax) }}</h3>
        </article>
  
        <article class="metric-card mint">
          <p>Total Discount</p>
          <h3>{{ currency(totalDiscount) }}</h3>
        </article>
  
        <article class="metric-card green">
          <p>Net Sales Amount</p>
          <h3>{{ currency(netSalesAmount) }}</h3>
        </article>
      </section>
  
      <section class="charts-grid">
        <article class="chart-card">
          <div class="card-header">
            <div>
              <h2>Monthly Total Volume of Product Sales</h2>
              <p>Line chart placeholder for monthly sales volume.</p>
            </div>
          </div>
  
          <div class="chart-placeholder line-chart">
            <div class="chart-grid"></div>
            <div class="line line-a"></div>
            <div class="point p1"></div>
            <div class="point p2"></div>
            <div class="point p3"></div>
            <div class="point p4"></div>
  
            <div class="chart-labels">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
            </div>
          </div>
        </article>
  
        <article class="chart-card">
          <div class="card-header">
            <div>
              <h2>Monthly Total Volume of Product Sales</h2>
              <p>Bar chart placeholder for monthly sales volume.</p>
            </div>
          </div>
  
          <div class="bar-chart">
            <div class="bars">
              <div class="bar-wrap">
                <div class="bar" style="height: 45%"></div>
                <span>Jan</span>
              </div>
              <div class="bar-wrap">
                <div class="bar" style="height: 88%"></div>
                <span>Feb</span>
              </div>
              <div class="bar-wrap">
                <div class="bar" style="height: 30%"></div>
                <span>Mar</span>
              </div>
              <div class="bar-wrap">
                <div class="bar" style="height: 60%"></div>
                <span>Apr</span>
              </div>
            </div>
          </div>
        </article>
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
  
  const flashMessage = ref('')
  const selectedYear = ref('2026')
  const selectedPeriod = ref('monthly')
  
  const totalOrderPrice = computed(() => 61361.75)
  const totalTax = computed(() => 0)
  const totalDiscount = computed(() => 0)
  const netSalesAmount = computed(() => totalOrderPrice.value - totalTax.value - totalDiscount.value)
  
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
  .chart-page {
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
  
  .filter-card,
  .chart-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  }
  
  .filter-card {
    padding: 20px;
    margin-bottom: 22px;
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .filter-group,
  .filter-actions {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  
  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .field label {
    font-size: 0.9rem;
    font-weight: 700;
    color: #334155;
  }
  
  .form-select {
    min-height: 46px;
    min-width: 180px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #d1d5db;
    outline: none;
    background: #fff;
  }
  
  .form-select:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  }
  
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }
  
  .metric-card {
    border-radius: 20px;
    padding: 22px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  }
  
  .metric-card p {
    margin: 0;
    color: #475569;
    font-weight: 700;
  }
  
  .metric-card h3 {
    margin: 10px 0 0;
    color: #111827;
    font-size: 1.5rem;
    font-weight: 800;
  }
  
  .metric-card.neutral { background: #ffffff; }
  .metric-card.rose { background: #fff1f2; }
  .metric-card.mint { background: #f0fdf4; }
  .metric-card.green { background: #dcfce7; }
  
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
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
  
  .chart-placeholder,
  .bar-chart {
    padding: 24px;
    height: 340px;
  }
  
  .line-chart {
    position: relative;
  }
  
  .chart-grid {
    position: absolute;
    inset: 24px;
    background-image:
      linear-gradient(to top, rgba(148, 163, 184, 0.18) 1px, transparent 1px),
      linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
    background-size: 100% 25%, 25% 100%;
    border-radius: 14px;
  }
  
  .line {
    position: absolute;
    left: 72px;
    right: 72px;
    top: 90px;
    bottom: 90px;
    border-left: 3px solid transparent;
  }
  
  .line-a::before {
    content: '';
    position: absolute;
    inset: 0;
    border-bottom: 3px solid #1677ff;
    transform: skewY(18deg) translateY(-20px);
    transform-origin: left center;
  }
  
  .point {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: #1677ff;
    border: 3px solid #fff;
    box-shadow: 0 4px 10px rgba(22, 119, 255, 0.25);
  }
  
  .p1 { left: 72px; top: 112px; }
  .p2 { left: 32%; top: 146px; }
  .p3 { left: 56%; top: 186px; }
  .p4 { right: 72px; bottom: 92px; }
  
  .chart-labels {
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 18px;
    display: flex;
    justify-content: space-between;
    color: #64748b;
    font-weight: 600;
  }
  
  .bar-chart {
    display: flex;
    align-items: end;
  }
  
  .bars {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: end;
    justify-content: space-around;
    gap: 18px;
    padding: 12px 8px 0;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .bar-wrap {
    flex: 1;
    max-width: 90px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: center;
    gap: 10px;
  }
  
  .bar {
    width: 100%;
    border-radius: 14px 14px 6px 6px;
    background: linear-gradient(180deg, #60e66c, #059814);
    box-shadow: 0 12px 24px rgba(5, 152, 20, 0.18);
  }
  
  .bar-wrap span {
    color: #64748b;
    font-weight: 700;
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
    .metric-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  
    .charts-grid {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .chart-page {
      padding: 16px;
    }
  
    .page-title {
      font-size: 1.6rem;
    }
  
    .metric-grid {
      grid-template-columns: 1fr;
    }
  
    .filter-group,
    .filter-actions {
      width: 100%;
    }
  
    .form-select,
    .btn {
      width: 100%;
    }
  }
  </style>