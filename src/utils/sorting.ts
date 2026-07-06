import { statSync } from 'node:fs';

/**
 * All date strings site-wide use "YYYY-MM" (e.g. "2026-06") or "Present".
 * "YYYY-MM" sorts correctly with plain string comparison; "Present" is
 * treated as newer than any date.
 */
export function compareDatesDesc(a: string, b: string): number {
  if (a === b) return 0;
  if (a === 'Present') return -1;
  if (b === 'Present') return 1;
  return a > b ? -1 : 1;
}

type Timeframed = { data: { startDate: string; endDate: string } };

/** education/experiences: "Present" end dates first, then start date, newest first. */
export function sortByTimeframeDesc<T extends Timeframed>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const aOngoing = a.data.endDate === 'Present';
    const bOngoing = b.data.endDate === 'Present';
    if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
    return compareDatesDesc(a.data.startDate, b.data.startDate);
  });
}

/** certificates/awards: single date field, newest first. */
export function sortByDateDesc<T>(entries: T[], getDate: (entry: T) => string): T[] {
  return [...entries].sort((a, b) => compareDatesDesc(getDate(a), getDate(b)));
}

/**
 * "Most recently added" approximation via file modification time.
 * Caveat: git checkouts (e.g. CI/deploy builds) reset mtimes, so this is only
 * reliable locally — set the `order` field for stable ordering in production.
 */
function addedAt(entry: { filePath?: string }): number {
  if (!entry.filePath) return 0;
  try {
    return statSync(entry.filePath).mtimeMs;
  } catch {
    return 0;
  }
}

type Ordered = { data: { order?: number } };

/** Entries with `order` first (ascending), then the rest via the fallback comparator. */
function sortByOrderThen<T extends Ordered>(entries: T[], fallback: (a: T, b: T) => number): T[] {
  return [...entries].sort((a, b) => {
    const aOrder = a.data.order;
    const bOrder = b.data.order;
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    return fallback(a, b);
  });
}

/** projects: `order` ascending if set, otherwise most recently added first. */
export function sortProjects<T extends Ordered & { filePath?: string }>(entries: T[]): T[] {
  return sortByOrderThen(entries, (a, b) => addedAt(b) - addedAt(a));
}

/** skills: `order` ascending if set, otherwise alphabetical by category. */
export function sortSkills<T extends Ordered & { data: { category: string } }>(
  entries: T[],
): T[] {
  return sortByOrderThen(entries, (a, b) => a.data.category.localeCompare(b.data.category));
}
