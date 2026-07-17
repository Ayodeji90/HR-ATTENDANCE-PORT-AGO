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
  within_geofence: boolean;
  status: AttendanceStatus;
  reason: string | null;
  created_at: string;
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
  const response = await api.get(`/attendance/employee/${employeeId}/history`);
  return response.data;
};

export const EVENT_TYPE_LABELS: Record<AttendanceEventType, string> = {
  check_in: 'Check In',
  check_out: 'Check Out',
  afternoon_confirm: 'Afternoon Confirm',
};
