import { db } from '../utils/db';
import {
  administrativeUnits,
  companies,
  employees,
  events,
  municipalities,
  nonParticipationReasons,
  parishes,
  states,
  votingCenters,
} from './schema';

async function seed() {
  console.log('🌱 Starting seed...');

  try {
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
      .returning();

    // Municipio Iribarren
    const [iribarren] = await db
      .insert(municipalities)
      .values({
        id: crypto.randomUUID(),
        name: 'Iribarren',
        stateId: lara.id,
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

      await db.insert(employees).values({
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
      });
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
      await db.insert(nonParticipationReasons).values({
        id: crypto.randomUUID(),
        name: reason,
        createdAt: new Date(),
      });
    }

    console.log('✅ Seed completed successfully!');
    console.log(`Company ID: ${company.id}`);
    console.log(`Event ID: ${event.id}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
