import { and, eq, like, or } from 'drizzle-orm';
import { auth } from '../../auth';
import { employees, userCompanies } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const query = getQuery(event);
  const searchQuery = query.q as string;

  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      message: 'Search query (q) is required',
    });
  }

  // Get user's company
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
    return [];
  }

  const results = await db.query.employees.findMany({
    where: and(
      eq(employees.companyId, userCompany.companyId),
      or(
        like(employees.cedula, `%${searchQuery}%`),
        like(employees.firstName, `%${searchQuery}%`),
        like(employees.lastName, `%${searchQuery}%`),
      ),
    ),
    with: {
      administrativeUnit: true,
      votingCenter: {
        with: {
          parish: {
            with: {
              municipality: {
                with: {
                  state: true,
                },
              },
            },
          },
        },
      },
    },
    limit: 10,
  });

  return results;
});
