export const ENDPOINTS = {
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

  // SHOP
  SHOP_ME: '/api/shop/me/',

  // REPORTS
  REPORT_DAILY_PROFIT: '/api/reports/daily-profit/',
  REPORT_MONTHLY_PL: '/api/reports/monthly-pl/',
  REPORT_NET_INCOME_TODAY: '/api/reports/net-income-today/',
} as const