import { and, eq, like, or } from 'drizzle-orm';
import { employees } from '../../database/schema';
import { db } from '../../utils/db';

/**
 * Search employees by cedula
 * GET /api/employees/search?q=12345678&companyId=xxx
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const searchQuery = query.q as string;
  const companyId = query.companyId as string;

  if (!searchQuery || !companyId) {
    throw createError({
      statusCode: 400,
      message: 'Search query (q) and companyId are required',
    });
  }

  // Search by cedula (exact or partial match)
  const results = await db.query.employees.findMany({
    where: and(
      eq(employees.companyId, companyId),
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
