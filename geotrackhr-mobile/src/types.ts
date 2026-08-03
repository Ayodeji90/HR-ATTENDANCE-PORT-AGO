/**
 * Shared API types — mirror the backend record shapes (see the respective
 * model.ts files under geotrackhr-backend/src/modules).
 */

export type Role = 'admin' | 'hr' | 'supervisor' | 'employee';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Site {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

export type AttendanceEventType = 'check_in' | 'check_out' | 'afternoon_confirm';
export type AttendanceStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  site_id: string;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:mm:ss
  event_type: AttendanceEventType;
  gps_latitude: number | null;
  gps_longitude: number | null;
  within_geofence: boolean;
  status: AttendanceStatus;
  reason: string | null;
  created_at: string;
}

export type LeaveType = 'annual' | 'sick' | 'casual' | 'emergency' | 'maternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved_by_supervisor' | 'approved_by_hr' | 'rejected' | 'cancelled';

export interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration_days: number;
  half_day: boolean;
  reason: string | null;
  status: LeaveStatus;
  supervisor_comment: string | null;
  hr_comment: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
}

/** A punch queued on-device while offline, replayed via POST /attendance/sync */
export interface OfflinePunch {
  event_type: AttendanceEventType;
  site_id: string;
  site_name?: string;
  latitude: number;
  longitude: number;
  reason?: string;
  client_timestamp: string; // ISO — the backend replays rules against this
}
