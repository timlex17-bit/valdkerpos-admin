import { describe, expect, it } from 'vitest'
import { toMultipart } from '../multipart'

describe('toMultipart', () => {
  it('encodes values the way DRF parses multipart fields', () => {
    const data = toMultipart({
      name: 'Nasi Goreng',
      sku: null,
      track_stock: true,
      is_active: false,
      sell_price: '5.00',
      stock: 3,
      category_id: null,
      skipped: undefined,
    })

    expect([...data.entries()]).toEqual([
      ['name', 'Nasi Goreng'],
      ['sku', ''],
      ['track_stock', 'true'],
      ['is_active', 'false'],
      ['sell_price', '5.00'],
      ['stock', '3'],
      ['category_id', ''],
    ])
  })

  it('attaches a file only when one is given', () => {
    const file = new Blob(['png-bytes'], { type: 'image/png' })
    const withFile = toMultipart({ name: 'A' }, { image: file })
    expect(withFile.get('image')).toBeInstanceOf(Blob)

    const withoutFile = toMultipart({ name: 'A' }, { image: null })
    expect(withoutFile.has('image')).toBe(false)
  })
})
