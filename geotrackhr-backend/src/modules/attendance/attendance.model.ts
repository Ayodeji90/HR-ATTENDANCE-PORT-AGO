import knex, { Knex } from 'knex';
import { knexfile } from '@database/knexfile';

/** Types for the attendance_records table (matches migrations/004 + 012) */
export interface AttendanceRecord {
  id: string;
  employee_id: string;
  site_id: string;
  event_date: string; // ISO date
  event_time: string; // HH:mm:ss
  event_type: 'check_in' | 'check_out' | 'afternoon_confirm';
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_accuracy: number | null;
  within_geofence: boolean;
  facial_match_score: number | null;
  facial_verified: boolean;
  device_info: string | null;
  ip_address: string | null;
  selfie_path: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAttendanceInput {
  employee_id: string;
  site_id: string;
  event_type: 'check_in' | 'check_out' | 'afternoon_confirm';
  gps_latitude: number;
  gps_longitude: number;
  within_geofence: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  event_date?: string;
  event_time?: string;
  // Live-attendance metadata (populated by the punch controller):
  gps_accuracy?: number | null;
  facial_match_score?: number | null;
  facial_verified?: boolean;
  device_info?: string | null;
  ip_address?: string | null;
  selfie_path?: string | null;
  notes?: string | null;
}

const environment = process.env.NODE_ENV || 'development';
const db: Knex = knex(knexfile[environment] ?? knexfile.development);

export const attendanceModel = {
  async findById(id: string): Promise<AttendanceRecord | undefined> {
    return db<AttendanceRecord>('attendance_records').where({ id }).first();
  },

  async findByEmployeeDateType(
    employeeId: string,
    eventDate: string,
    eventType: 'check_in' | 'check_out' | 'afternoon_confirm',
  ): Promise<AttendanceRecord | undefined> {
    return db<AttendanceRecord>('attendance_records')
      .where({ employee_id: employeeId, event_date: eventDate, event_type: eventType })
      .first();
  },

  async list(params: {
    page?: number;
    limit?: number;
    employeeId?: string;
    siteId?: string;
    date?: string;
    status?: string;
  }): Promise<{ data: AttendanceRecord[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const offset = (page - 1) * limit;
    const query = db<AttendanceRecord>('attendance_records');
    if (params.employeeId) query.where('employee_id', params.employeeId);
    if (params.siteId) query.where('site_id', params.siteId);
    if (params.date) query.where('event_date', params.date);
    if (params.status) query.where('status', params.status);
    const totalResult = await query.clone().count<{ count: string }>('id as count').first();
    const total = totalResult ? Number(totalResult.count) : 0;
    const data = await query
      .orderBy('event_date', 'desc')
      .orderBy('event_time', 'desc')
      .limit(limit)
      .offset(offset);
    return { data, total };
  },

  async create(input: CreateAttendanceInput): Promise<AttendanceRecord> {
    const now = new Date();
    const [record] = await db<AttendanceRecord>('attendance_records')
      .insert({
        employee_id: input.employee_id,
        site_id: input.site_id,
        event_type: input.event_type,
        event_date: input.event_date ?? now.toISOString().slice(0, 10),
        event_time: input.event_time ?? now.toISOString().slice(11, 19),
        gps_latitude: input.gps_latitude,
        gps_longitude: input.gps_longitude,
        gps_accuracy: input.gps_accuracy ?? null,
        within_geofence: input.within_geofence,
        facial_match_score: input.facial_match_score ?? null,
        facial_verified: input.facial_verified ?? false,
        device_info: input.device_info ?? null,
        ip_address: input.ip_address ?? null,
        selfie_path: input.selfie_path ?? null,
        notes: input.notes ?? null,
        status: input.status,
        reason: input.reason ?? null,
      })
      .returning('*');
    return record as AttendanceRecord;
  },

  async updateStatus(id: string, status: 'approved' | 'rejected', reason?: string): Promise<AttendanceRecord> {
    const [record] = await db<AttendanceRecord>('attendance_records')
      .where({ id })
      .update({ status, reason: reason ?? null, updated_at: db.fn.now() })
      .returning('*');
    return record;
  },
};
