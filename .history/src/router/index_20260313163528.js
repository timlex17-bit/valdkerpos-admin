import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

import DashboardView from '@/views/dashboard/DashboardView.vue'
import ProductsView from '@/views/products/ProductsView.vue'
import OrdersView from '@/views/orders/OrdersView.vue'
import CustomersView from '@/views/customers/CustomersView.vue'
import ReportsView from '@/views/reports/ReportsView.vue'
import SettingsView from '@/views/settings/SettingsView.vue'

const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
      },
      {
        path: 'products',
        name: 'products',
        component: ProductsView,
      },
      {
        path: 'orders',å
        name: 'orders',
        component: OrdersView,
      },
      {
        path: 'customers',
        name: 'customers',
        component: CustomersView,
      },
      {
        path: 'reports',
        name: 'reports',
        component: ReportsView,
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router