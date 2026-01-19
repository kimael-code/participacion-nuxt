// db is auto-imported in server/utils (or imported if we are in non-auto-import context)
import * as schema from '../database/schema';
import { db } from './db'; // Explicit import to be safe inutils

/**
 * Generates specific test data for a Demo Company.
 * Creates Units, Locations, Employees, Events, and initial Participation data.
 */
export async function seedDemoData(companyId: string) {
  const now = new Date();

  // 0. Ensure Geographic Data (State, Mun, Parish) exists
  const stateId = `demo-state-${companyId}`;
  await db
    .insert(schema.states)
    .values({
      id: stateId,
      name: 'Estado Demo',
      code: 'DMO',
    })
    .onConflictDoNothing();

  const munId = `demo-mun-${companyId}`;
  await db
    .insert(schema.municipalities)
    .values({
      id: munId,
      name: 'Municipio Demo',
      stateId: stateId,
    })
    .onConflictDoNothing();

  const parishId = `demo-parish-${companyId}`;
  await db
    .insert(schema.parishes)
    .values({
      id: parishId,
      name: 'Parroquia Demo',
      municipalityId: munId,
    })
    .onConflictDoNothing();

  // 1. Create Administrative Units
  const unitsData = [
    { name: 'Recursos Humanos', id: `demo-unit-${companyId}-1` },
    { name: 'Tecnología', id: `demo-unit-${companyId}-2` },
    { name: 'Operaciones', id: `demo-unit-${companyId}-3` },
    { name: 'Ventas', id: `demo-unit-${companyId}-4` },
    { name: 'Marketing', id: `demo-unit-${companyId}-5` },
  ];

  await db.insert(schema.administrativeUnits).values(
    unitsData.map((u) => ({
      id: u.id,
      name: u.name,
      companyId: companyId,
      createdAt: now,
      updatedAt: now,
    })),
  );

  // 2. Create Locations
  const locationsData = [
    {
      name: 'Sede Principal',
      id: `demo-loc-${companyId}-1`,
      type: 'office' as const,
    },
    {
      name: 'Sucursal Norte',
      id: `demo-loc-${companyId}-2`,
      type: 'office' as const,
    },
    {
      name: 'Centro de Formación',
      id: `demo-loc-${companyId}-3`,
      type: 'training_center' as const,
    },
  ];

  await db.insert(schema.locations).values(
    locationsData.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      parishId: parishId,
      address: 'Calle Demo 123',
      createdAt: now,
      updatedAt: now,
    })),
  );

  // 3. Create Employees
  const firstNames = [
    'Juan',
    'Maria',
    'Pedro',
    'Ana',
    'Luis',
    'Carmen',
    'Jose',
    'Elena',
    'Carlos',
    'Sofia',
  ];
  const lastNames = [
    'Garcia',
    'Rodriguez',
    'Perez',
    'Gonzalez',
    'Hernandez',
    'Martinez',
    'Lopez',
    'Silva',
    'Torres',
    'Ramirez',
  ];

  const employeesToInsert = [];
  const TOTAL_EMPLOYEES = 50;

  for (let i = 0; i < TOTAL_EMPLOYEES; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const unit = unitsData[Math.floor(Math.random() * unitsData.length)];
    const loc = locationsData[Math.floor(Math.random() * locationsData.length)];

    employeesToInsert.push({
      id: `demo-emp-${companyId}-${i}`,
      companyId: companyId,
      firstName: fn,
      lastName: ln,
      cedula: `V-${10000000 + i}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@demo.com`,
      administrativeUnitId: unit.id,
      locationId: loc.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.insert(schema.employees).values(employeesToInsert);

  // 4. Create Events
  const activeEventId = `demo-evt-${companyId}-active`;
  await db.insert(schema.events).values({
    id: activeEventId,
    companyId: companyId,
    name: 'Elecciones Generales Demo',
    description: 'Evento de demostración activo',
    eventDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const pastEventId = `demo-evt-${companyId}-past`;
  await db.insert(schema.events).values({
    id: pastEventId,
    companyId: companyId,
    name: 'Elecciones Pasadas 2024',
    description: 'Histórico de demostración',
    eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    isActive: false,
    createdAt: now,
    updatedAt: now,
  });

  // 5. Create Participations
  const participationsToInsert = [];

  for (const emp of employeesToInsert) {
    const statusRand = Math.random();

    if (statusRand > 0.6) {
      participationsToInsert.push({
        id: `demo-part-${companyId}-${emp.id}`,
        eventId: activeEventId,
        employeeId: emp.id,
        // companyId is not in participations table (linked via event/employee)
        participated: true,
        registeredBy: null, // system
        registeredAt: now,
        createdAt: now,
        updatedAt: now,
      });
    } else if (statusRand > 0.55 && statusRand <= 0.6) {
      // We don't verify rejection logic in schema right now, assuming simple 'participated' boolean table
      // participations table has 'participated' boolean and 'nonParticipationReasonId'
      // Let's just track successful participations for simplicity of the chart
    }
  }

  if (participationsToInsert.length > 0) {
    await db.insert(schema.participations).values(participationsToInsert);
  }
}
