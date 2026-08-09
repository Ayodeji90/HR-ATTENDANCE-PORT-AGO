import api from './api';

export type AttendanceStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceEventType = 'check_in' | 'check_out' | 'afternoon_confirm';

export type AttendanceRecord = {
  id: string;
  employee_id: string;
  site_id: string;
  event_date: string;
  event_time: string;
  event_type: AttendanceEventType;
  gps_latitude: string | number;
  gps_longitude: string | number;
  gps_accuracy: string | number | null;
  within_geofence: boolean;
  facial_match_score: string | number | null;
  facial_verified: boolean;
  device_info: string | null;
  ip_address: string | null;
  selfie_path: string | null;
  status: AttendanceStatus;
  reason: string | null;
  created_at: string;
};

/** Payload for a live punch (check-in / afternoon / check-out). */
export type PunchPayload = {
  site_id: string;
  latitude: number;
  longitude: number;
  reason?: string;
  /** Base64 data-URL JPEG/PNG captured from the browser camera. */
  selfie?: string;
  gps_accuracy?: number;
  device_info?: string;
};

export const checkIn = async (payload: PunchPayload) => {
  const response = await api.post('/attendance/checkin', payload);
  return response.data.data as AttendanceRecord;
};

export const afternoonConfirm = async (payload: PunchPayload) => {
  const response = await api.post('/attendance/afternoon', payload);
  return response.data.data as AttendanceRecord;
};

export const checkOut = async (payload: PunchPayload) => {
  const response = await api.post('/attendance/checkout', payload);
  return response.data.data as AttendanceRecord;
};

export const punchEndpoint: Record<AttendanceEventType, (p: PunchPayload) => Promise<AttendanceRecord>> = {
  check_in: checkIn,
  afternoon_confirm: afternoonConfirm,
  check_out: checkOut,
};

export const fetchAttendance = async (params?: Record<string, unknown>) => {
  const response = await api.get('/attendance', { params });
  return response.data;
};

export const fetchAttendanceById = async (id: string) => {
  const response = await api.get(`/attendance/${id}`);
  return response.data;
};

export const approveAttendance = async (id: string) => {
  const response = await api.post(`/attendance/${id}/approve`);
  return response.data;
};

export const rejectAttendance = async (id: string, reason: string) => {
  const response = await api.post(`/attendance/${id}/reject`, { reason });
  return response.data;
};

export const fetchEmployeeAttendanceHistory = async (employeeId: string) => {
  const response = await api.get(`/attendance/employee/${employeeId}/history`, { params: { limit: 100 } });
  const body = response.data;
  return (body.data?.data ?? body.data ?? []) as AttendanceRecord[];
};

export const EVENT_TYPE_LABELS: Record<AttendanceEventType, string> = {
  check_in: 'Check In',
  check_out: 'Check Out',
  afternoon_confirm: 'Afternoon Confirm',
};
