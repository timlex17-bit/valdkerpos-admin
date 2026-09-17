import { describe, expect, it, vi } from 'vitest'

const granted = new Set<string>()
vi.mock('@/services/moduleContract', () => ({
  moduleContract: { value: { shop: null, modules: [] } },
  getModuleEntry: () => null,
  isModuleGranted: (key: string) => granted.has(key),
}))

const { withoutRedundantSecondaries } = await import('../moduleVisibility')
const { adminMenuGroups } = await import('../adminMenu')

const reportItems = adminMenuGroups.find((group) => group.key === 'reports')!.items

describe('the reports group in the sidebar', () => {
  it('lists three entries for an owner, not ten', () => {
    granted.clear()
    reportItems.forEach((item) => granted.add(item.key))

    expect(withoutRedundantSecondaries(reportItems, null).map((item) => item.label)).toEqual([
      'Overview',
      'Sales Report',
      'Stock Report',
    ])
  })

  it('keeps the only way in for a user granted one report and nothing else', () => {
    // The owner switched everything off but Payment Report. Hiding it because
    // it is "a tab of the overview" would leave this user with no report at
    // all, since they may not open the overview.
    granted.clear()
    granted.add('payment_report')

    expect(withoutRedundantSecondaries(reportItems, null).map((item) => item.key)).toContain(
      'payment_report'
    )
  })

  it('every report page is still reachable, as an entry or as a tab', () => {
    // Nothing was dropped from the menu when it was shortened: each key is
    // either primary or marked secondary, never removed.
    const keys = reportItems.map((item) => item.key)
    expect(keys).toEqual(
      expect.arrayContaining([
        'reports',
        'sales_report',
        'sales_items_report',
        'payment_report',
        'expense_report',
        'stock_report',
        'low_stock_report',
        'shift_report',
        'sales_chart',
        'expense_chart',
      ])
    )
  })
})
