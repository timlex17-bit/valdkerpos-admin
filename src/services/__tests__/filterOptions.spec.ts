import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('../api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }))

const { clearFilterOptions, loadFilterOptions } = await import('../filterOptions')

describe('loadFilterOptions', () => {
  beforeEach(() => {
    get.mockReset()
    clearFilterOptions()
  })

  it('turns a staff list into names, sorted, keeping the id as the value', async () => {
    get.mockResolvedValue({
      data: {
        results: [
          { id: 19, full_name: 'QA Retail', username: 'qa_retail' },
          { id: 40, full_name: '', username: 'ui_stock_clerk' },
        ],
      },
    })

    expect(await loadFilterOptions('cashier')).toEqual([
      { value: '19', label: 'QA Retail' },
      { value: '40', label: 'ui_stock_clerk' },
    ])
    expect(get).toHaveBeenCalledWith('/api/staff/', { params: { page_size: 500 } })
  })

  it('accepts a bare array as well as a paginated response', async () => {
    get.mockResolvedValue({ data: [{ id: 8, name: 'Main Warehouse' }] })
    expect(await loadFilterOptions('warehouse')).toEqual([{ value: '8', label: 'Main Warehouse' }])
  })

  it('asks once and reuses the answer', async () => {
    get.mockResolvedValue({ data: { results: [{ id: 1, name: 'A' }] } })
    await loadFilterOptions('customer')
    await loadFilterOptions('customer')
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('reports a list it may not read as unavailable rather than empty', async () => {
    // An inventory user asking for /api/suppliers/ gets 403. Returning [] would
    // show an empty dropdown and hide the filter entirely.
    get.mockImplementation(() => Promise.reject({ response: { status: 403 } }))
    expect(await loadFilterOptions('supplier')).toBeNull()
  })

  it('leaves out rows with no id or no name', async () => {
    get.mockResolvedValue({ data: { results: [{ id: 3, name: '' }, { name: 'No id' }, { id: 4, name: 'Real' }] } })
    expect(await loadFilterOptions('product')).toEqual([{ value: '4', label: 'Real' }])
  })
})

describe('duplicate names', () => {
  beforeEach(() => {
    get.mockReset()
    clearFilterOptions()
  })

  it('tells two people with the same name apart', async () => {
    // Picking the wrong "UI Inventory" would quietly report the wrong
    // person's sales.
    get.mockResolvedValue({
      data: {
        results: [
          { id: 38, full_name: 'UI Inventory', username: 'ui_inventory' },
          { id: 39, full_name: 'UI Inventory', username: 'ui_inventory2' },
          { id: 19, full_name: 'QA Retail', username: 'qa_retail' },
        ],
      },
    })

    expect(await loadFilterOptions('cashier')).toEqual([
      { value: '19', label: 'QA Retail' },
      { value: '38', label: 'UI Inventory (ui_inventory)' },
      { value: '39', label: 'UI Inventory (ui_inventory2)' },
    ])
  })
})
