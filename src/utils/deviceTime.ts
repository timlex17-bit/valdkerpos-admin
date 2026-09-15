/**
 * The device's own clock as an ISO 8601 timestamp with its UTC offset, e.g.
 * "2026-09-15T14:30:00+09:00".
 *
 * Orders carry this as `device_time`. The backend compares it with its own
 * clock to fill `time_drift_seconds` and `is_time_suspicious`, and refuses an
 * order without it. It has to be the local wall-clock time with the offset
 * spelled out: `toISOString()` gives UTC with "Z", which hides the device's
 * time zone, and a local time without an offset is rejected as naive.
 */
export function deviceTimeIso(date: Date = new Date()): string {
  const pad = (value: number, length = 2) => String(Math.trunc(Math.abs(value))).padStart(length, '0')

  // getTimezoneOffset() is minutes BEHIND UTC: -540 for UTC+09:00.
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const offset = `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    offset
  )
}
