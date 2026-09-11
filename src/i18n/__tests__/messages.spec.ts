import { describe, expect, it } from 'vitest'
import { baseCompile } from '@intlify/message-compiler'
import en from '../en'
import id from '../id'
import tet from '../tet'

/**
 * vue-i18n compiles every message as a template, so `{` opens an
 * interpolation and `@` opens a linked message. A message containing either
 * one literally throws every single time it is rendered - which reads to the
 * user as a page that simply fails to draw, or a button that does nothing.
 *
 * Eyeballing the files does not catch this. These tests hand each message to
 * the compiler vue-i18n itself uses.
 */
const locales = { en, id, tet } as Record<string, Record<string, unknown>>

function flatten(obj: Record<string, unknown>, prefix = '', out: Record<string, unknown> = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value as Record<string, unknown>, path, out)
    } else {
      out[path] = value
    }
  }
  return out
}

const flat = Object.fromEntries(
  Object.entries(locales).map(([name, messages]) => [name, flatten(messages)])
) as Record<string, Record<string, unknown>>

describe.each(Object.keys(locales))('locale %s', (name) => {
  it('compiles every message', () => {
    const failures: string[] = []

    for (const [key, value] of Object.entries(flat[name])) {
      if (typeof value !== 'string') continue
      try {
        baseCompile(value)
      } catch (error) {
        failures.push(`${key}: ${JSON.stringify(value)} -> ${(error as Error).message.split('\n')[0]}`)
      }
    }

    expect(failures, failures.join('\n')).toEqual([])
  })
})

describe('locale key parity', () => {
  // A key present in `en` but missing from `id` or `tet` reaches the user as
  // the raw key.
  it.each(['id', 'tet'])('%s has exactly the keys en has', (name) => {
    const enKeys = Object.keys(flat.en).sort()
    const otherKeys = Object.keys(flat[name]).sort()

    const missing = enKeys.filter((key) => !otherKeys.includes(key))
    const extra = otherKeys.filter((key) => !enKeys.includes(key))

    expect(missing, `missing from ${name}: ${missing.join(', ')}`).toEqual([])
    expect(extra, `present only in ${name}: ${extra.join(', ')}`).toEqual([])
  })
})
