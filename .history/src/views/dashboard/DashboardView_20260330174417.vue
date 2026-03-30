<template>
  <div class="dashboard-page">
    <!-- Header -->
    <section class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back. Here is your business overview for today.</p>

        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span class="active">Dashboard</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="secondary-btn">Export Summary</button>
      </div>
    </section>

    <!-- KPI Cards -->
    <section class="stats-grid stats-grid-6">
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon icon-green">💵</span>
          <span class="trend up">+12.4%</span>
        </div>
        <div class="stat-label">Sales Today</div>
        <div class="stat-value">${{ salesToday.toFixed(2) }}</div>
        <div class="stat-note">Compared with yesterday</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon icon-blue">🧾</span>
          <span class="trend up">+4</span>
        </div>
        <div class="stat-label">Orders Today</div>
        <div class="stat-value">{{ ordersToday }}</div>
        <div class="stat-note">Transactions created today</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon icon-purple">📈</span>
          <span class="trend up">+8.6%</span>
        </div>
        <div class="stat-label">Profit Estimate</div>
        <div class="stat-value">${{ profitEstimate.toFixed(2) }}</div>
        <div class="stat-note">Sales minus expenses</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon icon-orange">💸</span>
          <span class="trend down">-2.1%</span>
        </div>
        <div class="stat-label">Expenses Today</div>
        <div class="stat-value">${{ expensesToday.toFixed(2) }}</div>
        <div class="stat-note">Operational expenses today</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon icon-red">⚠️</span>
          <span class="trend flat">Need action</span>
        </div>
        <div class="stat-label">Low Stock Alerts</div>
        <div class="stat-value">{{ lowStockItems.length }}</div>
        <div class="stat-note">Products below minimum stock</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon icon-yellow">⏳</span>
          <span class="trend flat">Follow up</span>
        </div>
        <div class="stat-label">Pending Orders</div>
        <div class="stat-value">{{ pendingOrders }}</div>
        <div class="stat-note">Orders waiting to complete</div>
      </div>
    </section>

    <!-- Chart + Payment Summary -->
    <section class="content-grid content-grid-2">
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h2>Sales Last 7 Days</h2>
            <p>Daily sales performance overview</p>
          </div>
          <button class="ghost-btn">View Report</button>
        </div>

        <div class="chart-card">
          <div class="chart-bars">
            <div
              v-for="item in salesChart"
              :key="item.label"
              class="chart-bar-item"
            >
              <div class="bar-wrap">
                <div
                  class="bar-fill"
                  :style="{ height: `${item.height}%` }"
                ></div>
              </div>
              <div class="bar-value">${{ item.value }}</div>
              <div class="bar-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h2>Payment Methods</h2>
            <p>Sales distribution by payment type</p>
          </div>
          <button class="ghost-btn">Details</button>
        </div>

        <div class="payment-summary">
          <div class="donut-placeholder">
            <div class="donut-center">
              <strong>${{ totalPaymentSummary.toFixed(2) }}</strong>
              <span>Total</span>
            </div>
          </div>

          <div class="payment-list">
            <div
              v-for="item in paymentMethods"
              :key="item.label"
              class="payment-item"
            >
              <div class="payment-item__left">
                <span class="payment-dot" :class="item.colorClass"></span>
                <div>
                  <div class="payment-name">{{ item.label }}</div>
                  <div class="payment-sub">{{ item.percent }}% of sales</div>
                </div>
              </div>
              <div class="payment-amount">${{ item.amount.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Low stock + Top products -->
    <section class="content-grid content-grid-2">
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h2>Low Stock Products</h2>
            <p>Products that need immediate restock</p>
          </div>
          <button class="ghost-btn">Inventory</button>
        </div>

        <div class="list-stack">
          <div
            v-for="item in lowStockItems"
            :key="item.id"
            class="list-row"
          >
            <div class="list-row__left">
              <div class="product-avatar">
                {{ getInitial(item.name) }}
              </div>
              <div>
                <div class="list-title">{{ item.name }}</div>
                <div class="list-sub">SKU: {{ item.sku }}</div>
              </div>
            </div>

            <div class="list-row__right">
              <span class="status-badge cancelled">Stock {{ item.stock }}</span>
              <span class="mini-note">Min {{ item.minStock }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h2>Top Selling Products</h2>
            <p>Best performing products today</p>
          </div>
          <button class="ghost-btn">Products</button>
        </div>

        <div class="list-stack">
          <div
            v-for="item in topProducts"
            :key="item.id"
            class="list-row"
          >
            <div class="list-row__left">
              <div class="product-avatar product-avatar--green">
                {{ getInitial(item.name) }}
              </div>
              <div>
                <div class="list-title">{{ item.name }}</div>
                <div class="list-sub">{{ item.qty }} items sold</div>
              </div>
            </div>

            <div class="list-row__right">
              <span class="amount-strong">${{ item.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent orders + Expenses -->
    <section class="content-grid content-grid-2">
      <div class="table-card">
        <div class="table-header">
          <div>
            <h2>Recent Orders</h2>
            <p>Latest sales transactions from your shop</p>
          </div>
          <button class="ghost-btn">All Orders</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Served By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td>
                  <div class="ref-main">{{ order.invoice }}</div>
                  <div class="ref-sub">{{ order.type }}</div>
                </td>
                <td>{{ order.customer }}</td>
                <td class="amount-strong">${{ order.total.toFixed(2) }}</td>
                <td>{{ order.payment }}</td>
                <td>
                  <span class="status-badge" :class="order.status === 'Paid' ? 'paid' : 'unpaid'">
                    {{ order.status }}
                  </span>
                </td>
                <td>{{ order.servedBy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <div>
            <h2>Recent Expenses</h2>
            <p>Latest operational expenses recorded</p>
          </div>
          <button class="ghost-btn">All Expenses</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in recentExpenses" :key="expense.id">
                <td>
                  <div class="title-main">{{ expense.name }}</div>
                  <div class="ref-sub">{{ expense.note }}</div>
                </td>
                <td class="amount-strong amount-expense">${{ expense.amount.toFixed(2) }}</td>
                <td>{{ expense.date }}</td>
                <td>{{ expense.createdBy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Activity -->
    <section class="panel-card">
      <div class="panel-header">
        <div>
          <h2>Recent Activity</h2>
          <p>Latest important activities in your shop</p>
        </div>
        <button class="ghost-btn">View All</button>
      </div>

      <div class="activity-list">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-row"
        >
          <div class="activity-icon" :class="activity.colorClass">
            {{ activity.icon }}
          </div>

          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-sub">{{ activity.description }}</div>
          </div>

          <div class="activity-time">{{ activity.time }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const salesToday = ref(265.5)
const ordersToday = ref(18)
const expensesToday = ref(42.75)
const pendingOrders = ref(3)

const profitEstimate = computed(() => salesToday.value - expensesToday.value)

const salesChart = ref([
  { label: 'Mon', value: 120, height: 42 },
  { label: 'Tue', value: 165, height: 58 },
  { label: 'Wed', value: 140, height: 49 },
  { label: 'Thu', value: 210, height: 74 },
  { label: 'Fri', value: 180, height: 63 },
  { label: 'Sat', value: 250, height: 88 },
  { label: 'Sun', value: 225, height: 79 },
])

const paymentMethods = ref([
  { label: 'Cash', amount: 124.5, percent: 47, colorClass: 'dot-green' },
  { label: 'QRIS', amount: 78, percent: 29, colorClass: 'dot-blue' },
  { label: 'Transfer', amount: 43, percent: 16, colorClass: 'dot-orange' },
  { label: 'Card', amount: 20, percent: 8, colorClass: 'dot-purple' },
])

const totalPaymentSummary = computed(() =>
  paymentMethods.value.reduce((sum, item) => sum + item.amount, 0)
)

const lowStockItems = ref([
  { id: 1, name: 'Redbull Can', sku: 'RB-001', stock: 3, minStock: 10 },
  { id: 2, name: 'Pizza Sosis', sku: 'PZ-010', stock: 5, minStock: 12 },
  { id: 3, name: 'Oli Yamaha Lube', sku: 'OL-100', stock: 2, minStock: 8 },
  { id: 4, name: 'Ice Cemilds', sku: 'IC-022', stock: 4, minStock: 10 },
])

const topProducts = ref([
  { id: 1, name: 'Pizza Sosis', qty: 18, total: 90 },
  { id: 2, name: 'Redbull Can', qty: 14, total: 42 },
  { id: 3, name: 'Fried Chicken', qty: 12, total: 72 },
  { id: 4, name: 'Coca Cola 1L', qty: 9, total: 31.5 },
])

const recentOrders = ref([
  {
    id: 1,
    invoice: 'INV0000000030',
    type: 'Workshop',
    customer: 'Doviana',
    total: 34.5,
    payment: 'Cash',
    status: 'Paid',
    servedBy: 'Jeffri',
  },
  {
    id: 2,
    invoice: 'INV0000000029',
    type: 'General',
    customer: 'Walk In',
    total: 3.5,
    payment: 'Cash',
    status: 'Paid',
    servedBy: 'Julio',
  },
  {
    id: 3,
    invoice: 'INV0000000028',
    type: 'Take Away',
    customer: 'Alexander Guterres',
    total: 16,
    payment: 'Transfer',
    status: 'Unpaid',
    servedBy: 'Julio',
  },
  {
    id: 4,
    invoice: 'INV0000000027',
    type: 'General',
    customer: 'Doviana',
    total: 11.5,
    payment: 'Card',
    status: 'Paid',
    servedBy: 'Jeffri',
  },
])

const recentExpenses = ref([
  { id: 1, name: 'Transport', note: 'Delivery support', amount: 12.5, date: 'March 24, 2026', createdBy: 'Owner' },
  { id: 2, name: 'Phone Credit', note: 'Shop communication', amount: 5, date: 'March 24, 2026', createdBy: 'Cashier' },
  { id: 3, name: 'Snacks', note: 'Team operational', amount: 8.25, date: 'March 24, 2026', createdBy: 'Manager' },
  { id: 4, name: 'Fuel', note: 'Motor delivery', amount: 17, date: 'March 23, 2026', createdBy: 'Owner' },
])

const recentActivities = ref([
  {
    id: 1,
    icon: '🧾',
    title: 'Julio created order INV0000000031',
    description: 'A new order was added with total $18.50.',
    time: '2 min ago',
    colorClass: 'activity-blue',
  },
  {
    id: 2,
    icon: '📦',
    title: 'Stock adjusted for Redbull Can',
    description: 'Owner updated stock from 8 to 12 after recount.',
    time: '15 min ago',
    colorClass: 'activity-orange',
  },
  {
    id: 3,
    icon: '💸',
    title: 'Expense added: Fuel',
    description: 'New expense of $17.00 recorded by Owner.',
    time: '36 min ago',
    colorClass: 'activity-red',
  },
  {
    id: 4,
    icon: '🛒',
    title: 'Purchase received from supplier',
    description: 'Purchase items increased inventory for beverages.',
    time: '1 hour ago',
    colorClass: 'activity-green',
  },
  {
    id: 5,
    icon: '↩️',
    title: 'Product return processed',
    description: 'Return completed for Pizza Sosis quantity 2.',
    time: '2 hours ago',
    colorClass: 'activity-purple',
  },
])

function getInitial(value: string) {
  return value?.trim()?.charAt(0)?.toUpperCase() || 'P'
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

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.add-btn,
.secondary-btn,
.ghost-btn {
  border: none;
  height: 46px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.add-btn {
  background: #22c55e;
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.18);
}

.add-btn span {
  font-size: 1.2rem;
  line-height: 1;
}

.secondary-btn {
  background: #eef2f7;
  color: #334155;
}

.ghost-btn {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
}

.stats-grid-6 {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.stat-card {
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  border: 1px solid #edf0f5;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.icon-green { background: #dcfce7; }
.icon-blue { background: #dbeafe; }
.icon-purple { background: #ede9fe; }
.icon-orange { background: #ffedd5; }
.icon-red { background: #fee2e2; }
.icon-yellow { background: #fef3c7; }

.trend {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
}

.trend.up {
  background: #dcfce7;
  color: #16a34a;
}

.trend.down {
  background: #fee2e2;
  color: #dc2626;
}

.trend.flat {
  background: #f1f5f9;
  color: #475569;
}

.stat-label {
  font-size: 0.92rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.9rem;
  font-weight: 800;
  color: #1f2a44;
  margin-bottom: 6px;
}

.stat-note {
  color: #94a3b8;
  font-size: 0.9rem;
}

.content-grid {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
}

.content-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card,
.table-card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid #edf0f5;
  overflow: hidden;
}

.panel-header,
.table-header {
  padding: 20px 20px 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-header h2,
.table-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2a44;
}

.panel-header p,
.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.chart-card {
  padding: 16px 20px 22px;
}

.chart-bars {
  height: 260px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 16px;
  align-items: end;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
}

.bar-wrap {
  flex: 1;
  width: 100%;
  background: #f1f5f9;
  border-radius: 16px;
  display: flex;
  align-items: end;
  padding: 8px;
  min-height: 120px;
}

.bar-fill {
  width: 100%;
  border-radius: 12px;
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
}

.bar-value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.bar-label {
  font-size: 0.85rem;
  color: #64748b;
}

.payment-summary {
  padding: 12px 20px 22px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: center;
}

.donut-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  margin: 0 auto;
  background:
    conic-gradient(
      #22c55e 0deg 170deg,
      #3b82f6 170deg 275deg,
      #fb923c 275deg 332deg,
      #8b5cf6 332deg 360deg
    );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.donut-placeholder::after {
  content: '';
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 50%;
  position: absolute;
}

.donut-center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-center strong {
  font-size: 1.2rem;
  color: #1f2a44;
}

.donut-center span {
  color: #64748b;
  font-size: 0.85rem;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.payment-item__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-green { background: #22c55e; }
.dot-blue { background: #3b82f6; }
.dot-orange { background: #fb923c; }
.dot-purple { background: #8b5cf6; }

.payment-name {
  font-weight: 700;
  color: #1f2937;
}

.payment-sub {
  color: #64748b;
  font-size: 0.88rem;
  margin-top: 4px;
}

.payment-amount {
  font-weight: 800;
  color: #1f2a44;
}

.list-stack {
  padding: 6px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-row {
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.list-row__left,
.list-row__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.product-avatar--green {
  background: linear-gradient(135deg, #dcfce7, #f0fdf4);
  color: #16a34a;
}

.list-title,
.title-main {
  font-weight: 700;
  color: #1f2937;
}

.list-sub,
.ref-sub,
.mini-note {
  color: #64748b;
  font-size: 0.88rem;
  margin-top: 4px;
}

.amount-strong {
  font-weight: 800;
  color: #1f2a44;
}

.amount-expense {
  color: #dc2626;
}

.table-wrap {
  overflow-x: auto;
  padding: 8px 18px 18px;
}

.data-table {
  width: 100%;
  min-width: 760px;
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

.ref-main {
  color: #2563eb;
  font-weight: 800;
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

.activity-list {
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-row {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.activity-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.activity-blue { background: #dbeafe; }
.activity-orange { background: #ffedd5; }
.activity-red { background: #fee2e2; }
.activity-green { background: #dcfce7; }
.activity-purple { background: #ede9fe; }

.activity-title {
  font-weight: 700;
  color: #1f2937;
}

.activity-sub {
  color: #64748b;
  margin-top: 4px;
  font-size: 0.92rem;
}

.activity-time {
  color: #64748b;
  font-size: 0.88rem;
  white-space: nowrap;
}

@media (max-width: 1400px) {
  .stats-grid-6 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .content-grid-2,
  .payment-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .add-btn,
  .secondary-btn {
    width: 100%;
    justify-content: center;
  }

  .secondary-btn {
  background: white;
  color: #374151;
  border: 1px solid #E5E7EB;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

  .stats-grid-6 {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 32px;
    line-height: 1.15;
  }

  .activity-row {
    grid-template-columns: 48px 1fr;
  }

  .activity-time {
    grid-column: 2;
  }

  .list-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>