import { api } from './api';
import type { AttendanceEventType, AttendanceRecord, OfflinePunch } from '../types';

interface PunchPayload {
  site_id: string;
  latitude: number;
  longitude: number;
  reason?: string;
}

/** POST /attendance/checkin */
export async function checkIn(payload: PunchPayload): Promise<AttendanceRecord> {
  const response = await api.post('/attendance/checkin', payload);
  return response.data.data as AttendanceRecord;
}

/** POST /attendance/afternoon */
export async function afternoonConfirm(payload: PunchPayload): Promise<AttendanceRecord> {
  const response = await api.post('/attendance/afternoon', payload);
  return response.data.data as AttendanceRecord;
}

/** POST /attendance/checkout */
export async function checkOut(payload: PunchPayload): Promise<AttendanceRecord> {
  const response = await api.post('/attendance/checkout', payload);
  return response.data.data as AttendanceRecord;
}

export const punchEndpoint: Record<AttendanceEventType, (p: PunchPayload) => Promise<AttendanceRecord>> = {
  check_in: checkIn,
  afternoon_confirm: afternoonConfirm,
  check_out: checkOut,
};

export interface SyncItemResult {
  index: number;
  success: boolean;
  data?: AttendanceRecord;
  error?: { code: string; message: string };
}

/** POST /attendance/sync — replay a batch of offline punches, one result per item */
export async function syncOfflinePunches(items: OfflinePunch[]): Promise<SyncItemResult[]> {
  const response = await api.post('/attendance/sync', {
    items: items.map(({ event_type, site_id, latitude, longitude, reason, client_timestamp }) => ({
      event_type,
      site_id,
      latitude,
      longitude,
      reason,
      client_timestamp,
    })),
  });
  return response.data.data as SyncItemResult[];
}

/** GET /attendance/employee/:employeeId/history — the employee's own attendance */
export async function fetchAttendanceHistory(employeeId: string): Promise<AttendanceRecord[]> {
  const response = await api.get(`/attendance/employee/${employeeId}/history`, { params: { limit: 100 } });
  const data = response.data.data as { data: AttendanceRecord[]; total: number };
  return data.data ?? [];
}
