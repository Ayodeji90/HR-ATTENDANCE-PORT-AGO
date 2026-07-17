import knex, { Knex } from 'knex';
import { knexfile } from '@database/knexfile';

/** Types for the facial_templates table (matches migrations/007) */
export interface FacialTemplateRecord {
  id: string;
  employee_id: string;
  template_data: number[]; // embedding vector
  model_version: string;
  quality_score: number | null;
  image_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterFacialInput {
  employee_id: string;
  template_data: number[];
  model_version: string;
  quality_score?: number;
  image_count: number;
}

const environment = process.env.NODE_ENV || 'development';
const db: Knex = knex(knexfile[environment] ?? knexfile.development);

export const facialModel = {
  /** Create a new facial template record, deactivating any prior active one */
  async create(input: RegisterFacialInput): Promise<FacialTemplateRecord> {
    return db.transaction(async (trx) => {
      await trx('facial_templates')
        .where({ employee_id: input.employee_id, is_active: true })
        .update({ is_active: false, updated_at: trx.fn.now() });

      // pg serializes plain JS arrays as Postgres array literals ("{...}"),
      // not JSON — for a jsonb column that must be inserted via an explicit
      // JSON-string + ::jsonb cast instead of a raw array parameter.
      const [record] = await trx<FacialTemplateRecord>('facial_templates')
        .insert({
          employee_id: input.employee_id,
          template_data: trx.raw('?::jsonb', [JSON.stringify(input.template_data)]),
          model_version: input.model_version,
          quality_score: input.quality_score ?? null,
          image_count: input.image_count,
          is_active: true,
        } as any)
        .returning('*');
      return record;
    });
  },

  /** Find the active template for an employee */
  async findByEmployeeId(employeeId: string): Promise<FacialTemplateRecord | undefined> {
    return db<FacialTemplateRecord>('facial_templates')
      .where({ employee_id: employeeId, is_active: true })
      .first();
  },
};
