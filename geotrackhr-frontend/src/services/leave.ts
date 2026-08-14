import api from './api';

export type LeaveType = 'annual' | 'sick' | 'casual' | 'emergency' | 'maternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved_by_supervisor' | 'approved_by_hr' | 'rejected' | 'cancelled';

export type LeaveRecord = {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration_days: number;
  half_day: boolean;
  reason: string | null;
  status: LeaveStatus;
  supervisor_id: string | null;
  supervisor_comment: string | null;
  hr_id: string | null;
  hr_comment: string | null;
  rejection_reason: string | null;
  document_path: string | null;
  created_at: string;
};

export const fetchPendingLeaves = async (status?: LeaveStatus) => {
  const response = await api.get('/leave/pending', { params: status ? { status } : undefined });
  return response.data;
};

export const hrApprove = async (id: string, comment?: string) => {
  const response = await api.post(`/leave/${id}/hr-approve`, { comment });
  return response.data;
};

export const hrReject = async (id: string, comment: string) => {
  const response = await api.post(`/leave/${id}/hr-reject`, { comment });
  return response.data;
};

export const fetchEmployeeLeaves = async (employeeId: string, month?: string) => {
  const response = await api.get(`/leave/employee/${employeeId}/history`, {
    params: month ? { month } : undefined,
  });
  return response.data;
};

/** Submit a new leave request (employee self-service). */
export const submitLeave = async (payload: {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  half_day?: boolean;
  reason?: string;
}) => {
  const response = await api.post('/leave', payload);
  return response.data;
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  emergency: 'Emergency',
  maternity: 'Maternity',
  unpaid: 'Unpaid',
};
