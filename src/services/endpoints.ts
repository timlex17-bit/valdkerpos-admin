export const ENDPOINTS = {
  // MODULE CONTRACT - the authoritative module matrix for the calling shop.
  MODULES: '/api/modules/',
  MENU_PERMISSION_OPTIONS: '/api/menu-permissions/options/',

  PRODUCTS: '/api/products/',
  CATEGORIES: '/api/categories/',
  UNITS: '/api/units/',
  CUSTOMERS: '/api/customers/',
  SUPPLIERS: '/api/suppliers/',
  ORDERS: '/api/orders/',
  PURCHASES: '/api/purchases/',
  PRODUCT_RETURNS: '/api/productreturns/',
  EXPENSES: '/api/expenses/',
  INVENTORY_COUNTS: '/api/inventorycounts/',
  STOCK_ADJUSTMENTS: '/api/stockadjustments/',
  STOCK_MOVEMENTS: '/api/stockmovements/',

  // FINANCE
  BANK_ACCOUNTS: '/api/bank-accounts/',
  BANK_LEDGERS: '/api/bank-ledgers/',
  SALE_PAYMENTS: '/api/sale-payments/',
  BANK_LEDGER: '/api/bank-ledgers/',

  // SHIFT
  SHIFTS: '/api/shifts/',
  SHIFTS_CURRENT: '/api/shifts/current/',
  SHIFTS_OPEN: '/api/shifts/open/',
  SHIFTS_CLOSE: '/api/shifts/close/',

  // AUTH & STAFF
  AUTH_LOGIN: '/api/auth/login/',
  STAFF: '/api/staff/',

  // WAREHOUSING
  WAREHOUSES: '/api/warehouses/',
  WAREHOUSE_STOCKS: '/api/warehouse-stocks/',
  STOCK_TRANSFERS: '/api/stock-transfers/',

  // WORKSHOP
  VEHICLES: '/api/vehicles/',
  MECHANICS: '/api/mechanics/',
  WORK_ORDERS: '/api/work-orders/',
  SERVICE_HISTORY: '/api/service-history/',
  SERVICE_PACKAGES: '/api/service-packages/',
  BOOKINGS: '/api/bookings/',

  // SYSTEM TOOLS
  BACKUP_CENTER_SUMMARY: '/api/backup-center/summary/',
  BACKUPS: '/api/backups/',
  BACKUPS_RUN: '/api/backups/run/',
  BACKUP_SETTINGS: '/api/backup-settings/',
  IMPORT_JOBS: '/api/import-master-data/jobs/',
  IMPORT_TEMPLATE: '/api/import-master-data/template/',
  IMPORT_TEMPLATE_INFO: '/api/import-master-data/template/info/',

  // SHOP
  SHOP_ME: '/api/shop/me/',

  // REPORTS
  DASHBOARD_SUMMARY: '/api/dashboard/summary/',
  REPORT_DASHBOARD_SUMMARY: '/api/reports/dashboard-summary/',
  REPORT_SALES: '/api/reports/sales/',
  REPORT_SALES_ITEMS: '/api/reports/sales-items/',
  REPORT_PAYMENTS: '/api/reports/payments/',
  REPORT_EXPENSES: '/api/reports/expenses/',
  REPORT_STOCK: '/api/reports/stock/',
  REPORT_LOW_STOCK: '/api/reports/low-stock/',
  REPORT_SHIFTS: '/api/reports/shifts/',
  REPORT_SALES_EXPORT: '/api/reports/sales/export/',
  REPORT_DAILY_PROFIT: '/api/reports/daily-profit/',
  REPORT_MONTHLY_PL: '/api/reports/monthly-pl/',
  REPORT_NET_INCOME_TODAY: '/api/reports/net-income-today/',
} as const
