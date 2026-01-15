import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ====================
// Authentication Tables (better-auth v1)
// ====================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  name: text('name').notNull(),
  image: text('image'),
  role: text('role').default('user'), // Link to roles.slug
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  password: text('password'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp',
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp',
  }),
  scope: text('scope'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ====================
// RBAC Tables (Dynamic Roles & Permissions)
// ====================

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // e.g., "Administrador"
  slug: text('slug').notNull().unique(), // e.g., "admin"
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // e.g., "Registrar Participación"
  slug: text('slug').notNull().unique(), // e.g., "participation:register"
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const rolePermissions = sqliteTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ====================
// Multi-Tenancy: Companies
// ====================

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rif: text('rif'), // RIF/NIT de la empresa
  logo: text('logo'), // URL del logo
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Relación many-to-many entre users y companies
export const userCompanies = sqliteTable('user_companies', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('user'), // admin, user
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ====================
// Geographic Catalogs (Normalized)
// ====================

export const states = sqliteTable('states', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'), // Código opcional (ej: "MIR" para Miranda)
});

export const municipalities = sqliteTable('municipalities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  stateId: text('state_id')
    .notNull()
    .references(() => states.id, { onDelete: 'cascade' }),
});

export const parishes = sqliteTable('parishes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  municipalityId: text('municipality_id')
    .notNull()
    .references(() => municipalities.id, { onDelete: 'cascade' }),
});

export const votingCenters = sqliteTable('voting_centers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  parishId: text('parish_id')
    .notNull()
    .references(() => parishes.id),
  latitude: real('latitude'), // Opcional para mapas
  longitude: real('longitude'), // Opcional para mapas
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ====================
// Company Data
// ====================

export const administrativeUnits = sqliteTable('administrative_units', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  cedula: text('cedula').notNull(), // Cédula de identidad
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  administrativeUnitId: text('administrative_unit_id').references(
    () => administrativeUnits.id,
  ),
  votingCenterId: text('voting_center_id').references(() => votingCenters.id), // Opcional
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  eventDate: integer('event_date', { mode: 'timestamp' }).notNull(),
  companyId: text('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ====================
// Participation Tracking
// ====================

export const nonParticipationReasons = sqliteTable(
  'non_participation_reasons',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
);

export const participations = sqliteTable('participations', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  participated: integer('participated', { mode: 'boolean' }).notNull(),
  nonParticipationReasonId: text('non_participation_reason_id').references(
    () => nonParticipationReasons.id,
  ),
  notes: text('notes'),
  registeredBy: text('registered_by').references(() => users.id),
  registeredAt: integer('registered_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const csvListings = sqliteTable('csv_listings', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  recordCount: integer('record_count').notNull(),
  generatedBy: text('generated_by').references(() => users.id),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ====================
// Relations
// ====================

export const usersRelations = relations(users, ({ one, many }) => ({
  roleData: one(roles, {
    fields: [users.role],
    references: [roles.slug],
  }),
  userCompanies: many(userCompanies),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const companiesRelations = relations(companies, ({ many }) => ({
  employees: many(employees),
  administrativeUnits: many(administrativeUnits),
  events: many(events),
  userCompanies: many(userCompanies),
}));

export const administrativeUnitsRelations = relations(
  administrativeUnits,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [administrativeUnits.companyId],
      references: [companies.id],
    }),
    employees: many(employees),
  }),
);

export const statesRelations = relations(states, ({ many }) => ({
  municipalities: many(municipalities),
}));

export const municipalitiesRelations = relations(
  municipalities,
  ({ one, many }) => ({
    state: one(states, {
      fields: [municipalities.stateId],
      references: [states.id],
    }),
    parishes: many(parishes),
  }),
);

export const parishesRelations = relations(parishes, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [parishes.municipalityId],
    references: [municipalities.id],
  }),
  votingCenters: many(votingCenters),
}));

export const votingCentersRelations = relations(
  votingCenters,
  ({ one, many }) => ({
    parish: one(parishes, {
      fields: [votingCenters.parishId],
      references: [parishes.id],
    }),
    employees: many(employees),
  }),
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  administrativeUnit: one(administrativeUnits, {
    fields: [employees.administrativeUnitId],
    references: [administrativeUnits.id],
  }),
  votingCenter: one(votingCenters, {
    fields: [employees.votingCenterId],
    references: [votingCenters.id],
  }),
  participations: many(participations),
}));

export const participationsRelations = relations(participations, ({ one }) => ({
  employee: one(employees, {
    fields: [participations.employeeId],
    references: [employees.id],
  }),
  event: one(events, {
    fields: [participations.eventId],
    references: [events.id],
  }),
  nonParticipationReason: one(nonParticipationReasons, {
    fields: [participations.nonParticipationReasonId],
    references: [nonParticipationReasons.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  company: one(companies, {
    fields: [events.companyId],
    references: [companies.id],
  }),
  participations: many(participations),
  csvListings: many(csvListings),
}));

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
  user: one(users, {
    fields: [userCompanies.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userCompanies.companyId],
    references: [companies.id],
  }),
}));

export const csvListingsRelations = relations(csvListings, ({ one }) => ({
  event: one(events, {
    fields: [csvListings.eventId],
    references: [events.id],
  }),
  generatedBy: one(users, {
    fields: [csvListings.generatedBy],
    references: [users.id],
  }),
}));
