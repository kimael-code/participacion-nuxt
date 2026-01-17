import { asc, eq } from 'drizzle-orm';
import {
  locations,
  municipalities,
  parishes,
  states,
} from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth provided by middleware (locations are shared catalog)
  // No company filtering needed as locations are platform-wide

  const result = await db
    .select({
      id: locations.id,
      name: locations.name,
      type: locations.type,
      address: locations.address,
      parish: {
        id: parishes.id,
        name: parishes.name,
      },
      municipality: {
        id: municipalities.id,
        name: municipalities.name,
      },
      state: {
        id: states.id,
        name: states.name,
      },
      capacity: locations.capacity,
      notes: locations.notes,
    })
    .from(locations)
    .leftJoin(parishes, eq(locations.parishId, parishes.id))
    .leftJoin(municipalities, eq(parishes.municipalityId, municipalities.id))
    .leftJoin(states, eq(municipalities.stateId, states.id))
    .orderBy(asc(locations.name));

  return result;
});
