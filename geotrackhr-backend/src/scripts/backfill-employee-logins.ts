/**
 * Backfill: create login accounts for employees created before the
 * auto-login-creation feature landed.
 *
 * WHY: HR/admin-created employees (POST /api/employees) now get a login
 * account with the default password automatically. Employees created before
 * that change have an email but no linked user account (user_id is NULL), so
 * they cannot sign in. This script creates a user (role: employee) for each
 * such employee with the shared default password (Employee@123), the same way
 * createEmployee does.
 *
 * Run against any environment (local or production):
 *   npm run db:backfill-logins
 * or, on Render, in the service shell:
 *   npx tsx src/scripts/backfill-employee-logins.ts
 *
 * Idempotent — safe to run repeatedly (skips employees that already have a
 * user_id, and users whose email already exists).
 */
import knex from 'knex';
import { knexfile } from '../database/knexfile';
import { hashPassword } from '@utils/password';

const DEFAULT_EMPLOYEE_PASSWORD = 'Employee@123';

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment] ?? knexfile.development);

async function main(): Promise<void> {
  console.log(`[backfill-logins] NODE_ENV: ${environment}`);

  const employeeRole = await db('roles').where({ name: 'employee' }).first();
  if (!employeeRole) {
    console.error('[backfill-logins] employee role not found — aborting');
    process.exit(1);
  }

  const employees = await db('employees')
    .whereNull('user_id')
    .whereNotNull('email')
    .select('id', 'employee_code', 'first_name', 'last_name', 'email', 'phone');

  console.log(`[backfill-logins] found ${employees.length} employee(s) with email but no login`);

  const passwordHash = await hashPassword(DEFAULT_EMPLOYEE_PASSWORD);
  let created = 0;
  let skipped = 0;

  for (const emp of employees) {
    const email = emp.email.toLowerCase().trim();
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      // Email already has a user (e.g. a demo or pre-existing account) — just
      // link the employee to it, leaving its password untouched.
      await db('employees').where({ id: emp.id }).update({ user_id: existingUser.id, updated_at: db.fn.now() });
      skipped++;
      console.log(`[backfill-logins] linked ${emp.employee_code} (${email}) to existing user ${existingUser.id}`);
      continue;
    }

    const [user] = await db('users')
      .insert({
        role_id: employeeRole.id,
        email,
        password_hash: passwordHash,
        full_name: `${emp.first_name} ${emp.last_name}`,
        phone: emp.phone ?? null,
        is_active: true,
      })
      .returning('id');

    await db('employees').where({ id: emp.id }).update({ user_id: user.id, updated_at: db.fn.now() });
    created++;
    console.log(
      `[backfill-logins] created login for ${emp.employee_code} (${email}) -> ${user.id} (default password)`,
    );
  }

  console.log(`[backfill-logins] done — ${created} created, ${skipped} linked, ${employees.length} total.`);
}

main()
  .then(() => db.destroy())
  .catch((err) => {
    console.error(err);
    return db.destroy().finally(() => process.exit(1));
  });
