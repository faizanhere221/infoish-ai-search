// Every date shown in this app (publish dates, due dates, deadlines,
// "joined" dates, "created" columns) is a calendar date — the day itself
// is what matters, not a specific instant. Formatting it with a fixed
// timeZone means the server (which renders in UTC) and the browser
// (whatever the visitor's local zone is) always produce identical text,
// so React never sees a hydration mismatch, and it means the displayed
// day never silently shifts depending on where the code happens to run
// (e.g. a deadline stored as a plain date never reads as "yesterday" for
// a visitor east of UTC). UTC is the fixed zone — see CLAUDE.md policy
// for why; it's an arbitrary but consistent choice, not a claim that the
// date has any real timezone attached.
//
// Only for actual point-in-time timestamps where the time of day matters
// (chat message times, "last active" timestamps, calendar grids built
// from local "today") is viewer-local time more correct than UTC — those
// stay on their own client-only-after-mount formatting and don't use
// this helper.

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

// e.g. "Oct 19, 2026"
export function formatDate(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS
): string {
  if (value === null || value === undefined || value === '') {return '—'}
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) {return '—'}
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(date)
}

// e.g. "Oct 2026" — for "Joined <month year>" style display.
export function formatMonthYear(value: string | number | Date | null | undefined): string {
  return formatDate(value, { month: 'short', year: 'numeric' })
}

// e.g. "Oct 19, 2026, 3:45 PM" — for an actual timestamp where showing
// both the date and time matters. Still UTC-fixed for the same
// hydration-safety reason as formatDate; this is not a "viewer's local
// time" formatter.
export function formatDateTime(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { ...DEFAULT_DATE_OPTIONS, hour: 'numeric', minute: '2-digit' }
): string {
  return formatDate(value, options)
}
