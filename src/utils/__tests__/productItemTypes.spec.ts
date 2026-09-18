import { describe, expect, it } from 'vitest'
import { ALL_ITEM_TYPES, itemTypesForBusiness, showsItemTypeChoice } from '../productItemTypes'

describe('itemTypesForBusiness', () => {
  it('offers a workshop its services and spare parts', () => {
    expect(itemTypesForBusiness('WORKSHOP')).toEqual(['service', 'sparepart', 'product'])
  })

  it('offers a restaurant its menu', () => {
    expect(itemTypesForBusiness('RESTAURANT')).toEqual(['menu', 'product'])
  })

  it('gives a retail shop products and nothing to choose', () => {
    expect(itemTypesForBusiness('RETAIL')).toEqual(['product'])
    expect(itemTypesForBusiness('retail')).toEqual(['product'])
    expect(itemTypesForBusiness(undefined)).toEqual(['product'])
  })

  it('never offers a kind the backend would reject', () => {
    const offered = new Set([
      ...itemTypesForBusiness('WORKSHOP'),
      ...itemTypesForBusiness('RESTAURANT'),
      ...itemTypesForBusiness('RETAIL'),
    ])

    expect([...offered].every((type) => ALL_ITEM_TYPES.includes(type))).toBe(true)
  })
})

describe('showsItemTypeChoice', () => {
  it('hides the field from a retail shop adding a product', () => {
    expect(showsItemTypeChoice('RETAIL', 'product')).toBe(false)
    expect(showsItemTypeChoice('RETAIL', '')).toBe(false)
  })

  it('shows it wherever there is a choice to make', () => {
    expect(showsItemTypeChoice('WORKSHOP', 'service')).toBe(true)
    expect(showsItemTypeChoice('RESTAURANT', 'product')).toBe(true)
  })

  it('shows it for a retail item that is not a product', () => {
    // A shop that used to be a workshop still has its services. Hiding the
    // field would turn one into a product on the next save.
    expect(showsItemTypeChoice('RETAIL', 'service')).toBe(true)
  })
})
