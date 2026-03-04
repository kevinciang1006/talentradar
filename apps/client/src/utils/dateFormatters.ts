import { format, parseISO, isValid } from 'date-fns';

/**
 * Internal helper - validates and parses dates
 * @param date - Any date input
 * @returns Valid Date object or null
 */
function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;

  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Formats a date string or Date object into "12 Jan 2026 08:00 PM" format
 * @param date - ISO string, Date object, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "N/A")
 * @returns Formatted datetime string or fallback
 *
 * @example
 * formatDateTime("2026-01-12T20:00:00Z") // "12 Jan 2026 08:00 PM"
 * formatDateTime("2026-03-01T14:30:00Z") // "1 Mar 2026 02:30 PM"
 * formatDateTime(null) // "N/A"
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  const parsed = parseDate(date);
  if (!parsed) return fallback;

  try {
    return format(parsed, 'd MMM yyyy hh:mm a');
  } catch {
    return fallback;
  }
}

/**
 * Formats a date string or Date object into "12 Jan 2026" format (date only, no time)
 * @param date - ISO string, Date object, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "N/A")
 * @returns Formatted date string or fallback
 *
 * @example
 * formatDate("2026-01-12T20:00:00Z") // "12 Jan 2026"
 * formatDate("2026-03-01") // "1 Mar 2026"
 * formatDate(null) // "N/A"
 */
export function formatDate(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  const parsed = parseDate(date);
  if (!parsed) return fallback;

  try {
    return format(parsed, 'd MMM yyyy');
  } catch {
    return fallback;
  }
}

/**
 * Formats a date as relative time: "2h ago", "3d ago", "Just now"
 * @param date - ISO string, Date object, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "N/A")
 * @returns Relative time string or fallback
 *
 * @example
 * formatRelativeTime(new Date()) // "Just now"
 * formatRelativeTime(twoHoursAgo) // "2h ago"
 * formatRelativeTime(threeDaysAgo) // "3d ago"
 * formatRelativeTime("2025-01-12") // "12 Jan 2025" (for old dates)
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  const parsed = parseDate(date);
  if (!parsed) return fallback;

  try {
    const now = new Date();
    const diffMs = now.getTime() - parsed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}mo ago`;
    }
    // For very old dates, show absolute format
    return format(parsed, 'd MMM yyyy');
  } catch {
    return fallback;
  }
}

/**
 * Formats a date for display in lists/tables with short format
 * @param date - ISO string, Date object, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "N/A")
 * @returns Short date format like "Jan 12" or "Jan 12, 2025" or fallback
 *
 * @example
 * formatDateShort("2026-01-12") // "Jan 12" (current year)
 * formatDateShort("2025-01-12") // "Jan 12, 2025" (different year)
 */
export function formatDateShort(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  const parsed = parseDate(date);
  if (!parsed) return fallback;

  try {
    const currentYear = new Date().getFullYear();
    const dateYear = parsed.getFullYear();

    // "Jan 12" for current year, "Jan 12, 2025" for other years
    return currentYear === dateYear
      ? format(parsed, 'MMM d')
      : format(parsed, 'MMM d, yyyy');
  } catch {
    return fallback;
  }
}

/**
 * Formats a date for long display: "January 12, 2026"
 * @param date - ISO string, Date object, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "N/A")
 * @returns Long date format or fallback
 *
 * @example
 * formatDateLong("2026-01-12") // "January 12, 2026"
 */
export function formatDateLong(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  const parsed = parseDate(date);
  if (!parsed) return fallback;

  try {
    return format(parsed, 'MMMM d, yyyy');
  } catch {
    return fallback;
  }
}
