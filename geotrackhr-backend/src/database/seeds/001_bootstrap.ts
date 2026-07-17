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

  // ── Demo Sites ─────────────────────────────────────────
  // Site 1: Downtown Construction (New York area)
  // Site 2: Highway Project (simulated coordinates)
  await knex('sites').insert([
    {
      name: 'Downtown Tower Phase 1',
      code: 'SITE-DT1',
      description: 'Main downtown high-rise construction site',
      address_line1: '120 Broadway',
      city: 'New York',
      state: 'NY',
      country: 'US',
      postal_code: '10006',
      latitude: 40.7081000,
      longitude: -74.0112000,
      radius_meters: 150,
      is_active: true,
    },
    {
      name: 'Highway Extension Project',
      code: 'SITE-HW2',
      description: 'Highway lane extension and bridge work',
      address_line1: '45 Route 9W',
      city: 'Albany',
      state: 'NY',
      country: 'US',
      postal_code: '12204',
      latitude: 42.6526000,
      longitude: -73.7562000,
      radius_meters: 300,
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