/**
 * Option lists for a Year / Month / Day picker that only offers dates inside a
 * [min, max] range, so an out-of-range date can never be picked.
 *
 * Values use the date input format (YYYY-MM-DD). While the user is still
 * choosing, the value is partial: '2024' or '2024-05'.
 */

export type DateParts = { year: string; month: string; day: string };
export type DatePart = keyof DateParts;

const COMPLETE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PARTIAL_DATE_PATTERN = /^\d{4}(-\d{2})?$/;

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function isCompleteDateValue(value: string | null | undefined): value is string {
  return COMPLETE_DATE_PATTERN.test(value ?? '');
}

/** A year, or a year and month, picked without the rest of the date. */
export function isPartialDateValue(value: string | null | undefined): boolean {
  return PARTIAL_DATE_PATTERN.test(value ?? '');
}

export function splitDateValue(value: string | null | undefined): DateParts {
  const [year = '', month = '', day = ''] = (value ?? '').split('-');
  return { year, month, day };
}

export function joinDateParts({ year, month, day }: DateParts): string {
  if (!year) return '';
  if (!month) return year;
  if (!day) return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The calendar day after a complete date value. */
export function nextDateValue(value: string): string {
  return addDaysToDateValue(value, 1);
}

/** Newest year first. */
export function yearOptions(min: string, max: string): string[] {
  const years: string[] = [];
  for (let year = Number(max.slice(0, 4)); year >= Number(min.slice(0, 4)); year -= 1) years.push(String(year));
  return years;
}

export function monthOptions(year: string, min: string, max: string): string[] {
  if (!year) return [];
  const months: string[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const yearMonth = `${year}-${pad(month)}`;
    if (yearMonth >= min.slice(0, 7) && yearMonth <= max.slice(0, 7)) months.push(pad(month));
  }
  return months;
}

export function dayOptions(year: string, month: string, min: string, max: string): string[] {
  if (!year || !month) return [];
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const days: string[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${month}-${pad(day)}`;
    if (date >= min && date <= max) days.push(pad(day));
  }
  return days;
}

/**
 * The weeks of a month for a calendar grid, Sunday first. Each cell is a
 * YYYY-MM-DD value, or null for the blanks before the 1st and after the last day.
 */
export function calendarWeeks(year: number, month: number): (string | null)[][] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(`${year}-${pad(month)}-${pad(day)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** A complete date value moved by a number of days. */
export function addDaysToDateValue(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! + days)).toISOString().slice(0, 10);
}

/** e.g. "2026-06-03" → "Jun 3, 2026", without time-zone shifts. */
export function formatDateValue(value: string): string {
  const { year, month, day } = splitDateValue(value);
  return `${MONTH_LABELS[Number(month) - 1] ?? month} ${Number(day)}, ${year}`;
}

/** Sets one part and drops any later part that no longer fits the range (e.g. a future month after picking this year). */
export function changeDatePart(parts: DateParts, part: DatePart, value: string, min: string, max: string): DateParts {
  const next = { ...parts, [part]: value };
  if (next.month && !monthOptions(next.year, min, max).includes(next.month)) next.month = '';
  if (next.day && !dayOptions(next.year, next.month, min, max).includes(next.day)) next.day = '';
  return next;
}
