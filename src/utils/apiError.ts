/**
 * The one place an API error is turned into text for the screen.
 *
 * An unhandled exception on the Django side answers with its debug page: an
 * HTML document when the client accepts HTML, a plain-text traceback when it
 * asks for JSON (which ours does). Either way it is pages of stack trace that
 * leak server file paths and settings and tell the user nothing. This used to
 * be guarded in two places and missed in sixteen more, each view carrying its
 * own copy of "if the body is a string, show it". Everything goes through
 * here now.
 */

const MAX_PLAIN_MESSAGE = 300

/** True for bodies that are a debug page rather than a message. */
export function looksLikeDebugPage(text: string): boolean {
  const value = text.trim()
  return (
    !value ||
    value.startsWith('<') ||
    value.includes('Traceback (most recent call last)') ||
    value.includes('Request Method:') ||
    value.includes('Exception Location:') ||
    value.length > MAX_PLAIN_MESSAGE
  )
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Leaf messages of a DRF error body, e.g.
 *   {"name": ["A table with this name already exists."]}
 *   {"pos_settings": {"tax_percent": ["Tax percent cannot exceed 100."]}}
 * Each comes back labelled with its own field name ("Tax Percent: ..."), not
 * the full dotted path, which reads as implementation detail on screen.
 */
function collectFieldMessages(data: unknown, key = ''): string[] {
  if (data === null || data === undefined) return []

  if (Array.isArray(data)) {
    const leaves = data.filter((entry) => typeof entry !== 'object' || entry === null)
    const nested = data.filter((entry) => entry && typeof entry === 'object')
    const messages: string[] = []
    if (leaves.length) {
      const text = leaves.map(String).join(', ')
      messages.push(key ? `${humanizeKey(key)}: ${text}` : text)
    }
    nested.forEach((entry) => messages.push(...collectFieldMessages(entry, key)))
    return messages
  }

  if (typeof data === 'object') {
    return Object.entries(data as Record<string, unknown>).flatMap(([childKey, value]) =>
      collectFieldMessages(value, childKey === 'non_field_errors' ? '' : childKey),
    )
  }

  const text = String(data).trim()
  if (!text) return []
  return [key ? `${humanizeKey(key)}: ${text}` : text]
}

export type ApiErrorOptions = {
  /**
   * Report every field error joined together instead of only the first.
   * Forms that post many fields at once (staff, POS settings) want all of
   * them; single-purpose actions read better with one.
   */
  allFields?: boolean
}

/**
 * Screen-safe message for a failed request.
 *
 * - A short plain string body is a real message and is shown as sent.
 * - A debug page is never shown; the fallback is, with the status code for
 *   server errors so there is still something to quote to support.
 * - A JSON body yields `detail`, the reason, or `message` when present,
 *   otherwise its field errors. Several endpoints answer a refused request
 *   with a generic headline in `message` ("Restore failed.") and the actual
 *   reason in `error` or `errors`; for a 4xx the reason wins, because the
 *   headline alone tells the user nothing they can act on. For a 5xx the
 *   reason is a raw exception string, so the headline stays in front.
 * - No response at all (network failure, CORS) yields the fallback.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  options: ApiErrorOptions = {},
): string {
  const response = (error as { response?: { data?: unknown; status?: number } } | null)?.response
  const data = response?.data
  const status = response?.status
  const withStatus = status && status >= 500 ? `${fallback} (server error ${status})` : fallback

  if (!response) return fallback

  if (typeof data === 'string') {
    return looksLikeDebugPage(data) ? withStatus : data.trim()
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const body = data as Record<string, unknown>
    const reasonsFirst = !status || status < 500
    const keys = reasonsFirst ? ['detail', 'error', 'errors', 'message'] : ['detail', 'message', 'error', 'errors']

    for (const key of keys) {
      const value = body[key]
      const text = Array.isArray(value)
        ? value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim()).join('; ')
        : value
      if (typeof text === 'string' && text.trim() && !looksLikeDebugPage(text)) {
        return text.trim()
      }
    }

    const messages = collectFieldMessages(body).filter((message) => !looksLikeDebugPage(message))
    if (messages.length) {
      return options.allFields ? messages.join(' | ') : messages[0]
    }
  }

  if (Array.isArray(data)) {
    const messages = collectFieldMessages(data).filter((message) => !looksLikeDebugPage(message))
    if (messages.length) return options.allFields ? messages.join(' | ') : messages[0]
  }

  return withStatus
}
