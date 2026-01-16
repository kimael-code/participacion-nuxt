import { and, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { employees } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  const id = getRouterParam(event, 'id');

  if (!session || !id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);

  // Get target company ID
  const companyId = await getUserCompanyId(session.user.id);

  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' });
  }

  const updatedEmployee = await db
    .update(employees)
    .set({
      cedula: body.cedula,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      administrativeUnitId: body.administrativeUnitId,
      locationId: body.locationId,
      updatedAt: new Date(),
    })
    .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
    .returning();

  if (updatedEmployee.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Employee not found or not in company',
    });
  }

  return updatedEmployee[0];
});
