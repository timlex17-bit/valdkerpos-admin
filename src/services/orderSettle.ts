/**
 * Settling an open bill: POST /api/orders/{id}/settle/
 * (backend docs/api/OPEN_BILL_SETTLE_API.md).
 *
 * The backend is the authority on every rule here and checks all of them
 * again. The dashboard repeats the checks that can be answered from the form
 * alone so the button only enables for a payment the backend will accept:
 * payments must add up to the order total exactly, amounts are positive with
 * at most two decimals, a method that requires a bank account gets one, a
 * CASH method gets none.
 *
 * Money is handled in integer cents. Summing "4.10" + "5.20" as floats gives
 * 9.299999999999999, and an exact-equality rule cannot survive that.
 */

export type PaymentMethodOption = {
  id: number
  name: string
  payment_type: string
  requires_bank_account: boolean
}

export type BankAccountOption = {
  id: number
  name: string
}

export type SettleRow = {
  paymentMethodId: number | null
  bankAccountId: number | null
  amount: string
  referenceNumber: string
}

export type SettleRowIssue = 'method_required' | 'amount_invalid' | 'bank_required' | 'bank_not_allowed'

export type SettleCheck = {
  totalCents: number
  paidCents: number
  /** total - paid; negative when payments exceed the total. */
  remainingCents: number
  rowIssues: SettleRowIssue[][]
  canSubmit: boolean
}

/** Cents from a decimal string or number, or null when it is not a valid amount. */
export function toCents(value: unknown): number | null {
  const text = typeof value === 'number' ? String(value) : String(value ?? '').trim()
  const match = text.match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

export function methodIsCash(method: PaymentMethodOption | undefined): boolean {
  return String(method?.payment_type || '').toUpperCase() === 'CASH'
}

export function checkSettle(
  rows: SettleRow[],
  methods: PaymentMethodOption[],
  orderTotal: unknown,
): SettleCheck {
  const totalCents = toCents(orderTotal) ?? 0
  let paidCents = 0

  const rowIssues = rows.map((row) => {
    const issues: SettleRowIssue[] = []
    const method = methods.find((item) => item.id === row.paymentMethodId)

    if (!method) issues.push('method_required')

    const cents = toCents(row.amount)
    if (cents === null || cents <= 0) {
      issues.push('amount_invalid')
    } else {
      paidCents += cents
    }

    if (method?.requires_bank_account && !row.bankAccountId) issues.push('bank_required')
    if (methodIsCash(method) && row.bankAccountId) issues.push('bank_not_allowed')

    return issues
  })

  const remainingCents = totalCents - paidCents
  const canSubmit =
    rows.length > 0 && totalCents > 0 && remainingCents === 0 && rowIssues.every((issues) => issues.length === 0)

  return { totalCents, paidCents, remainingCents, rowIssues, canSubmit }
}

export function buildSettlePayload(rows: SettleRow[], clientSettleId: string) {
  return {
    client_settle_id: clientSettleId,
    payments: rows.map((row) => {
      const payment: Record<string, unknown> = {
        payment_method_id: row.paymentMethodId,
        amount: formatCents(toCents(row.amount) ?? 0),
      }
      if (row.bankAccountId) payment.bank_account_id = row.bankAccountId
      if (row.referenceNumber.trim()) payment.reference_number = row.referenceNumber.trim()
      return payment
    }),
  }
}

/** A fresh idempotency key for one settle attempt (kept across retries of it). */
export function newClientSettleId(prefix = 'dashboard-settle'): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${random}`
}

export type SettleErrors = {
  general: string[]
  /** Messages per payment row, parallel to the rows sent. */
  rows: string[][]
}

function leafMessages(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (Array.isArray(value)) return value.flatMap(leafMessages)
  if (value && typeof value === 'object') return Object.values(value).flatMap(leafMessages)
  return []
}

/**
 * Split a refused settle's body into messages for the whole form and
 * messages for each payment row. `payments` is either a list of strings
 * (about the payments as a whole: missing, total mismatch) or a list of
 * objects parallel to the array sent, `{}` for a row that was fine.
 */
export function parseSettleErrors(data: unknown, rowCount: number): SettleErrors {
  const result: SettleErrors = { general: [], rows: Array.from({ length: rowCount }, () => []) }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return result

  const body = data as Record<string, unknown>
  for (const [key, value] of Object.entries(body)) {
    if (key !== 'payments') {
      result.general.push(...leafMessages(value))
      continue
    }

    const entries = Array.isArray(value) ? value : [value]
    const perRow = entries.some((entry) => entry && typeof entry === 'object')
    if (!perRow) {
      result.general.push(...leafMessages(entries))
      continue
    }
    entries.forEach((entry, index) => {
      const messages = leafMessages(entry)
      if (!messages.length) return
      if (index < rowCount) result.rows[index].push(...messages)
      else result.general.push(...messages)
    })
  }
  return result
}
