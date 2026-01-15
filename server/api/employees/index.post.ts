import { eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { employees, userCompanies } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);

  // Get user's company
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
    throw createError({
      statusCode: 403,
      message: 'User does not belong to any company',
    });
  }

  const newEmployee = await db
    .insert(employees)
    .values({
      id: crypto.randomUUID(),
      cedula: body.cedula,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      companyId: userCompany.companyId,
      administrativeUnitId: body.administrativeUnitId,
      votingCenterId: body.votingCenterId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newEmployee[0];
});
