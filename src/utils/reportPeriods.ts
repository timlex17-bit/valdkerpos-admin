/**
 * Report periods and the period each one is fairly compared against.
 *
 * An owner reads "revenue this month" as an answer only when they can see
 * whether it is better or worse than before, so every preset names its own
 * comparison. The comparison is always stated on screen rather than implied:
 * a month-to-date figure is compared with the same days of the previous month,
 * never with a full previous month, which would make every month look like a
 * collapse until its last day.
 */

export type PeriodPreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'custom'

export type DateRange = { start: string; end: string }

export const PERIOD_PRESETS: PeriodPreset[] = [
  'today',
  'yesterday',
  'last7',
  'thisMonth',
  'lastMonth',
  'custom',
]

/** Local calendar day, not UTC: a shop's day is the day it is in the shop. */
export function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseIsoDate(value: string) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function addDays(date: Date, days: number) {
  const copy = new Date(date.getTime())
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Whole days between two ISO dates, both ends counted. */
export function daysInRange(range: DateRange) {
  const start = parseIsoDate(range.start).getTime()
  const end = parseIsoDate(range.end).getTime()
  return Math.floor((end - start) / 86400000) + 1
}

/** Last day of the month `date` falls in, so 31 January maps onto 28/29 February. */
function clampToMonth(year: number, month: number, day: number) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, lastDay))
}

export function resolvePeriod(preset: PeriodPreset, today = new Date()): DateRange | null {
  const end = toIsoDate(today)

  if (preset === 'today') return { start: end, end }

  if (preset === 'yesterday') {
    const day = toIsoDate(addDays(today, -1))
    return { start: day, end: day }
  }

  // Seven days including today, the way a shop counts "the last week".
  if (preset === 'last7') return { start: toIsoDate(addDays(today, -6)), end }

  if (preset === 'thisMonth') {
    return { start: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), end }
  }

  if (preset === 'lastMonth') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const last = new Date(today.getFullYear(), today.getMonth(), 0)
    return { start: toIsoDate(first), end: toIsoDate(last) }
  }

  // 'custom': whatever dates the owner typed stand as they are.
  return null
}

/** Which preset, if any, the current dates already describe. */
export function matchPreset(range: DateRange, today = new Date()): PeriodPreset {
  const found = PERIOD_PRESETS.filter((preset) => preset !== 'custom').find((preset) => {
    const candidate = resolvePeriod(preset, today)
    return candidate && candidate.start === range.start && candidate.end === range.end
  })

  return found || 'custom'
}

/**
 * The period a range is compared against.
 *
 * Month-to-date compares with the same days of the previous month; a full
 * calendar month with the whole month before it; anything else with the equally
 * long stretch that ended the day before it started.
 */
export function comparisonPeriod(range: DateRange, today = new Date()): DateRange {
  const start = parseIsoDate(range.start)
  const end = parseIsoDate(range.end)
  const isMonthToDate =
    start.getDate() === 1 &&
    start.getMonth() === today.getMonth() &&
    start.getFullYear() === today.getFullYear() &&
    range.end === toIsoDate(today)

  if (isMonthToDate) {
    const previousMonth = new Date(start.getFullYear(), start.getMonth() - 1, 1)
    return {
      start: toIsoDate(previousMonth),
      end: toIsoDate(
        clampToMonth(previousMonth.getFullYear(), previousMonth.getMonth(), end.getDate())
      ),
    }
  }

  const isWholeMonth =
    start.getDate() === 1 && end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()

  if (isWholeMonth && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const previousMonth = new Date(start.getFullYear(), start.getMonth() - 1, 1)
    return {
      start: toIsoDate(previousMonth),
      end: toIsoDate(new Date(start.getFullYear(), start.getMonth(), 0)),
    }
  }

  const length = daysInRange(range)
  const previousEnd = addDays(start, -1)
  return { start: toIsoDate(addDays(previousEnd, -(length - 1))), end: toIsoDate(previousEnd) }
}

export type Change = {
  /** null when there is nothing honest to compare against. */
  percent: number | null
  direction: 'up' | 'down' | 'flat'
  /** the previous period had nothing, so a percentage would be meaningless. */
  fromNothing: boolean
}

/**
 * Percentage change, refusing to invent one. A previous period of zero gives
 * no percentage (dividing by nothing), and a previous period that was negative
 * - a month of refunds - gives none either, because "up 300%" from a loss
 * reads as growth when it is not.
 */
export function changeBetween(current: number | null, previous: number | null): Change | null {
  if (current === null || previous === null || !Number.isFinite(current) || !Number.isFinite(previous)) {
    return null
  }

  if (previous === 0) {
    if (current === 0) return { percent: null, direction: 'flat', fromNothing: true }
    return { percent: null, direction: current > 0 ? 'up' : 'down', fromNothing: true }
  }

  const direction = current > previous ? 'up' : current < previous ? 'down' : 'flat'
  if (previous < 0) return { percent: null, direction, fromNothing: false }

  return { percent: ((current - previous) / previous) * 100, direction, fromNothing: false }
}
