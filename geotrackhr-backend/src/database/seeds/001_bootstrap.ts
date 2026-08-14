import type { Knex } from 'knex';
import { hash } from 'argon2';

/**
 * Seed 001: Bootstrap Data
 *
 * Inserts minimum viable data so the system is usable immediately
 * after running migrations + seeds:
 *
 * - 4 roles (admin, hr, supervisor, employee)
 * - 1 admin user (admin@geotrackhr.com / Admin@123)
 * - 2 demo construction sites (with GPS coordinates)
 * - 3 demo employees (for testing attendance)
 *
 * Passwords are hashed with Argon2 at seed time.
 */
export async function seed(knex: Knex): Promise<void> {
  // Truncate in correct FK order
  await knex('attendance_records').del();
  await knex('leave_requests').del();
  await knex('facial_templates').del();
  await knex('notifications').del();
  await knex('audit_logs').del();
  await knex('employees').del();
  await knex('refresh_tokens').del();
  await knex('users').del();
  await knex('sites').del();
  await knex('roles').del();

  // ── Roles ──────────────────────────────────────────────
  const [adminRole, hrRole, supervisorRole, employeeRole] = await knex('roles')
    .insert([
      { name: 'admin', description: 'Full system access — manage users, sites, global config' },
      { name: 'hr', description: 'HR manager — approve/reject employees, leaves, view reports' },
      { name: 'supervisor', description: 'Site supervisor — approve leaves, view site attendance' },
      { name: 'employee', description: 'Standard employee — check in/out, request leaves' },
    ])
    .returning('*');

  // ── Admin User ─────────────────────────────────────────
  const passwordHash = await hash('Admin@123', {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await knex('users').insert({
    role_id: adminRole.id,
    email: 'admin@geotrackhr.com',
    password_hash: passwordHash,
    full_name: 'System Administrator',
    phone: '+1-555-000-0000',
    is_active: true,
  });

  // ── Company Sites (real locations — geofences the live attendance
  //    GPS is verified against) ────────────────────────────────────
  // Site 1: Kamio Homes — Victoria Island, Lagos
  // Site 2: Molade Okoya Thomas St office — Ogba, Ikeja, Lagos
  // Radii: 100 m (tight — employee must be at/near the office building).
  await knex('sites').insert([
    {
      name: 'Kamio Homes (Victoria Island)',
      code: 'SITE-DT1',
      description: 'Company office — 2A Louis Solomon Cl, Victoria Island, Lagos',
      address_line1: '2A Louis Solomon Cl',
      city: 'Victoria Island',
      state: 'Lagos',
      country: 'NG',
      postal_code: '71510',
      latitude: 6.427667,
      longitude: 3.408044,
      radius_meters: 100,
      is_active: true,
    },
    {
      name: 'Molade Okoya Thomas St (Ogba)',
      code: 'SITE-HW2',
      description: 'Company office — 9 Molade Okoya Thomas St, Ogba, Ikeja, Lagos',
      address_line1: '9 Molade Okoya Thomas St',
      city: 'Ogba',
      state: 'Lagos',
      country: 'NG',
      postal_code: '101233',
      latitude: 6.619298,
      longitude: 3.3462232,
      radius_meters: 100,
      is_active: true,
    },
  ]);

  // ── Demo Employees ─────────────────────────────────────
  // Each demo employee also gets a login account (role 'employee') linked
  // via employees.user_id, so self-service flows (check-in, leave requests)
  // can actually be exercised end-to-end. Shared demo password: Employee@123
  const employeePasswordHash = await hash('Employee@123', {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const demoEmployees = [
    {
      employee_code: 'EMP-001',
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james.wilson@demo.com',
      phone: '+1-555-111-0001',
      department: 'Civil Engineering',
      designation: 'Site Engineer',
      hire_date: '2024-01-15',
    },
    {
      employee_code: 'EMP-002',
      first_name: 'Maria',
      last_name: 'Garcia',
      email: 'maria.garcia@demo.com',
      phone: '+1-555-111-0002',
      department: 'Electrical',
      designation: 'Senior Electrician',
      hire_date: '2024-03-01',
    },
    {
      employee_code: 'EMP-003',
      first_name: 'Robert',
      last_name: 'Chen',
      email: 'robert.chen@demo.com',
      phone: '+1-555-111-0003',
      department: 'Safety',
      designation: 'Safety Officer',
      hire_date: '2024-06-10',
    },
  ];

  for (const emp of demoEmployees) {
    const [user] = await knex('users')
      .insert({
        role_id: employeeRole.id,
        email: emp.email,
        password_hash: employeePasswordHash,
        full_name: `${emp.first_name} ${emp.last_name}`,
        phone: emp.phone,
        is_active: true,
      })
      .returning('*');

    await knex('employees').insert({
      ...emp,
      approval_status: 'approved',
      is_active: true,
      user_id: user.id,
    });
  }
}