import { asc, count, eq, like, or } from 'drizzle-orm';
import { administrativeUnits } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  // Query params
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const searchQuery = (query.q as string) || '';

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(administrativeUnits.companyId, companyId)];

  if (searchQuery) {
    whereConditions.push(
      or(
        like(administrativeUnits.name, `%${searchQuery}%`),
        like(administrativeUnits.description, `%${searchQuery}%`),
      )!,
    );
  }

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(administrativeUnits)
    .where(
      whereConditions.length > 1 ? whereConditions[1] : whereConditions[0],
    );

  // Get paginated data
  const units = await db
    .select()
    .from(administrativeUnits)
    .where(whereConditions.length > 1 ? whereConditions[1] : whereConditions[0])
    .orderBy(asc(administrativeUnits.name))
    .limit(limit)
    .offset(offset);

  return {
    data: units,
    total,
    page,
    limit,
  };
});
