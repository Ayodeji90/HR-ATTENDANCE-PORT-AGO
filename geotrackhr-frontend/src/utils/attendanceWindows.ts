export type AttendanceEventType = 'check_in' | 'check_out' | 'afternoon_confirm';
export type AttendanceWindow = 'check_in' | 'afternoon' | 'check_out' | 'closed';

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Mirrors the backend's window logic (geotrackhr-backend/src/utils/time.ts)
 * using the browser's local time. The backend remains the source of truth —
 * this only guides the UI (which actions to show/enable).
 */
export function currentAttendanceWindow(date: Date = new Date()): AttendanceWindow {
  const m = toMinutes(date.getHours(), date.getMinutes());
  if (m <= 10 * 60) return 'check_in';
  if (m >= 14 * 60 && m <= 15 * 60) return 'afternoon';
  if (m >= 17 * 60 && m <= 22 * 60) return 'check_out';
  return 'closed';
}

export const WINDOW_LABELS: Record<AttendanceWindow, string> = {
  check_in: 'Morning Check-in',
  afternoon: 'Afternoon Confirmation',
  check_out: 'Evening Check-out',
  closed: 'Outside Working Hours',
};

export const WINDOW_ACTION: Record<AttendanceWindow, AttendanceEventType | null> = {
  check_in: 'check_in',
  afternoon: 'afternoon_confirm',
  check_out: 'check_out',
  closed: null,
};

export const ACTION_LABELS: Record<AttendanceEventType, string> = {
  check_in: 'Check In',
  afternoon_confirm: 'Confirm Afternoon',
  check_out: 'Check Out',
};

/** True when the backend expects a reason for a check-in in this window */
export function isLateCheckIn(date: Date = new Date()): boolean {
  const m = toMinutes(date.getHours(), date.getMinutes());
  return m > 9 * 60 && m <= 10 * 60;
}

/** Local calendar date (YYYY-MM-DD) — records are keyed by local date. */
export function getLocalToday(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}
