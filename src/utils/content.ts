/**
 * True when an optional/blankable string field actually has a value.
 * Used to hide links (LinkedIn, GitHub, email, phone, etc.) whose value
 * is missing or blanked out, instead of rendering a broken link.
 */
export function hasValue(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
