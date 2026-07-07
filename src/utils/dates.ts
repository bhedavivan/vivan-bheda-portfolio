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

/** "2026-06" or "2026-06-15" → total months since year 0; "Present" → now. */
function toMonths(value: string): number {
  if (value === 'Present') {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }
  const [year, month] = value.split('-').map(Number);
  return year * 12 + (month - 1);
}

/**
 * LinkedIn-style duration between two stored dates, counting both end
 * months inclusively (Jun 2026 – Jun 2026 = "1 mo"). "Present" durations
 * are computed at build time, so they refresh whenever the site rebuilds.
 */
export function formatDuration(startDate: string, endDate: string): string {
  const total = toMonths(endDate) - toMonths(startDate) + 1;
  if (!Number.isFinite(total) || total <= 0) return '';
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(years === 1 ? '1 yr' : `${years} yrs`);
  if (months > 0) parts.push(months === 1 ? '1 mo' : `${months} mos`);
  return parts.join(' ');
}
