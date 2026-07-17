import knex, { Knex } from 'knex';
import { knexfile } from '@database/knexfile';

/** Types for the sites table (matches migrations/003_sites.ts) */
export interface SiteRecord {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude: number; // decimal degrees
  longitude: number; // decimal degrees
  radius_meters: number;
  created_by?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteInput {
  name: string;
  address?: string; // mapped to address_line1
  latitude: number;
  longitude: number;
  radius: number; // mapped to radius_meters
  created_by?: string;
}

export interface UpdateSiteInput {
  name?: string;
  address?: string | null; // mapped to address_line1
  latitude?: number;
  longitude?: number;
  radius?: number; // mapped to radius_meters
  is_active?: boolean;
}

const environment = process.env.NODE_ENV || 'development';
const db: Knex = knex(knexfile[environment] ?? knexfile.development);

/** Postgres unique_violation error code */
const UNIQUE_VIOLATION = '23505';

/** Helper to generate the next site code (SITE-001, SITE-002, ...) */
async function generateSiteCode(): Promise<string> {
  const latest = await db('sites').orderBy('code', 'desc').first();
  if (!latest || !latest.code) return 'SITE-001';
  const match = latest.code.match(/SITE-(\d+)/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
  return `SITE-${String(nextNum).padStart(3, '0')}`;
}

/** Map the simple API input shape onto the real column names */
function toColumns(input: { address?: string | null; radius?: number }) {
  const { address, radius, ...rest } = input as any;
  const cols: Record<string, unknown> = { ...rest };
  if (address !== undefined) cols.address_line1 = address;
  if (radius !== undefined) cols.radius_meters = radius;
  return cols;
}

export const siteModel = {
  async findById(id: string): Promise<SiteRecord | undefined> {
    return db<SiteRecord>('sites').where({ id }).first();
  },

  async findByCode(code: string): Promise<SiteRecord | undefined> {
    return db<SiteRecord>('sites').where({ code }).first();
  },

  async list(params: { page?: number; limit?: number; search?: string }): Promise<{ data: SiteRecord[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const offset = (page - 1) * limit;
    const query = db<SiteRecord>('sites');
    if (params.search) {
      const term = `%${params.search}%`;
      query.where((qb) => {
        qb.where('name', 'ilike', term).orWhere('code', 'ilike', term);
      });
    }
    const totalResult = await query.clone().count<{ count: string }>('id as count').first();
    const total = totalResult ? Number(totalResult.count) : 0;
    const data = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    return { data, total };
  },

  /**
   * Create a new site. code is generated from the current max code; under
   * concurrent creates two requests can compute the same next code, so a
   * unique-violation retry (up to 3 attempts) closes that race.
   */
  async create(input: CreateSiteInput): Promise<SiteRecord> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = await generateSiteCode();
      try {
        const [record] = await db<SiteRecord>('sites')
          .insert({ ...toColumns(input), code, is_active: true })
          .returning('*');
        return record;
      } catch (err: any) {
        if (err?.code === UNIQUE_VIOLATION && err?.constraint?.includes('code') && attempt < 2) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to generate a unique site code after 3 attempts');
  },

  async update(id: string, changes: UpdateSiteInput): Promise<SiteRecord> {
    const [record] = await db<SiteRecord>('sites')
      .where({ id })
      .update({ ...toColumns(changes), updated_at: db.fn.now() })
      .returning('*');
    return record;
  },

  async deactivate(id: string): Promise<void> {
    await db('sites').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  },

  /** Assign employees to a site (many‑to‑many via site_employees pivot) */
  async assignEmployees(siteId: string, employeeIds: string[]): Promise<void> {
    if (!employeeIds.length) return;
    const inserts = employeeIds.map((empId) => ({ site_id: siteId, employee_id: empId }));
    await db('site_employees').insert(inserts).onConflict(['site_id', 'employee_id']).ignore();
  },

  /** Remove employees from a site */
  async removeEmployees(siteId: string, employeeIds: string[]): Promise<void> {
    await db('site_employees')
      .where({ site_id: siteId })
      .whereIn('employee_id', employeeIds)
      .del();
  },
};
