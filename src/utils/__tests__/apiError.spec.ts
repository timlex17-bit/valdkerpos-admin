import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { getApiErrorMessage, looksLikeDebugPage } from '../apiError'

const TRACEBACK = `OperationalError at /api/restaurant/kitchen/
no such column: pos_orderitem.kitchen_status

Request Method: GET
Request URL: http://127.0.0.1:8000/api/restaurant/kitchen/
Django Version: 5.2
Exception Location: D:\\PROJECT PRIVATE RJ\\DJANGO POS\\mypos\\venv\\Lib\\site-packages\\django\\db\\backends\\sqlite3\\base.py, line 360
Python Executable: D:\\PROJECT PRIVATE RJ\\DJANGO POS\\mypos\\venv\\Scripts\\python.exe

Traceback (most recent call last):
  File "D:\\PROJECT PRIVATE RJ\\DJANGO POS\\mypos\\pos\\views.py", line 2811, in get`

const HTML_PAGE = '<!DOCTYPE html>\n<html lang="en"><head><title>OperationalError at /api/x/</title></head></html>'

const fail = (status: number, data: unknown) => ({ response: { status, data } })

describe('getApiErrorMessage', () => {
  it('never shows a plain-text Django traceback', () => {
    const message = getApiErrorMessage(fail(500, TRACEBACK), 'Could not load.')
    expect(message).toBe('Could not load. (server error 500)')
    expect(message).not.toContain('PROJECT PRIVATE')
    expect(message).not.toContain('Traceback')
  })

  it('never shows an HTML debug page', () => {
    expect(getApiErrorMessage(fail(500, HTML_PAGE), 'Could not load.')).toBe(
      'Could not load. (server error 500)',
    )
  })

  it('does not dump a traceback that arrives inside detail', () => {
    expect(getApiErrorMessage(fail(500, { detail: TRACEBACK }), 'Failed.')).toBe(
      'Failed. (server error 500)',
    )
  })

  it('shows a short plain message as sent', () => {
    expect(getApiErrorMessage(fail(400, 'Shift already open.'), 'Failed.')).toBe('Shift already open.')
  })

  it('prefers detail, then message, then error', () => {
    expect(getApiErrorMessage(fail(403, { detail: 'Nope.' }), 'Failed.')).toBe('Nope.')
    expect(getApiErrorMessage(fail(400, { message: 'Bad.' }), 'Failed.')).toBe('Bad.')
    expect(getApiErrorMessage(fail(400, { error: 'Worse.' }), 'Failed.')).toBe('Worse.')
  })

  it('reports the first field error by default', () => {
    const body = { name: ['A table with this name already exists.'], capacity: ['Must be at least 1.'] }
    expect(getApiErrorMessage(fail(400, body), 'Failed.')).toBe(
      'Name: A table with this name already exists.',
    )
  })

  it('reports every field error, including nested ones, when asked', () => {
    const body = {
      username: ['A user with that username already exists.'],
      pos_settings: { tax_percent: ['Tax percent cannot exceed 100.'] },
    }
    expect(getApiErrorMessage(fail(400, body), 'Failed.', { allFields: true })).toBe(
      'Username: A user with that username already exists. | Tax Percent: Tax percent cannot exceed 100.',
    )
  })

  it('does not label non_field_errors', () => {
    expect(getApiErrorMessage(fail(400, { non_field_errors: ['Dates overlap.'] }), 'Failed.')).toBe(
      'Dates overlap.',
    )
  })

  it('falls back without a status suffix for client errors it cannot read', () => {
    expect(getApiErrorMessage(fail(400, {}), 'Failed.')).toBe('Failed.')
  })

  it('falls back when there is no response at all', () => {
    expect(getApiErrorMessage(new Error('Network Error'), 'Failed.')).toBe('Failed.')
    expect(getApiErrorMessage(null, 'Failed.')).toBe('Failed.')
  })
})

describe('looksLikeDebugPage', () => {
  it('flags tracebacks, HTML and over-long bodies but not ordinary messages', () => {
    expect(looksLikeDebugPage(TRACEBACK)).toBe(true)
    expect(looksLikeDebugPage(HTML_PAGE)).toBe(true)
    expect(looksLikeDebugPage('x'.repeat(301))).toBe(true)
    expect(looksLikeDebugPage('Cannot move kitchen_status from PENDING to READY.')).toBe(false)
  })
})

describe('no view formats API errors on its own', () => {
  // The regression this guards: a view growing its own
  // "if (typeof data === 'string') return data" or dumping the response body
  // with JSON.stringify, which is how a traceback reached the screen sixteen
  // separate times.
  const srcDir = resolve(__dirname, '../..')

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full)
      return /\.(vue|ts)$/.test(name) ? [full] : []
    })
  }

  const offenders = sourceFiles(srcDir)
    .filter((file) => !file.endsWith(join('utils', 'apiError.ts')))
    .flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      const hits: string[] = []
      if (/typeof\s+data\s*===\s*['"]string['"][\s\S]{0,80}?(return\s+data\b|Error\.value\s*=\s*data\b)/.test(text)) {
        hits.push('returns a raw string body')
      }
      if (/JSON\.stringify\(\s*(err|error)\??\.response/.test(text)) {
        hits.push('JSON.stringify of the response body')
      }
      return hits.map((hit) => `${relative(srcDir, file)}: ${hit}`)
    })

  it('finds none', () => {
    expect(offenders, offenders.join('\n')).toEqual([])
  })
})
