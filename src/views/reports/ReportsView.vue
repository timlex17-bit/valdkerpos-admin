<template>
  <div class="reports-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('reportsPage.title') }}</h1>
        <p class="page-subtitle">
          {{ t('reportsPage.subtitle') }}
        </p>

        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>›</span>
          <span class="active">{{ t('reportsPage.title') }}</span>
        </div>
      </div>
    </section>

    <section class="overview-card">
      <div class="overview-head">
        <div>
          <h2>{{ t('reportsPage.overview') }}</h2>
          <p>{{ t('reportsPage.quickAccess') }}</p>
        </div>
      </div>

      <div class="report-grid">
        <button class="report-card emerald" @click="goTo('/reports/sales')">
          <div class="report-icon">🧾</div>
          <div>
            <h3>{{ t('reportsPage.salesReportTitle') }}</h3>
            <p>{{ t('reportsPage.salesReportSubtitle') }}</p>
            <span>{{ t('reportsPage.openReport') }}</span>
          </div>
        </button>

        <button class="report-card red" @click="goTo('/reports/expense')">
          <div class="report-icon">💸</div>
          <div>
            <h3>{{ t('reportsPage.expenseReportTitle') }}</h3>
            <p>{{ t('reportsPage.expenseReportSubtitle') }}</p>
            <span>{{ t('reportsPage.openReport') }}</span>
          </div>
        </button>

        <button class="report-card blue" @click="goTo('/reports/sales-chart')">
          <div class="report-icon">📈</div>
          <div>
            <h3>{{ t('reportsPage.salesChartTitle') }}</h3>
            <p>{{ t('reportsPage.salesChartSubtitle') }}</p>
            <span>{{ t('reportsPage.viewChart') }}</span>
          </div>
        </button>

        <button class="report-card violet" @click="goTo('/reports/expense-chart')">
          <div class="report-icon">📊</div>
          <div>
            <h3>{{ t('reportsPage.expenseChartTitle') }}</h3>
            <p>{{ t('reportsPage.expenseChartSubtitle') }}</p>
            <span>{{ t('reportsPage.viewChart') }}</span>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

function goTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.reports-page {
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
.overview-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  padding: 22px;
}
.overview-head {
  margin-bottom: 18px;
}
.overview-head h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #0f172a;
}
.overview-head p {
  margin: 6px 0 0;
  color: #64748b;
}
.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.report-card {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
  background: #fff;
}
.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}
.report-card h3 {
  margin: 0 0 8px;
  font-size: 1.05rem;
  color: #0f172a;
}
.report-card p {
  margin: 0 0 12px;
  color: #64748b;
  line-height: 1.55;
}
.report-card span {
  font-size: 0.9rem;
  font-weight: 700;
}
.report-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.report-card.emerald {
  border-top: 4px solid #16a34a;
}
.report-card.emerald span {
  color: #16a34a;
}
.report-card.red {
  border-top: 4px solid #ef4444;
}
.report-card.red span {
  color: #dc2626;
}
.report-card.blue {
  border-top: 4px solid #2563eb;
}
.report-card.blue span {
  color: #2563eb;
}
.report-card.violet {
  border-top: 4px solid #7c3aed;
}
.report-card.violet span {
  color: #7c3aed;
}
@media (max-width: 900px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .reports-page {
    padding: 16px;
  }
  .page-title {
    font-size: 1.6rem;
  }
}
</style>