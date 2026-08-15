import knex, { Knex } from 'knex';
import { knexfile } from '@database/knexfile';

/** Types for the leave_requests table (matches migrations/005 + 013) */
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
  supervisor_id: string | null;
  supervisor_approved_at: string | null;
  supervisor_comment: string | null;
  hr_id: string | null;
  hr_approved_at: string | null;
  hr_comment: string | null;
  rejection_reason: string | null;
  document_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveInput {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration_days: number;
  half_day?: boolean;
  reason?: string;
}

const environment = process.env.NODE_ENV || 'development';
const db: Knex = knex(knexfile[environment] ?? knexfile.development);

export const leaveModel = {
  async create(input: CreateLeaveInput): Promise<LeaveRecord> {
    const [record] = await db<LeaveRecord>('leave_requests')
      .insert({ ...input, half_day: input.half_day ?? false, status: 'pending' })
      .returning('*');
    return record;
  },

  async findById(id: string): Promise<LeaveRecord | undefined> {
    return db<LeaveRecord>('leave_requests').where({ id }).first();
  },

  async list(params: { employeeId?: string; status?: string; month?: string; page?: number; limit?: number }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const offset = (page - 1) * limit;
    const query = db<LeaveRecord>('leave_requests');
    if (params.employeeId) query.where('employee_id', params.employeeId);
    if (params.status) query.where('status', params.status);
    if (params.month) {
      // YYYY-MM — any leave overlapping that month. start_date/end_date are
      // Postgres `date` columns, so LIKE doesn't apply ("operator does not
      // exist: date ~~ unknown"). Use an inclusive overlap instead:
      // leave starts before next month begins AND ends on/after this month starts.
      const [y, m] = params.month.split('-').map(Number);
      const monthStart = `${params.month}-01`;
      // Roll December over to January of the next year — a "13th month"
      // literal (2026-13-01) is an invalid date and Postgres rejects it.
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      query.where('start_date', '<', nextMonth).andWhere('end_date', '>=', monthStart);
    }
    const totalResult = await query.clone().count<{ count: string }>('id as count').first();
    const total = totalResult ? Number(totalResult.count) : 0;
    const data = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    return { data, total };
  },

  /** HR decision (single-stage flow): pending -> approved_by_hr | rejected */
  async hrDecide(
    id: string,
    decision: 'approved_by_hr' | 'rejected',
    hrId: string,
    comment?: string,
  ): Promise<LeaveRecord> {
    const [record] = await db<LeaveRecord>('leave_requests')
      .where({ id })
      .update({
        status: decision,
        hr_id: hrId,
        hr_approved_at: db.fn.now(),
        hr_comment: comment ?? null,
        rejection_reason: decision === 'rejected' ? comment ?? null : null,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return record;
  },

  async attachDocument(id: string, documentPath: string): Promise<LeaveRecord> {
    const [record] = await db<LeaveRecord>('leave_requests')
      .where({ id })
      .update({ document_path: documentPath, updated_at: db.fn.now() })
      .returning('*');
    return record;
  },
};
