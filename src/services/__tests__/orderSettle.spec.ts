import { describe, expect, it } from 'vitest'
import {
  buildSettlePayload,
  checkSettle,
  formatCents,
  newClientSettleId,
  parseSettleErrors,
  toCents,
  type PaymentMethodOption,
  type SettleRow,
} from '../orderSettle'

const methods: PaymentMethodOption[] = [
  { id: 1, name: 'Tunai', payment_type: 'CASH', requires_bank_account: false },
  { id: 2, name: 'Transfer BNU', payment_type: 'BANK', requires_bank_account: true },
  { id: 3, name: 'QRIS', payment_type: 'QRIS', requires_bank_account: false },
]

const row = (over: Partial<SettleRow>): SettleRow => ({
  paymentMethodId: null,
  bankAccountId: null,
  amount: '',
  referenceNumber: '',
  ...over,
})

describe('toCents / formatCents', () => {
  it('parses decimal strings exactly', () => {
    expect(toCents('10.00')).toBe(1000)
    expect(toCents('4.1')).toBe(410)
    expect(toCents('0.05')).toBe(5)
    expect(toCents(' 7 ')).toBe(700)
    expect(toCents(2.5)).toBe(250)
  })

  it('refuses what the backend would refuse', () => {
    expect(toCents('1.234')).toBeNull()
    expect(toCents('-1.00')).toBeNull()
    expect(toCents('abc')).toBeNull()
    expect(toCents('')).toBeNull()
  })

  it('formats back without float noise', () => {
    expect(formatCents(930)).toBe('9.30')
    expect(formatCents(5)).toBe('0.05')
    expect(formatCents(-120)).toBe('-1.20')
  })
})

describe('checkSettle', () => {
  it('accepts the documented split: 4.00 cash + 6.00 bank transfer for a 10.00 order', () => {
    const rows = [
      row({ paymentMethodId: 1, amount: '4.00' }),
      row({ paymentMethodId: 2, bankAccountId: 1, amount: '6.00', referenceNumber: 'TRX-77' }),
    ]
    const check = checkSettle(rows, methods, '10.00')
    expect(check).toMatchObject({ totalCents: 1000, paidCents: 1000, remainingCents: 0, canSubmit: true })
    expect(check.rowIssues).toEqual([[], []])
  })

  it('does not accept a total that only matches in floating point', () => {
    // 4.10 + 5.20 is 9.299999999999999 as floats.
    const rows = [row({ paymentMethodId: 1, amount: '4.10' }), row({ paymentMethodId: 3, amount: '5.20' })]
    expect(checkSettle(rows, methods, '9.30').canSubmit).toBe(true)
    expect(checkSettle(rows, methods, '9.31').remainingCents).toBe(1)
  })

  it('reports under- and over-payment', () => {
    expect(checkSettle([row({ paymentMethodId: 1, amount: '4.00' })], methods, '5.00')).toMatchObject({
      remainingCents: 100,
      canSubmit: false,
    })
    expect(checkSettle([row({ paymentMethodId: 1, amount: '6.00' })], methods, '5.00').remainingCents).toBe(-100)
  })

  it('flags each row problem', () => {
    const rows = [
      row({ amount: '1.00' }),
      row({ paymentMethodId: 2, amount: '1.00' }),
      row({ paymentMethodId: 1, bankAccountId: 1, amount: '1.00' }),
      row({ paymentMethodId: 3, amount: '0' }),
    ]
    expect(checkSettle(rows, methods, '3.00').rowIssues).toEqual([
      ['method_required'],
      ['bank_required'],
      ['bank_not_allowed'],
      ['amount_invalid'],
    ])
  })

  it('never enables settling a zero-value order or an empty payment list', () => {
    expect(checkSettle([row({ paymentMethodId: 1, amount: '0.00' })], methods, '0.00').canSubmit).toBe(false)
    expect(checkSettle([], methods, '5.00').canSubmit).toBe(false)
  })
})

describe('buildSettlePayload', () => {
  it('sends the documented shape and leaves out empty optional fields', () => {
    const rows = [
      row({ paymentMethodId: 1, amount: '4' }),
      row({ paymentMethodId: 2, bankAccountId: 1, amount: '6.5', referenceNumber: ' TRX-77 ' }),
    ]
    expect(buildSettlePayload(rows, 'tab-1')).toEqual({
      client_settle_id: 'tab-1',
      payments: [
        { payment_method_id: 1, amount: '4.00' },
        { payment_method_id: 2, bank_account_id: 1, amount: '6.50', reference_number: 'TRX-77' },
      ],
    })
  })

  it('makes a distinct idempotency key each time', () => {
    const a = newClientSettleId()
    expect(a).toMatch(/^dashboard-settle-/)
    expect(a.length).toBeLessThanOrEqual(100)
    expect(newClientSettleId()).not.toBe(a)
  })
})

describe('parseSettleErrors', () => {
  it('keeps whole-form messages general', () => {
    expect(
      parseSettleErrors({ payments: ['Total pembayaran (4.00) harus sama dengan total order (5.00).'] }, 1),
    ).toEqual({ general: ['Total pembayaran (4.00) harus sama dengan total order (5.00).'], rows: [[]] })
    expect(parseSettleErrors({ detail: 'Order ini sudah lunas.' }, 2)).toEqual({
      general: ['Order ini sudah lunas.'],
      rows: [[], []],
    })
  })

  it('puts per-payment errors on the row they belong to', () => {
    const body = {
      payments: [{}, { bank_account_id: ['Bank account wajib dipilih untuk metode pembayaran ini.'] }],
    }
    expect(parseSettleErrors(body, 2)).toEqual({
      general: [],
      rows: [[], ['Bank account wajib dipilih untuk metode pembayaran ini.']],
    })
  })

  it('survives bodies it does not recognise', () => {
    expect(parseSettleErrors('oops', 1)).toEqual({ general: [], rows: [[]] })
    expect(parseSettleErrors(null, 0)).toEqual({ general: [], rows: [] })
  })
})
