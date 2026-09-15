/**
 * Plain logic behind the Backup Center's restore flow, kept out of the view
 * so it can be tested without mounting it.
 *
 * A full restore is destructive: the backend deletes every row the shop has
 * that the chosen backup doesn't, and clears some sections outright before
 * writing the backup's rows back. Its dry-run reports, per section, how many
 * rows the delete phase would remove (`would_delete`, counted from the same
 * querysets the real delete uses) and how many rows the backup holds
 * (`counts`). The dashboard shows those numbers as they come; it does not
 * guess which sections are cleared and which are merged, because that rule
 * lives in the backend.
 */

export type DryRunResponse = {
  valid?: boolean
  message?: string
  counts?: Record<string, number>
  would_delete?: Record<string, number>
  warnings?: string[]
  errors?: string[]
}

export type DeletionLine = {
  section: string
  label: string
  deleted: number
  inBackup: number | null
}

export type DeletionPreview = {
  /** False when the backend did not report `would_delete` at all. */
  available: boolean
  totalDeleted: number
  lines: DeletionLine[]
  /** One sentence naming every section that loses rows, e.g. "2 products and 5 orders". */
  summary: string
}

const SECTION_LABELS: Record<string, [singular: string, plural: string]> = {
  products: ['product', 'products'],
  orders: ['order', 'orders'],
  order_items: ['order item', 'order items'],
  sale_payments: ['sale payment', 'sale payments'],
  bank_ledgers: ['bank ledger entry', 'bank ledger entries'],
  bank_accounts: ['bank account', 'bank accounts'],
  payment_methods: ['payment method', 'payment methods'],
  purchases: ['purchase', 'purchases'],
  purchase_items: ['purchase item', 'purchase items'],
  expenses: ['expense', 'expenses'],
  customers: ['customer', 'customers'],
  suppliers: ['supplier', 'suppliers'],
  categories: ['category', 'categories'],
  units: ['unit', 'units'],
  warehouses: ['warehouse', 'warehouses'],
  warehouse_stocks: ['warehouse stock row', 'warehouse stock rows'],
  stock_movements: ['stock movement', 'stock movements'],
  stock_adjustments: ['stock adjustment', 'stock adjustments'],
  stock_transfers: ['stock transfer', 'stock transfers'],
  stock_transfer_items: ['stock transfer item', 'stock transfer items'],
  inventory_counts: ['inventory count', 'inventory counts'],
  inventory_count_items: ['inventory count item', 'inventory count items'],
  product_returns: ['product return', 'product returns'],
  product_return_items: ['product return item', 'product return items'],
  shifts: ['shift', 'shifts'],
  banners: ['banner', 'banners'],
  tables: ['table', 'tables'],
}

/**
 * Sections the warning names first. The backend lists `would_delete` in the
 * order its delete phase runs, which puts bank ledger entries first and
 * products thirteenth; in one long sentence "2 products" then comes last,
 * where nobody reads it. The warning only helps if the numbers that matter
 * are read before the button is pressed. Everything else keeps the backend's
 * order after these.
 */
const LEADING_SECTIONS = ['products', 'orders']

export function sectionLabel(section: string, count: number): string {
  const known = SECTION_LABELS[section]
  if (known) return count === 1 ? known[0] : known[1]
  // A section the backend added after this list was written still reads
  // sensibly instead of disappearing from the warning.
  return section.replace(/_/g, ' ')
}

function joinWithAnd(parts: string[], andWord = 'and'): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} ${andWord} ${parts[parts.length - 1]}`
}

export type DeletionPreviewWording = {
  /** Label for `count` rows of `section`; defaults to the English labels above. */
  label?: (section: string, count: number) => string
  /** The word joining the last two parts of the summary ("and"). */
  andWord?: string
}

export function buildDeletionPreview(
  dryRun: DryRunResponse | null | undefined,
  wording: DeletionPreviewWording = {},
): DeletionPreview {
  const labelFor = wording.label || sectionLabel
  const wouldDelete = dryRun?.would_delete
  if (!wouldDelete || typeof wouldDelete !== 'object') {
    return { available: false, totalDeleted: 0, lines: [], summary: '' }
  }

  const counts = dryRun?.counts || {}
  const rank = (section: string) => {
    const index = LEADING_SECTIONS.indexOf(section)
    return index === -1 ? LEADING_SECTIONS.length : index
  }
  const lines = Object.entries(wouldDelete)
    .map(([section, value], position) => ({ section, deleted: Number(value) || 0, position }))
    .filter((line) => line.deleted > 0)
    .sort((a, b) => rank(a.section) - rank(b.section) || a.position - b.position)
    .map(({ section, deleted }) => ({ section, deleted }))
    .map((line) => ({
      ...line,
      label: labelFor(line.section, line.deleted),
      inBackup: typeof counts[line.section] === 'number' ? counts[line.section] : null,
    }))

  const totalDeleted = lines.reduce((sum, line) => sum + line.deleted, 0)
  const summary = joinWithAnd(
    lines.map((line) => `${line.deleted} ${line.label}`),
    wording.andWord,
  )
  return { available: true, totalDeleted, lines, summary }
}

/**
 * File name from a Content-Disposition header, or '' when there is none.
 * Handles RFC 5987 `filename*=UTF-8''...` as well as quoted and bare
 * `filename=`.
 */
export function filenameFromContentDisposition(header: unknown): string {
  if (typeof header !== 'string' || !header) return ''

  const extended = header.match(/filename\*\s*=\s*(?:[\w-]+)?'[^']*'([^;]+)/i)
  if (extended) {
    try {
      return sanitizeFilename(decodeURIComponent(extended[1].trim().replace(/^"|"$/g, '')))
    } catch {
      // fall through to the plain parameter
    }
  }

  const quoted = header.match(/filename\s*=\s*"([^"]*)"/i)
  if (quoted) return sanitizeFilename(quoted[1])

  const bare = header.match(/filename\s*=\s*([^;]+)/i)
  return bare ? sanitizeFilename(bare[1].trim()) : ''
}

function sanitizeFilename(name: string): string {
  // Only the last path segment; a header is server input, not a path to follow.
  return name.split(/[\\/]/).pop()?.trim() || ''
}

export type RestoreHistoryEntry = {
  id: number
  metadata?: { safety_backup_id?: number | null } | null
}

/**
 * The safety backup the backend took before a given restore, if any.
 * Returns undefined when the restore is not in the list (so the caller can
 * say nothing rather than claim no safety backup was made), null when the
 * restore is listed but none was taken.
 */
export function safetyBackupIdFor(restores: unknown, restoreId: number): number | null | undefined {
  if (!Array.isArray(restores)) return undefined
  const entry = (restores as RestoreHistoryEntry[]).find((item) => Number(item?.id) === Number(restoreId))
  if (!entry) return undefined
  const value = entry.metadata?.safety_backup_id
  return typeof value === 'number' ? value : null
}
