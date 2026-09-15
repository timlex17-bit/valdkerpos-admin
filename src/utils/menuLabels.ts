/**
 * The i18n key for a module's label, shared by the sidebar and the Users
 * page permission switches so a module is called the same thing in both
 * places, in every language.
 */

const camel = (key: string) => key.replace(/[-_]([a-z])/g, (_, char: string) => char.toUpperCase())

// Module keys whose label lives under another name. "reports" is both a
// sidebar group and the Dashboard Summary module; without the alias the
// module read "REPORTS", the group heading.
const MODULE_LABEL_ALIASES: Record<string, string> = {
  staff: 'users',
  stock_transfers: 'transferStocks',
  backup_center: 'backupRestore',
  reports: 'dashboardSummary',
}

export function moduleLabelKey(moduleKey: string): string {
  return `menu.${MODULE_LABEL_ALIASES[moduleKey] || camel(moduleKey)}`
}

export function groupLabelKey(groupKey: string): string {
  return `menu.${camel(groupKey)}`
}

type Translate = { t: (key: string) => string; te: (key: string) => boolean }

export function translatedModuleLabel(i18n: Translate, moduleKey: string, fallback: string): string {
  const key = moduleLabelKey(moduleKey)
  return i18n.te(key) ? i18n.t(key) : fallback
}

export function translatedGroupLabel(i18n: Translate, groupKey: string, fallback: string): string {
  const key = groupLabelKey(groupKey)
  return i18n.te(key) ? i18n.t(key) : fallback
}
