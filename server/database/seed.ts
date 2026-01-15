import { db } from '../utils/db';
import {
  administrativeUnits,
  companies,
  employees,
  events,
  municipalities,
  nonParticipationReasons,
  parishes,
  permissions,
  rolePermissions,
  roles,
  states,
  userCompanies,
  votingCenters,
} from './schema';

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // 0. Roles y Permisos
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
      admin: permissionsList.map((p) => p.slug), // All
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

      // Assign permissions to role
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

    // 1. Estados, Municipios, Parroquias (Data de ejemplo de Venezuela)
    console.log('Inserting geographic data...');

    // Estado Lara (Ejemplo)
    const [lara] = await db
      .insert(states)
      .values({
        id: crypto.randomUUID(),
        name: 'Lara',
        code: 'LAR',
      })
      .onConflictDoUpdate({
        target: states.name,
        set: { code: 'LAR' },
      })
      .returning();

    // Municipio Iribarren
    const [iribarren] = await db
      .insert(municipalities)
      .values({
        id: crypto.randomUUID(),
        name: 'Iribarren',
        stateId: lara.id,
      })
      .onConflictDoUpdate({
        target: [municipalities.name, municipalities.stateId],
        set: { name: 'Iribarren' },
      })
      .returning();

    // Parroquias de Iribarren
    const parishesList = [
      'Catedral',
      'Concepción',
      'El Cují',
      'Juan de Villegas',
      'Santa Rosa',
      'Tamaca',
      'Unión',
    ];

    const createdParishes = [];
    for (const pName of parishesList) {
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

    // 2. Empresa de Prueba
    console.log('Inserting company data...');
    const [company] = await db
      .insert(companies)
      .values({
        id: crypto.randomUUID(),
        name: 'Empresa Demo C.A.',
        rif: 'J-12345678-9',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: companies.rif,
        set: { name: 'Empresa Demo C.A.', updatedAt: new Date() },
      })
      .returning();

    // 3. Unidades Administrativas
    console.log('Inserting administrative units...');
    const unitsList = [
      'Recursos Humanos',
      'Tecnología',
      'Finanzas',
      'Operaciones',
      'Ventas',
    ];

    const createdUnits = [];
    for (const uName of unitsList) {
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

    // 4. Centros de Votación
    console.log('Inserting voting centers...');
    const centersList = [
      {
        name: 'Escuela Básica Ciudad de Barquisimeto',
        address: 'Av. Libertador',
      },
      { name: 'Liceo Lisandro Alvarado', address: 'Carrera 15' },
      { name: 'Colegio San Pedro', address: 'Urbanización del Este' },
    ];

    const createdCenters = [];
    for (const center of centersList) {
      const randomParish =
        createdParishes[Math.floor(Math.random() * createdParishes.length)];
      const [c] = await db
        .insert(votingCenters)
        .values({
          id: crypto.randomUUID(),
          name: center.name,
          address: center.address,
          parishId: randomParish.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: votingCenters.name,
          set: { address: center.address, updatedAt: new Date() },
        })
        .returning();
      createdCenters.push(c);
    }

    // 5. Empleados
    console.log('Inserting employees...');
    const employeesCount = 50;
    for (let i = 0; i < employeesCount; i++) {
      const unit =
        createdUnits[Math.floor(Math.random() * createdUnits.length)];
      const center =
        createdCenters[Math.floor(Math.random() * createdCenters.length)];

      await db
        .insert(employees)
        .values({
          id: crypto.randomUUID(),
          cedula: Math.floor(10000000 + Math.random() * 20000000).toString(),
          firstName: `Nombre${i}`,
          lastName: `Apellido${i}`,
          email: `empleado${i}@empresa.com`,
          companyId: company.id,
          administrativeUnitId: unit.id,
          votingCenterId: center.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    // 6. Evento de Prueba
    console.log('Inserting event...');
    const [event] = await db
      .insert(events)
      .values({
        id: crypto.randomUUID(),
        name: 'Elecciones Sindicales 2026',
        description: 'Elección de representantes sindicales',
        eventDate: new Date(),
        companyId: company.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: events.name,
        set: {
          description: 'Elección de representantes sindicales',
          updatedAt: new Date(),
        },
      })
      .returning();

    // 7. Motivos de No Participación
    console.log('Inserting non-participation reasons...');
    const reasonsList = [
      'Enfermedad',
      'Viaje',
      'Emergencia Familiar',
      'Turno de Trabajo',
      'Otro',
    ];

    for (const reason of reasonsList) {
      await db
        .insert(nonParticipationReasons)
        .values({
          id: crypto.randomUUID(),
          name: reason,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    }

    // 8. Vincular usuarios existentes a la empresa (Modo Dev)
    console.log('Checking for existing users to link...');
    const existingUsers = await db.query.users.findMany();
    for (const u of existingUsers) {
      await db
        .insert(userCompanies)
        .values({
          id: crypto.randomUUID(),
          userId: u.id,
          companyId: company.id,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    }
    console.log(`Company ID: ${company.id}`);
    console.log(`Event ID: ${event.id}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
