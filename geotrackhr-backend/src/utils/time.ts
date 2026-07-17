/**
 * Time-of-day helpers for the attendance workflow. All checks are anchored
 * to Africa/Lagos local time regardless of server timezone, using
 * Intl.DateTimeFormat rather than pulling in a date-timezone dependency.
 */

const SITE_TIMEZONE = 'Africa/Lagos';

export interface LocalTime {
  hour: number;
  minute: number;
}

export function getLocalTime(date: Date = new Date()): LocalTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SITE_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { hour, minute };
}

/** Local calendar date (YYYY-MM-DD) in the site timezone */
export function getLocalDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function toMinutes({ hour, minute }: LocalTime): number {
  return hour * 60 + minute;
}

/** On-time check-in: before or at 09:00 */
export function isCheckInOnTime(t: LocalTime): boolean {
  return toMinutes(t) <= 9 * 60;
}

/** Late check-in window: 09:01–10:00 */
export function isCheckInLate(t: LocalTime): boolean {
  const m = toMinutes(t);
  return m > 9 * 60 && m <= 10 * 60;
}

/** After 10:00 — requires manual HR approval regardless of reason */
export function isCheckInVeryLate(t: LocalTime): boolean {
  return toMinutes(t) > 10 * 60;
}

/** Afternoon site confirmation window: 14:00–15:00 */
export function isAfternoonWindow(t: LocalTime): boolean {
  const m = toMinutes(t);
  return m >= 14 * 60 && m <= 15 * 60;
}

/** Evening check-out window: 17:00–22:00 */
export function isCheckoutWindow(t: LocalTime): boolean {
  const m = toMinutes(t);
  return m >= 17 * 60 && m <= 22 * 60;
}
