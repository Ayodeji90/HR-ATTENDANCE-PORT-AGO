import { api } from './api';
import type { LeaveRecord, LeaveType } from '../types';

export interface SubmitLeavePayload {
  leave_type: LeaveType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  half_day?: boolean;
  reason?: string;
}

/** POST /leave — submit a new leave request (self-service) */
export async function submitLeave(payload: SubmitLeavePayload): Promise<LeaveRecord> {
  const response = await api.post('/leave', payload);
  return response.data.data as LeaveRecord;
}

/** GET /leave/employee/:employeeId/history — the employee's own leave history */
export async function fetchLeaveHistory(employeeId: string): Promise<LeaveRecord[]> {
  const response = await api.get(`/leave/employee/${employeeId}/history`, { params: { limit: 100 } });
  const data = response.data.data as { data: LeaveRecord[]; total: number };
  return data.data ?? [];
}
