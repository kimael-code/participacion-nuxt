import { db } from '../utils/db';
import {
  administrativeUnits,
  companies,
  employees,
  events,
  locations,
  LocationType,
  municipalities,
  nonParticipationReasons,
  parishes,
  participations,
  permissions,
  rolePermissions,
  roles,
  states,
  userCompanies,
} from './schema';

async function seed() {
  // Check for development environment
  if (process.env.NODE_ENV !== 'development') {
    console.error(
      '❌ Error: Seed script can only be run in development environment.',
    );
    process.exit(1);
  }

  console.log('🌱 Starting advanced seed...');

  try {
    // 0. Base Data: Roles & Permissions
    console.log('Inserting RBAC data...');

    const permissionsList = [
      {
        slug: 'participation:register',
        name: 'Registrar Participación',
        desc: 'Permite registrar asistencia de empleados',
      },
      {
        slug: 'reports:read',
        name: 'Ver Reportes',
        desc: 'Permite visualizar estadísticas y listados',
      },
      {
        slug: 'reports:export',
        name: 'Exportar Datos',
        desc: 'Permite generar archivos CSV y PDF',
      },
      {
        slug: 'employees:read',
        name: 'Ver Empleados',
        desc: 'Permite ver el listado de empleados',
      },
      {
        slug: 'employees:manage',
        name: 'Gestionar Empleados',
        desc: 'Permite crear, editar y eliminar empleados',
      },
      {
        slug: 'events:read',
        name: 'Ver Eventos',
        desc: 'Permite ver listado de eventos',
      },
      {
        slug: 'units:read',
        name: 'Ver Unidades',
        desc: 'Permite ver unidades administrativas',
      },
    ];

    const createdPermissions: Record<string, string> = {};
    for (const p of permissionsList) {
      const [perm] = await db
        .insert(permissions)
        .values({
          id: crypto.randomUUID(),
          slug: p.slug,
          name: p.name,
          description: p.desc,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: permissions.slug,
          set: { name: p.name, updatedAt: new Date() },
        })
        .returning();
      createdPermissions[p.slug] = perm.id;
    }

    const rolesList = [
      { slug: 'admin', name: 'Administrador', desc: 'Acceso total al sistema' },
      {
        slug: 'operator',
        name: 'Operador',
        desc: 'Registro de participación y consultas básicas',
      },
      {
        slug: 'reporter',
        name: 'Generador de Reportes',
        desc: 'Acceso a estadísticas y exportación de datos',
      },
    ];

    const roleToPerms: Record<string, string[]> = {
      admin: permissionsList.map((p) => p.slug),
      operator: ['participation:register', 'employees:read', 'events:read'],
      reporter: ['reports:read', 'reports:export', 'employees:read'],
    };

    for (const r of rolesList) {
      const [role] = await db
        .insert(roles)
        .values({
          id: crypto.randomUUID(),
          slug: r.slug,
          name: r.name,
          description: r.desc,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: roles.slug,
          set: { name: r.name, updatedAt: new Date() },
        })
        .returning();

      const permsToAssign = roleToPerms[r.slug] || [];
      for (const pSlug of permsToAssign) {
        await db
          .insert(rolePermissions)
          .values({
            id: crypto.randomUUID(),
            roleId: role.id,
            permissionId: createdPermissions[pSlug],
            createdAt: new Date(),
          })
          .onConflictDoNothing();
      }
    }

    // 1. Geographic Data
    console.log('Inserting geographic data...');
    const [lara] = await db
      .insert(states)
      .values({ id: crypto.randomUUID(), name: 'Lara', code: 'LAR' })
      .onConflictDoUpdate({ target: states.name, set: { code: 'LAR' } })
      .returning();
    const [iribarren] = await db
      .insert(municipalities)
      .values({ id: crypto.randomUUID(), name: 'Iribarren', stateId: lara.id })
      .onConflictDoUpdate({
        target: [municipalities.name, municipalities.stateId],
        set: { name: 'Iribarren' },
      })
      .returning();

    const parishesNames = [
      'Catedral',
      'Concepción',
      'Santa Rosa',
      'Tamaca',
      'Unión',
    ];
    const createdParishes = [];
    for (const pName of parishesNames) {
      const [p] = await db
        .insert(parishes)
        .values({
          id: crypto.randomUUID(),
          name: pName,
          municipalityId: iribarren.id,
        })
        .onConflictDoUpdate({
          target: [parishes.name, parishes.municipalityId],
          set: { name: pName },
        })
        .returning();
      createdParishes.push(p);
    }

    // 2. Non-participation Reasons
    console.log('Inserting reasons...');
    const reasonsList = [
      'Enfermedad',
      'Viaje',
      'Emergencia Familiar',
      'Turno de Trabajo',
      'Vacaciones',
      'Otro',
    ];
    const reasonIds = [];
    for (const rName of reasonsList) {
      const [reason] = await db
        .insert(nonParticipationReasons)
        .values({ id: crypto.randomUUID(), name: rName, createdAt: new Date() })
        .onConflictDoNothing()
        .returning();
      if (reason) reasonIds.push(reason.id);
    }

    // 3. Companies & Related Data
    const companiesToCreate = [
      {
        name: 'Corporación Tecnológica Alpha',
        rif: 'J-10000000-1',
        employeeCount: 50,
        units: [
          'Dirección de Tecnología',
          'Departamento de Sistemas',
          'Infraestructura y Redes',
          'I+D',
        ],
      },
      {
        name: 'Servicios Industriales Beta',
        rif: 'J-20000000-2',
        employeeCount: 150,
        units: [
          'Gerencia de Informática',
          'Soporte Técnico',
          'Procesamientos de Datos',
          'Seguridad Digital',
        ],
      },
    ];

    const allExistingUserIds = (await db.query.users.findMany()).map(
      (u) => u.id,
    );

    for (const companyDef of companiesToCreate) {
      console.log(`Processing company: ${companyDef.name}`);

      const [company] = await db
        .insert(companies)
        .values({
          id: crypto.randomUUID(),
          name: companyDef.name,
          rif: companyDef.rif,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: companies.rif,
          set: { name: companyDef.name, updatedAt: new Date() },
        })
        .returning();

      // Units for this company
      const createdUnits = [];
      for (const uName of companyDef.units) {
        const [unit] = await db
          .insert(administrativeUnits)
          .values({
            id: crypto.randomUUID(),
            name: uName,
            companyId: company.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [administrativeUnits.name, administrativeUnits.companyId],
            set: { updatedAt: new Date() },
          })
          .returning();
        createdUnits.push(unit);
      }

      // Locations for this company
      const [location] = await db
        .insert(locations)
        .values({
          id: crypto.randomUUID(),
          name: `Sede Principal - ${companyDef.name}`,
          type: LocationType.OFFICE,
          address: 'Calle Real con Av. Libertador',
          parishId: createdParishes[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      // Employees
      console.log(`  Creating ${companyDef.employeeCount} employees...`);
      const employeesList = [];
      for (let i = 0; i < companyDef.employeeCount; i++) {
        const unit =
          createdUnits[Math.floor(Math.random() * createdUnits.length)];
        const [employee] = await db
          .insert(employees)
          .values({
            id: crypto.randomUUID(),
            cedula: `${10000000 + Math.floor(Math.random() * 20000000)}`,
            firstName: `Empleado_${companyDef.rif.split('-')[1]}_${i}`,
            lastName: 'Prueba',
            email: `emp_${i}@${companyDef.rif.toLowerCase()}.com`,
            companyId: company.id,
            administrativeUnitId: unit.id,
            locationId: location.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing()
          .returning();
        if (employee) employeesList.push(employee);
      }

      // Event
      const [event] = await db
        .insert(events)
        .values({
          id: crypto.randomUUID(),
          name: `Evento de Participación - ${companyDef.name}`,
          description: 'Medición de compromiso trimestral',
          type: 'other',
          eventDate: new Date(),
          companyId: company.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      // Participations
      if (event && employeesList.length > 0) {
        console.log(
          `  Generating random participation for ${employeesList.length} employees...`,
        );
        for (const employee of employeesList) {
          const participated = Math.random() > 0.3; // 70% participation
          const hasReason = !participated && Math.random() > 0.5;

          await db
            .insert(participations)
            .values({
              id: crypto.randomUUID(),
              employeeId: employee.id,
              eventId: event.id,
              participated,
              nonParticipationReasonId: hasReason
                ? reasonIds[Math.floor(Math.random() * reasonIds.length)]
                : null,
              registeredBy: allExistingUserIds[0] || null,
              registeredAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoNothing();
        }
      }

      // Link existing users to this company
      for (const userId of allExistingUserIds) {
        await db
          .insert(userCompanies)
          .values({
            id: crypto.randomUUID(),
            userId,
            companyId: company.id,
            role: 'admin',
            createdAt: new Date(),
          })
          .onConflictDoNothing();
      }
    }

    console.log('✅ Advanced seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
