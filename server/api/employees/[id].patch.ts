import { and, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { employees, userCompanies } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  const id = getRouterParam(event, 'id');

  if (!session || !id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);

  // Verify ownership via company
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
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
      votingCenterId: body.votingCenterId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(employees.id, id), eq(employees.companyId, userCompany.companyId)),
    )
    .returning();

  if (updatedEmployee.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Employee not found or not in company',
    });
  }

  return updatedEmployee[0];
});
