import { describe, expect, it } from 'vitest'
import {
  buildDeletionPreview,
  filenameFromContentDisposition,
  safetyBackupIdFor,
  sectionLabel,
} from '../backupRestore'

describe('buildDeletionPreview', () => {
  // Shape of the dry-run response after backend commit 5602020, for the
  // walkthrough case: two products and one order added after the backup.
  const dryRun = {
    valid: true,
    counts: { products: 1, orders: 4, sale_payments: 4, shifts: 1, customers: 1 },
    would_delete: {
      bank_ledgers: 5,
      sale_payments: 5,
      orders: 5,
      order_items: 5,
      shifts: 1,
      banners: 0,
      products: 2,
      customers: 0,
    },
  }

  it('lists only sections that lose rows, with the backup count beside each', () => {
    const preview = buildDeletionPreview(dryRun)
    expect(preview.available).toBe(true)
    expect(preview.lines.map((line) => line.section)).toEqual([
      'bank_ledgers',
      'sale_payments',
      'orders',
      'order_items',
      'shifts',
      'products',
    ])
    expect(preview.lines.find((line) => line.section === 'products')).toEqual({
      section: 'products',
      label: 'products',
      deleted: 2,
      inBackup: 1,
    })
    expect(preview.lines.find((line) => line.section === 'bank_ledgers')?.inBackup).toBeNull()
    expect(preview.totalDeleted).toBe(23)
  })

  it('reads as a sentence with singular and plural labels', () => {
    const preview = buildDeletionPreview({ would_delete: { products: 2, orders: 1, shifts: 0 } })
    expect(preview.summary).toBe('2 products and 1 order')
  })

  it('reports nothing to delete as available with no lines', () => {
    const preview = buildDeletionPreview({ would_delete: { products: 0, orders: 0 } })
    expect(preview).toEqual({ available: true, totalDeleted: 0, lines: [], summary: '' })
  })

  it('says the preview is unavailable when the backend does not send would_delete', () => {
    // An older backend: the dashboard must not present this as "nothing
    // will be deleted".
    expect(buildDeletionPreview({ valid: true, counts: { products: 1 } }).available).toBe(false)
    expect(buildDeletionPreview(null).available).toBe(false)
  })

  it('keeps an unknown section visible under a readable name', () => {
    expect(sectionLabel('kitchen_tickets', 3)).toBe('kitchen tickets')
    expect(buildDeletionPreview({ would_delete: { kitchen_tickets: 3 } }).summary).toBe('3 kitchen tickets')
  })
})

describe('filenameFromContentDisposition', () => {
  it('reads the header Django FileResponse sends', () => {
    expect(
      filenameFromContentDisposition('attachment; filename="QARETAIL_backup_28_20260915_080711_725943.zip"'),
    ).toBe('QARETAIL_backup_28_20260915_080711_725943.zip')
  })

  it('prefers the RFC 5987 form and decodes it', () => {
    expect(
      filenameFromContentDisposition(
        "attachment; filename=\"fallback.zip\"; filename*=utf-8''Toko%20Ba%C3%B1o_backup.zip",
      ),
    ).toBe('Toko Baño_backup.zip')
  })

  it('accepts a bare filename and strips any path', () => {
    expect(filenameFromContentDisposition('attachment; filename=backup.zip')).toBe('backup.zip')
    expect(filenameFromContentDisposition('attachment; filename="../../etc/backup.zip"')).toBe('backup.zip')
  })

  it('returns empty when the header is missing or has no name', () => {
    expect(filenameFromContentDisposition(undefined)).toBe('')
    expect(filenameFromContentDisposition('attachment')).toBe('')
  })
})

describe('safetyBackupIdFor', () => {
  const restores = [
    { id: 2, metadata: {} },
    { id: 1, metadata: { safety_backup_id: 29 } },
  ]

  it('finds the safety backup taken before a restore', () => {
    expect(safetyBackupIdFor(restores, 1)).toBe(29)
  })

  it('distinguishes "none taken" from "restore not listed"', () => {
    expect(safetyBackupIdFor(restores, 2)).toBeNull()
    expect(safetyBackupIdFor(restores, 99)).toBeUndefined()
    expect(safetyBackupIdFor({ results: [] }, 1)).toBeUndefined()
  })
})
