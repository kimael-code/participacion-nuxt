import { and, asc, count, eq, like, or } from 'drizzle-orm';
import {
  locations,
  LocationType,
  municipalities,
  parishes,
  states,
} from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const q = String(query.q || '').trim();
  const type = String(query.type || 'all');
  const offset = (page - 1) * limit;

  // Base conditions
  const conditions = [];

  if (q) {
    const searchCondition = or(
      like(locations.name, `%${q}%`),
      like(locations.address, `%${q}%`),
      like(states.name, `%${q}%`),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (type && type !== 'all') {
    conditions.push(eq(locations.type, type as LocationType));
  }

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(locations)
    .leftJoin(parishes, eq(locations.parishId, parishes.id))
    .leftJoin(municipalities, eq(parishes.municipalityId, municipalities.id))
    .leftJoin(states, eq(municipalities.stateId, states.id))
    .where(and(...conditions));

  const total = Number(totalResult?.count || 0);

  // Get data
  const data = await db
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
    .where(and(...conditions))
    .orderBy(asc(locations.name))
    .limit(limit)
    .offset(offset);

  return {
    data,
    total,
    page,
    limit,
  };
});
