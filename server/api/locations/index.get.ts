import { asc, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import {
  locations,
  municipalities,
  parishes,
  states,
} from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // Locations are theoretically shared across the platform (master catalog),
  // but if needed we could filter by usage. For now, returning full catalog.
  // We join with geographic tables to provide full context.

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
