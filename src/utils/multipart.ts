/**
 * A JSON-style payload as multipart form data, for requests that carry a file.
 *
 * Multipart has no null or boolean: null goes as an empty string (DRF reads
 * "" as None for relation fields and the serializer turns an empty sku into
 * None), booleans as "true"/"false" (DRF's BooleanField parses those), and
 * numbers as their string form. Undefined keys are left out entirely.
 */
export function toMultipart(payload: Record<string, unknown>, files: Record<string, Blob | null | undefined> = {}) {
  const data = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue
    if (value === null) data.append(key, '')
    else if (typeof value === 'boolean') data.append(key, value ? 'true' : 'false')
    else data.append(key, String(value))
  }

  for (const [key, file] of Object.entries(files)) {
    if (file) data.append(key, file)
  }

  return data
}
