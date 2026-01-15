import { and, asc, eq, like, or } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { employees, userCompanies } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const query = getQuery(event);
  const q = query.q as string;
  const unitId = query.unitId as string;
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // Get user's company
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
    return { data: [], total: 0 };
  }

  const filters = [eq(employees.companyId, userCompany.companyId)];

  if (q) {
    filters.push(
      or(
        like(employees.cedula, `%${q}%`),
        like(employees.firstName, `%${q}%`),
        like(employees.lastName, `%${q}%`),
      ),
    );
  }

  if (unitId) {
    filters.push(eq(employees.administrativeUnitId, unitId));
  }

  const whereClause = filters.length > 1 ? and(...filters) : filters[0];

  const results = await db.query.employees.findMany({
    where: whereClause,
    with: {
      administrativeUnit: true,
      votingCenter: true,
    },
    limit,
    offset,
    orderBy: [asc(employees.lastName), asc(employees.firstName)],
  });

  // Simple count for pagination (in a real app we'd use a separate count query or total header)
  // For now, let's keep it simple or return enough info.
  return {
    data: results,
    page,
    limit,
  };
});
