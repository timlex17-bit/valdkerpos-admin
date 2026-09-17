import { describe, expect, it } from 'vitest'
import {
  changeBetween,
  comparisonPeriod,
  daysInRange,
  matchPreset,
  resolvePeriod,
} from '../reportPeriods'

// A Wednesday in the middle of a month, so month-to-date is a partial month.
const today = new Date(2026, 8, 16)

describe('resolvePeriod', () => {
  it('reads the presets the way a shop counts them', () => {
    expect(resolvePeriod('today', today)).toEqual({ start: '2026-09-16', end: '2026-09-16' })
    expect(resolvePeriod('yesterday', today)).toEqual({ start: '2026-09-15', end: '2026-09-15' })
    expect(resolvePeriod('last7', today)).toEqual({ start: '2026-09-10', end: '2026-09-16' })
    expect(resolvePeriod('thisMonth', today)).toEqual({ start: '2026-09-01', end: '2026-09-16' })
    expect(resolvePeriod('lastMonth', today)).toEqual({ start: '2026-08-01', end: '2026-08-31' })
    expect(resolvePeriod('custom', today)).toBeNull()
  })

  it('counts seven days including today', () => {
    expect(daysInRange(resolvePeriod('last7', today)!)).toBe(7)
  })

  it('names the preset a pair of dates already describes', () => {
    expect(matchPreset({ start: '2026-09-01', end: '2026-09-16' }, today)).toBe('thisMonth')
    expect(matchPreset({ start: '2026-09-02', end: '2026-09-16' }, today)).toBe('custom')
  })
})

describe('comparisonPeriod', () => {
  it('compares month-to-date with the same days of the month before', () => {
    // Not with all of August: that would show a collapse every month until
    // the last day of the month.
    expect(comparisonPeriod({ start: '2026-09-01', end: '2026-09-16' }, today)).toEqual({
      start: '2026-08-01',
      end: '2026-08-16',
    })
  })

  it('keeps the same days when the previous month is shorter', () => {
    const march31 = new Date(2026, 2, 31)
    expect(comparisonPeriod({ start: '2026-03-01', end: '2026-03-31' }, march31)).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    })
  })

  it('compares a whole month with the whole month before it', () => {
    expect(comparisonPeriod({ start: '2026-08-01', end: '2026-08-31' }, today)).toEqual({
      start: '2026-07-01',
      end: '2026-07-31',
    })
  })

  it('compares any other stretch with the equally long one just before it', () => {
    expect(comparisonPeriod({ start: '2026-09-10', end: '2026-09-16' }, today)).toEqual({
      start: '2026-09-03',
      end: '2026-09-09',
    })
    expect(comparisonPeriod({ start: '2026-09-16', end: '2026-09-16' }, today)).toEqual({
      start: '2026-09-15',
      end: '2026-09-15',
    })
  })
})

describe('changeBetween', () => {
  it('reports a plain rise and fall', () => {
    expect(changeBetween(120, 100)).toEqual({ percent: 20, direction: 'up', fromNothing: false })
    expect(changeBetween(80, 100)).toEqual({ percent: -20, direction: 'down', fromNothing: false })
    expect(changeBetween(100, 100)).toEqual({ percent: 0, direction: 'flat', fromNothing: false })
  })

  it('gives no percentage when the previous period had nothing', () => {
    expect(changeBetween(50, 0)).toEqual({ percent: null, direction: 'up', fromNothing: true })
    expect(changeBetween(0, 0)).toEqual({ percent: null, direction: 'flat', fromNothing: true })
  })

  it('gives no percentage when the previous period was negative', () => {
    // A month of refunds: "up 300%" would read as growth out of a loss.
    expect(changeBetween(160, -80)).toEqual({ percent: null, direction: 'up', fromNothing: false })
  })

  it('says nothing at all when a number is missing', () => {
    expect(changeBetween(null, 100)).toBeNull()
    expect(changeBetween(100, null)).toBeNull()
    expect(changeBetween(Number.NaN, 100)).toBeNull()
  })
})
