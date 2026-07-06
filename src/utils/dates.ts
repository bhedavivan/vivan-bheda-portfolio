/**
 * Formats a stored date for display. Storage stays "YYYY-MM"/"YYYY-MM-DD"
 * (or "Present") so string comparison in utils/sorting.ts keeps working;
 * this is the only place the display format ("MM/YYYY" / "MM/DD/YYYY") lives.
 */
export function formatDisplayDate(value: string): string {
  if (value === 'Present') return 'Present';
  const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return day ? `${month}/${day}/${year}` : `${month}/${year}`;
}
