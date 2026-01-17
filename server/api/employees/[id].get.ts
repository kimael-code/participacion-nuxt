import { and, eq } from 'drizzle-orm';
import { employees } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const employee = await db.query.employees.findFirst({
    where: and(eq(employees.id, id), eq(employees.companyId, companyId)),
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
  });

  if (!employee) {
    throw createError({
      statusCode: 404,
      message: 'Employee not found or access denied',
    });
  }

  return employee;
});
