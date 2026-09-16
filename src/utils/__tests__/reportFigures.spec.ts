import { describe, expect, it } from 'vitest'
import { collectFigures, readFigure } from '../reportFigures'

// The real QARETAIL answer from /api/reports/dashboard-summary/, which sends
// currency as strings and repeats the same number under several names.
const summary = {
  total_revenue: '159.92',
  net_sales: '159.92',
  gross_profit: '145.93',
  total_orders: 6,
  total_expenses: '1234580.44',
  net_income: '-1234420.52',
  profit_margin_percent: '91.25',
  low_stock_count: 0,
  total_discount: '0.00',
}

describe('readFigure', () => {
  it('reads a number however the backend spelled it', () => {
    expect(readFigure(summary, 'revenue')).toBe(159.92)
    expect(readFigure({ revenue: 12 }, 'revenue')).toBe(12)
    expect(readFigure({ total_sales: '7.50' }, 'revenue')).toBe(7.5)
  })

  it('keeps a real zero but reports a missing figure as missing', () => {
    expect(readFigure(summary, 'lowStock')).toBe(0)
    expect(readFigure(summary, 'averageOrder')).toBeNull()
    expect(readFigure({ total_revenue: '' }, 'revenue')).toBeNull()
    expect(readFigure(null, 'revenue')).toBeNull()
  })

  it('does not mistake net sales for net income', () => {
    // net_sales is revenue after discounts; net income is what is left after
    // expenses. Confusing them would tell an owner they profited on a loss.
    expect(readFigure({ net_sales: '159.92' }, 'netIncome')).toBeNull()
  })
})

describe('collectFigures', () => {
  const previous = { total_revenue: '80.00', gross_profit: '40.00', total_orders: 4 }

  it('returns only figures the backend sent, in the order asked for', () => {
    const figures = collectFigures(summary, previous, ['revenue', 'averageOrder', 'grossProfit', 'orders'])

    expect(figures.map((figure) => figure.key)).toEqual(['revenue', 'grossProfit', 'orders'])
    expect(figures[0].value).toBe(159.92)
    expect(figures[0].change?.direction).toBe('up')
    expect(figures[0].change?.percent).toBeCloseTo(99.9, 6)
  })

  it('leaves the comparison out when the previous period was not fetched', () => {
    const figures = collectFigures(summary, null, ['revenue'])
    expect(figures[0].change).toBeNull()
  })

  it('keeps a zero figure visible', () => {
    expect(collectFigures(summary, previous, ['lowStock']).map((f) => f.value)).toEqual([0])
  })
})
