import { afterEach, describe, expect, it, vi } from 'vitest'
import { deviceTimeIso } from '../deviceTime'

// Pin the zone the Date methods see without depending on the machine running
// the tests: fake getTimezoneOffset and the local getters from a UTC instant.
function dateInZone(utcIso: string, offsetMinutes: number): Date {
  const utc = new Date(utcIso)
  const local = new Date(utc.getTime() + offsetMinutes * 60_000)
  const fake = new Date(utc.getTime())
  vi.spyOn(fake, 'getTimezoneOffset').mockReturnValue(-offsetMinutes)
  vi.spyOn(fake, 'getFullYear').mockReturnValue(local.getUTCFullYear())
  vi.spyOn(fake, 'getMonth').mockReturnValue(local.getUTCMonth())
  vi.spyOn(fake, 'getDate').mockReturnValue(local.getUTCDate())
  vi.spyOn(fake, 'getHours').mockReturnValue(local.getUTCHours())
  vi.spyOn(fake, 'getMinutes').mockReturnValue(local.getUTCMinutes())
  vi.spyOn(fake, 'getSeconds').mockReturnValue(local.getUTCSeconds())
  return fake
}

afterEach(() => vi.restoreAllMocks())

// What the backend accepts: parse_datetime() must give an aware datetime.
const AWARE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/

describe('deviceTimeIso', () => {
  it('writes local wall-clock time with the offset, as in Dili (UTC+09:00)', () => {
    const value = deviceTimeIso(dateInZone('2026-09-15T05:30:00Z', 9 * 60))
    expect(value).toBe('2026-09-15T14:30:00+09:00')
    expect(value).toMatch(AWARE_ISO)
  })

  it('handles zones behind UTC and the date rolling back', () => {
    expect(deviceTimeIso(dateInZone('2026-09-15T02:05:09Z', -5 * 60))).toBe('2026-09-14T21:05:09-05:00')
  })

  it('handles half-hour offsets and UTC itself', () => {
    expect(deviceTimeIso(dateInZone('2026-09-15T05:30:00Z', 5 * 60 + 30))).toBe('2026-09-15T11:00:00+05:30')
    expect(deviceTimeIso(dateInZone('2026-09-15T05:30:00Z', 0))).toBe('2026-09-15T05:30:00+00:00')
  })

  it('never produces the UTC "Z" form or a naive time', () => {
    const value = deviceTimeIso()
    expect(value).toMatch(AWARE_ISO)
    expect(value.endsWith('Z')).toBe(false)
  })

  it('denotes the same instant as the Date it came from', () => {
    const now = new Date()
    // Seconds precision: the helper drops milliseconds on purpose.
    expect(Math.abs(new Date(deviceTimeIso(now)).getTime() - now.getTime())).toBeLessThan(1000)
  })
})
