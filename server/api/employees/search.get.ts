import { and, eq, like, or } from 'drizzle-orm';
import { employees } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const query = getQuery(event);
  const searchQuery = query.q as string;

  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      message: 'Search query (q) is required',
    });
  }

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
      location: {
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
