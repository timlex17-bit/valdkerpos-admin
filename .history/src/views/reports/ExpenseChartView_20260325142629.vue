<template>
    <div class="chart-page">
      <section class="page-header">
        <div>
          <h1 class="page-title">Expense Chart</h1>
          <p class="page-subtitle">
            Visual summary of monthly expense trends and operational spending performance.
          </p>
  
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Reports</span>
            <span>›</span>
            <span class="active">Expense Chart</span>
          </div>
        </div>
  
        <div class="page-actions">
          <button class="btn btn-light" @click="showFlash('Expense chart refreshed.')">Refresh</button>
        </div>
      </section>
  
      <section class="summary-grid">
        <article class="summary-card cyan">
          <p>Total Expense This Month</p>
          <h3>{{ currency(totalExpense) }}</h3>
          <span>March 2026</span>
        </article>
  
        <article class="summary-card orange">
          <p>Average Daily Expense</p>
          <h3>{{ currency(avgDailyExpense) }}</h3>
          <span>Estimated average</span>
        </article>
  
        <article class="summary-card purple">
          <p>Highest Expense Day</p>
          <h3>{{ highestExpenseDay }}</h3>
          <span>Peak spending date</span>
        </article>
      </section>
  
      <section class="chart-card">
        <div class="card-header">
          <div>
            <h2>Total Expense per Month</h2>
            <p>Bar chart placeholder for monthly expense totals.</p>
          </div>
        </div>
  
        <div class="expense-chart-area">
          <div class="y-guides">
            <span>250</span>
            <span>200</span>
            <span>150</span>
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
  
          <div class="bars-area">
            <div class="guide-lines">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
  
            <div class="expense-bars">
              <div class="expense-bar-wrap">
                <div class="expense-bar" style="height: 34%"></div>
                <label>Jan 2026</label>
              </div>
              <div class="expense-bar-wrap">
                <div class="expense-bar" style="height: 48%"></div>
                <label>Feb 2026</label>
              </div>
              <div class="expense-bar-wrap featured">
                <div class="expense-bar" style="height: 86%"></div>
                <label>Mar 2026</label>
              </div>
            </div>
          </div>
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
  
  const flashMessage = ref('')
  
  const totalExpense = computed(() => 213.5)
  const avgDailyExpense = computed(() => 7.12)
  const highestExpenseDay = computed(() => 'March 16, 2026')
  
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
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }
  
  .summary-card {
    border-radius: 20px;
    padding: 22px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  }
  
  .summary-card p {
    margin: 0;
    color: #475569;
    font-weight: 700;
  }
  
  .summary-card h3 {
    margin: 10px 0 8px;
    color: #111827;
    font-size: 1.55rem;
    font-weight: 800;
  }
  
  .summary-card span {
    color: #64748b;
    font-size: 0.92rem;
  }
  
  .summary-card.cyan {
    background: #ecfeff;
  }
  
  .summary-card.orange {
    background: #fff7ed;
  }
  
  .summary-card.purple {
    background: #f5f3ff;
  }
  
  .chart-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
    overflow: hidden;
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
  
  .expense-chart-area {
    display: grid;
    grid-template-columns: 70px 1fr;
    gap: 12px;
    padding: 24px 24px 28px;
    min-height: 420px;
  }
  
  .y-guides {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #64748b;
    font-weight: 700;
    padding-top: 6px;
  }
  
  .bars-area {
    position: relative;
  }
  
  .guide-lines {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .guide-lines span {
    display: block;
    border-top: 1px solid rgba(148, 163, 184, 0.22);
  }
  
  .expense-bars {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: end;
    justify-content: space-around;
    gap: 20px;
    padding: 10px 10px 0;
  }
  
  .expense-bar-wrap {
    width: 160px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    gap: 12px;
    height: 100%;
  }
  
  .expense-bar {
    width: 100%;
    border-radius: 18px 18px 8px 8px;
    background: linear-gradient(180deg, #99f6e4, #14b8a6);
    box-shadow: 0 14px 28px rgba(20, 184, 166, 0.2);
  }
  
  .expense-bar-wrap.featured .expense-bar {
    background: linear-gradient(180deg, #a5f3fc, #06b6d4);
  }
  
  .expense-bar-wrap label {
    color: #475569;
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
  
  @media (max-width: 1100px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  
    .expense-bars {
      gap: 12px;
    }
  
    .expense-bar-wrap {
      width: 110px;
    }
  }
  
  @media (max-width: 768px) {
    .chart-page {
      padding: 16px;
    }
  
    .page-title {
      font-size: 1.6rem;
    }
  
    .expense-chart-area {
      grid-template-columns: 46px 1fr;
      min-height: 360px;
    }
  
    .expense-bar-wrap {
      width: 80px;
    }
  }
  </style>