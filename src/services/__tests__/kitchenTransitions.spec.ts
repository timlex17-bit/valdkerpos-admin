import { describe, expect, it } from 'vitest'
import {
  allowedKitchenTransitions,
  KITCHEN_BOARD_STATUSES,
  type KitchenStatus,
} from '../restaurantService'

/**
 * The transition table is transcribed from docs/api/RESTAURANT_API.md. The
 * server enforces it regardless of what the client believes, so getting this
 * wrong does not open a hole - it makes the board offer buttons that always
 * come back 400. This pins it to the contract so a drift is a failing test
 * rather than a dead button a cook keeps pressing.
 */
const CONTRACT: Record<KitchenStatus, KitchenStatus[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED', 'CANCELLED'],
  SERVED: [],
  CANCELLED: [],
}

describe('kitchen status transitions', () => {
  it.each(Object.keys(CONTRACT) as KitchenStatus[])('%s offers exactly what the contract allows', (from) => {
    expect([...allowedKitchenTransitions(from)].sort()).toEqual([...CONTRACT[from]].sort())
  })

  it('treats SERVED and CANCELLED as terminal', () => {
    expect(allowedKitchenTransitions('SERVED')).toEqual([])
    expect(allowedKitchenTransitions('CANCELLED')).toEqual([])
  })

  it('never offers a backward move', () => {
    const order: KitchenStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED']

    order.forEach((from, index) => {
      for (const to of allowedKitchenTransitions(from)) {
        if (to === 'CANCELLED') continue
        expect(order.indexOf(to), `${from} -> ${to} goes backwards`).toBeGreaterThan(index)
      }
    })
  })

  it('never offers a skip of more than one step', () => {
    const order: KitchenStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED']

    order.forEach((from, index) => {
      for (const to of allowedKitchenTransitions(from)) {
        if (to === 'CANCELLED') continue
        expect(order.indexOf(to) - index, `${from} -> ${to} skips a state`).toBe(1)
      }
    })
  })

  it('shows only the three statuses that stay on the board', () => {
    // SERVED and CANCELLED leave the board, so they get no column.
    expect(KITCHEN_BOARD_STATUSES).toEqual(['PENDING', 'PREPARING', 'READY'])
    expect(KITCHEN_BOARD_STATUSES).not.toContain('SERVED')
    expect(KITCHEN_BOARD_STATUSES).not.toContain('CANCELLED')
  })
})
