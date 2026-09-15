import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('../api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }))

const { withdrawRefusedModules } = await import('../moduleContract')

const contractWith = (granted: boolean) => ({
  shop: null,
  modules: [
    { key: 'dashboard', label: 'Dashboard', group: 'Core', plan_level: 'BASIC', business_types: [], implemented: true, valid_for_shop: true, granted },
    { key: 'products', label: 'Products', group: 'Inventory', plan_level: 'BASIC', business_types: [], implemented: true, valid_for_shop: true, granted: true },
  ],
})

const rejectWith = (status?: number) => Promise.reject(status ? { response: { status } } : new Error('offline'))

describe('withdrawRefusedModules', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('hides the dashboard from a user its summary endpoint refuses', async () => {
    // inventory_staff: granted by role default, refused by the endpoint.
    get.mockImplementation(() => rejectWith(403))
    const contract = contractWith(true)
    await withdrawRefusedModules(contract)
    expect(get).toHaveBeenCalledWith('/api/dashboard/summary/')
    expect(contract.modules.map((m) => m.granted)).toEqual([false, true])
  })

  it('keeps the dashboard for a user the endpoint admits', async () => {
    get.mockResolvedValue({ status: 200 })
    const contract = contractWith(true)
    await withdrawRefusedModules(contract)
    expect(contract.modules[0].granted).toBe(true)
  })

  it('does not take access away on a network error or a server error', async () => {
    for (const status of [undefined, 500]) {
      get.mockImplementation(() => rejectWith(status))
      const contract = contractWith(true)
      await withdrawRefusedModules(contract)
      expect(contract.modules[0].granted).toBe(true)
    }
  })

  it('does not probe a module the backend did not grant', async () => {
    const contract = contractWith(false)
    await withdrawRefusedModules(contract)
    expect(get).not.toHaveBeenCalled()
  })
})
