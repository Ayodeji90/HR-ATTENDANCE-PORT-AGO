import knex, { Knex } from 'knex';
import { knexfile } from '@database/knexfile';
import { config } from '@config/index';

/**
 * Types for the employees table.
 */
export interface EmployeeRecord {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  date_of_birth?: string | null; // ISO date string
  hire_date?: string | null; // ISO date string
  passport_photo_path?: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  approved_by?: string | null; // user id
  user_id?: string | null; // linked login account, if any
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  date_of_birth?: string;
  hire_date?: string;
  passport_photo_path?: string;
  // role is not part of employee; employees are not users.
}

export interface UpdateEmployeeInput {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  date_of_birth?: string | null;
  hire_date?: string | null;
  passport_photo_path?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  approved_by?: string | null;
  user_id?: string | null; // link to a login account (set when HR approves a self-registration)
  is_active?: boolean;
}

const environment = process.env.NODE_ENV || 'development';
const db: Knex = knex(knexfile[environment] ?? knexfile.development);

/** Helper to generate the next employee_code (EMP-001, EMP-002, ...) */
async function generateEmployeeCode(): Promise<string> {
  const latest = await db('employees')
    .orderBy('employee_code', 'desc')
    .first();
  if (!latest || !latest.employee_code) {
    return 'EMP-001';
  }
  const match = latest.employee_code.match(/EMP-(\d+)/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
  return `EMP-${String(nextNum).padStart(3, '0')}`;
}

/** Postgres unique_violation error code */
const UNIQUE_VIOLATION = '23505';

export const employeeModel = {
  /** Find by primary key */
  async findById(id: string): Promise<EmployeeRecord | undefined> {
    return db<EmployeeRecord>('employees').where({ id }).first();
  },

  /** Find by employee_code */
  async findByCode(code: string): Promise<EmployeeRecord | undefined> {
    return db<EmployeeRecord>('employees').where({ employee_code: code }).first();
  },

  /** List with pagination & optional filters */
  async list(params: {
    page?: number;
    limit?: number;
    department?: string;
    approval_status?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<{ data: EmployeeRecord[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const offset = (page - 1) * limit;

    const query = db<EmployeeRecord>('employees');

    if (params.department) query.where('department', 'ilike', `%${params.department}%`);
    if (params.approval_status) query.where('approval_status', params.approval_status);
    if (typeof params.is_active === 'boolean') query.where('is_active', params.is_active);
    if (params.search) {
      const term = `%${params.search}%`;
      query.where((qb) => {
        qb.where('first_name', 'ilike', term)
          .orWhere('last_name', 'ilike', term)
          .orWhere('employee_code', 'ilike', term);
      });
    }

    const totalResult = await query.clone().count<{ count: string }>('id as count').first();
    const total = totalResult ? Number(totalResult.count) : 0;

    const data = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { data, total };
  },

  /** Find the employee record linked to a login account, if any */
  async findByUserId(userId: string): Promise<EmployeeRecord | undefined> {
    return db<EmployeeRecord>('employees').where({ user_id: userId }).first();
  },

  /**
   * Create a new employee. employee_code is generated from the current max
   * code; under concurrent creates two requests can compute the same next
   * code, so a unique-violation retry (up to 3 attempts) closes that race.
   */
  async create(input: CreateEmployeeInput): Promise<EmployeeRecord> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = await generateEmployeeCode();
      try {
        const [record] = await db<EmployeeRecord>('employees')
          .insert({ ...input, employee_code: code })
          .returning('*');
        return record;
      } catch (err: any) {
        if (err?.code === UNIQUE_VIOLATION && err?.constraint?.includes('employee_code') && attempt < 2) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to generate a unique employee code after 3 attempts');
  },

  /** Update an existing employee */
  async update(id: string, changes: UpdateEmployeeInput): Promise<EmployeeRecord> {
    const [record] = await db<EmployeeRecord>('employees')
      .where({ id })
      .update({ ...changes, updated_at: db.fn.now() })
      .returning('*');
    return record;
  },

  /** Soft‑delete / deactivate */
  async deactivate(id: string): Promise<void> {
    await db('employees').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  },

  /** Approve a pending registration */
  async approve(id: string, approverUserId: string): Promise<EmployeeRecord> {
    const [record] = await db<EmployeeRecord>('employees')
      .where({ id })
      .update({
        approval_status: 'approved',
        approved_by: approverUserId,
        rejection_reason: null,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return record;
  },

  /** Reject a pending registration */
  async reject(id: string, reason: string): Promise<EmployeeRecord> {
    const [record] = await db<EmployeeRecord>('employees')
      .where({ id })
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
        approved_by: null,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return record;
  },
};
