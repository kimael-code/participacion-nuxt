import { and, eq } from 'drizzle-orm';
import Papa from 'papaparse';
import { auth } from '../auth';
import {
  administrativeUnits,
  employees,
  locations,
  LocationType,
  municipalities,
  parishes,
  states,
} from '../database/schema';
import { db } from '../utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const { companyId, csvData } = body;

  if (!companyId || !csvData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing companyId or csvData',
    });
  }

  // Verificar acceso a la empresa
  await requireCompanyAccess(event, companyId);

  // Parsear CSV
  const parsed = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  const results = {
    created: {
      states: 0,
      municipalities: 0,
      parishes: 0,
      locations: 0,
      administrativeUnits: 0,
      employees: 0,
    },
    updated: {
      locations: 0,
      employees: 0,
    },
    errors: [] as string[],
  };

  // Cachés para evitar búsquedas repetidas
  const stateCache = new Map<string, string>(); // name -> id
  const municipalityCache = new Map<string, string>(); // name+stateId -> id
  const parishCache = new Map<string, string>(); // name+municipalityId -> id
  const locationCache = new Map<string, string>(); // name -> id
  const unitCache = new Map<string, string>(); // name+companyId -> id

  for (const row of parsed.data as any[]) {
    try {
      // Validar datos mínimos
      if (
        !row.cedula ||
        !row.firstName ||
        !row.lastName ||
        !row.administrativeUnit ||
        !row.locationName ||
        !row.state ||
        !row.municipality ||
        !row.parish
      ) {
        throw new Error('Faltan campos requeridos');
      }

      // 1. Buscar o crear estado
      let stateId = stateCache.get(row.state);
      if (!stateId) {
        const state = await db
          .select()
          .from(states)
          .where(eq(states.name, row.state))
          .limit(1);

        if (state.length === 0) {
          const [newState] = await db
            .insert(states)
            .values({
              id: crypto.randomUUID(),
              name: row.state,
            })
            .returning();
          stateId = newState.id;
          results.created.states++;
        } else {
          stateId = state[0].id;
        }
        stateCache.set(row.state, stateId);
      }

      // 2. Buscar o crear municipio
      const munKey = `${row.municipality}|${stateId}`;
      let municipalityId = municipalityCache.get(munKey);
      if (!municipalityId) {
        const municipality = await db
          .select()
          .from(municipalities)
          .where(
            and(
              eq(municipalities.name, row.municipality),
              eq(municipalities.stateId, stateId),
            ),
          )
          .limit(1);

        if (municipality.length === 0) {
          const [newMun] = await db
            .insert(municipalities)
            .values({
              id: crypto.randomUUID(),
              name: row.municipality,
              stateId,
            })
            .returning();
          municipalityId = newMun.id;
          results.created.municipalities++;
        } else {
          municipalityId = municipality[0].id;
        }
        municipalityCache.set(munKey, municipalityId);
      }

      // 3. Buscar o crear parroquia
      const parKey = `${row.parish}|${municipalityId}`;
      let parishId = parishCache.get(parKey);
      if (!parishId) {
        const parish = await db
          .select()
          .from(parishes)
          .where(
            and(
              eq(parishes.name, row.parish),
              eq(parishes.municipalityId, municipalityId),
            ),
          )
          .limit(1);

        if (parish.length === 0) {
          const [newParish] = await db
            .insert(parishes)
            .values({
              id: crypto.randomUUID(),
              name: row.parish,
              municipalityId,
            })
            .returning();
          parishId = newParish.id;
          results.created.parishes++;
        } else {
          parishId = parish[0].id;
        }
        parishCache.set(parKey, parishId);
      }

      // 4. Buscar o crear ubicación
      let locationId = locationCache.get(row.locationName);
      if (!locationId) {
        const location = await db
          .select()
          .from(locations)
          .where(eq(locations.name, row.locationName))
          .limit(1);

        // Validar tipo de ubicación, fallback a 'other' si no es válido
        const locationTypeRaw = row.locationType || 'other';
        const locationType = Object.values(LocationType).includes(
          locationTypeRaw as LocationType,
        )
          ? (locationTypeRaw as LocationType)
          : LocationType.OTHER;

        if (location.length === 0) {
          const [newLocation] = await db
            .insert(locations)
            .values({
              id: crypto.randomUUID(),
              name: row.locationName,
              type: locationType,
              address: row.locationAddress || 'Desconocida',
              parishId,
              latitude: row.locationLat ? parseFloat(row.locationLat) : null,
              longitude: row.locationLng ? parseFloat(row.locationLng) : null,
              capacity: row.locationCapacity
                ? parseInt(row.locationCapacity)
                : null,
              notes: row.locationNotes || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          locationId = newLocation.id;
          results.created.locations++;
        } else {
          // Actualizar ubicación existente
          await db
            .update(locations)
            .set({
              type: locationType,
              address: row.locationAddress || location[0].address,
              parishId, // Actualizar parroquia si cambia
              latitude: row.locationLat
                ? parseFloat(row.locationLat)
                : location[0].latitude,
              longitude: row.locationLng
                ? parseFloat(row.locationLng)
                : location[0].longitude,
              capacity: row.locationCapacity
                ? parseInt(row.locationCapacity)
                : location[0].capacity,
              notes: row.locationNotes || location[0].notes,
              updatedAt: new Date(),
            })
            .where(eq(locations.id, location[0].id));
          locationId = location[0].id;
          results.updated.locations++;
        }
        locationCache.set(row.locationName, locationId);
      }

      // 5. Buscar o crear unidad administrativa
      const unitKey = `${row.administrativeUnit}|${companyId}`;
      let unitId = unitCache.get(unitKey);
      if (!unitId) {
        const unit = await db
          .select()
          .from(administrativeUnits)
          .where(
            and(
              eq(administrativeUnits.name, row.administrativeUnit),
              eq(administrativeUnits.companyId, companyId),
            ),
          )
          .limit(1);

        if (unit.length === 0) {
          const [newUnit] = await db
            .insert(administrativeUnits)
            .values({
              id: crypto.randomUUID(),
              name: row.administrativeUnit,
              companyId,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          unitId = newUnit.id;
          results.created.administrativeUnits++;
        } else {
          unitId = unit[0].id;
        }
        unitCache.set(unitKey, unitId);
      }

      // 6. Crear o actualizar empleado (UPSERT)
      const existingEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.cedula, row.cedula))
        .limit(1);

      if (existingEmployee.length > 0) {
        // Actualizar
        await db
          .update(employees)
          .set({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email || null,
            phone: row.phone || null,
            administrativeUnitId: unitId,
            locationId,
            companyId, // Asegurar que pertenezca a la empresa actual (o moverlo si es necesario)
            updatedAt: new Date(),
          })
          .where(eq(employees.id, existingEmployee[0].id));

        results.updated.employees++;
      } else {
        // Crear
        await db.insert(employees).values({
          id: crypto.randomUUID(),
          cedula: row.cedula,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || null,
          phone: row.phone || null,
          companyId,
          administrativeUnitId: unitId,
          locationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        results.created.employees++;
      }
    } catch (error: any) {
      results.errors.push(
        `Cédula ${row.cedula || 'desconocida'}: ${error.message}`,
      );
    }
  }

  return results;
});
