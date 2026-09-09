import api from './api'
import { ENDPOINTS } from './endpoints'

export type ReportParams = Record<string, unknown>
export type ExportFormat = 'pdf' | 'xlsx'

const emptyValues = new Set([undefined, null, ''])

export function sanitizeReportParams(params: ReportParams = {}) {
  const sanitized: ReportParams = {}

  Object.entries(params).forEach(([key, value]) => {
    if (key === 'business_type') return
    if (emptyValues.has(value as undefined | null | '')) return
    sanitized[key] = value
  })

  return sanitized
}

const getReport = <T = unknown>(url: string, params?: ReportParams) => {
  return api.get<T>(url, {
    params: sanitizeReportParams(params),
  })
}

export const reportService = {
  getDashboardSummary(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_DASHBOARD_SUMMARY, params)
  },

  getSalesReport(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_SALES, params)
  },

  getSalesItemsReport(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_SALES_ITEMS, params)
  },

  getPaymentsReport(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_PAYMENTS, params)
  },

  getExpensesReport(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_EXPENSES, params)
  },

  getStockReport(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_STOCK, params)
  },

  getLowStockReport(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_LOW_STOCK, params)
  },

  getShiftsReport(params?: ReportParams) {
    return getReport(ENDPOINTS.REPORT_SHIFTS, params)
  },

  exportSalesReport(format: ExportFormat, params?: ReportParams) {
    return api.get<Blob>(ENDPOINTS.REPORT_SALES_EXPORT, {
      params: sanitizeReportParams({ ...params, format }),
      responseType: 'blob',
    })
  },
}

export default reportService
