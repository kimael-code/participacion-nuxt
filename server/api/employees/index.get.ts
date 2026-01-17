import { and, asc, count, eq, like, or } from 'drizzle-orm';
import { employees } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const query = getQuery(event);
  const q = query.q as string;
  const unitId = query.unitId as string;
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const filters = [eq(employees.companyId, companyId)];

  if (q) {
    const searchFilters = [
      like(employees.cedula, `%${q}%`),
      like(employees.firstName, `%${q}%`),
      like(employees.lastName, `%${q}%`),
    ];
    filters.push(or(...searchFilters)!);
  }

  if (unitId) {
    filters.push(eq(employees.administrativeUnitId, unitId));
  }

  const whereClause = filters.length > 1 ? and(...filters) : filters[0];

  const [results, totalResult] = await Promise.all([
    db.query.employees.findMany({
      where: whereClause,
      with: {
        administrativeUnit: true,
        location: true,
      },
      limit,
      offset,
      orderBy: [asc(employees.lastName), asc(employees.firstName)],
    }),
    db
      .select({ count: count() })
      .from(employees)
      .where(whereClause || undefined),
  ]);

  const total = totalResult[0]?.count || 0;

  return {
    data: results,
    total,
    page,
    limit,
  };
});
