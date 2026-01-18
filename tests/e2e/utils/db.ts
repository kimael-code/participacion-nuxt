import { createClient } from '@libsql/client';
import path from 'path';

// Use file protocol for local db
const dbPath = path.resolve(process.cwd(), 'local.db');
const client = createClient({
  url: `file:${dbPath}`,
});

export async function seedTestCompany() {
  const company = {
    id: 'test-company-id',
    name: 'Test Company',
    rif: 'J-12345678-9',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Clean up potential conflicts
  await client.execute({
    sql: 'DELETE FROM companies WHERE id = ?',
    args: [company.id],
  });
  await client.execute({
    sql: 'DELETE FROM companies WHERE rif = ?',
    args: [company.rif],
  });

  await client.execute({
    sql: `
        INSERT INTO companies (id, name, rif, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
    args: [
      company.id,
      company.name,
      company.rif,
      company.createdAt,
      company.updatedAt,
    ],
  });

  // Seed Admin Unit
  await client.execute({
    sql: `
        INSERT INTO administrative_units (id, name, company_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT DO NOTHING
        `,
    args: [
      'test-unit-id',
      'Recursos Humanos',
      company.id,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  });

  // Seed Roles (Essential for RBAC)
  await client.execute({
    sql: `
        INSERT INTO roles (id, name, slug, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO NOTHING
        `,
    args: [
      'role-admin',
      'Administrador',
      'admin',
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  });

  await client.execute({
    sql: `
        INSERT INTO roles (id, name, slug, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO NOTHING
        `,
    args: [
      'role-user',
      'Usuario',
      'user',
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  });

  return company.id;
}

export async function upgradeUserToAdmin(email: string, companyId: string) {
  // Get user id
  const result = await client.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [email],
  });

  if (result.rows.length === 0) {
    throw new Error(`User with email ${email} not found`);
  }

  const userId = result.rows[0].id as string;

  // Update Role to 'admin' (matches slug in roles table)
  await client.execute({
    sql: 'UPDATE users SET role = ?, email_verified = 1 WHERE id = ?',
    args: ['admin', userId],
  });

  // Link to Company
  await client.execute({
    sql: `
        INSERT INTO user_companies (id, user_id, company_id, role, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, company_id) DO UPDATE SET role='admin'
      `,
    args: [
      'link-' + Date.now(),
      userId,
      companyId,
      'admin',
      new Date().toISOString(),
    ],
  });
}
