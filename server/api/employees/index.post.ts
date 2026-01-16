import { auth } from '~~/server/auth';
import { employees } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);

  // Get target company ID
  const companyId = await getUserCompanyId(session.user.id);

  if (!companyId) {
    throw createError({
      statusCode: 403,
      message: 'User does not belong to any company and no fallback available',
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
      companyId: companyId,
      administrativeUnitId: body.administrativeUnitId,
      locationId: body.locationId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newEmployee[0];
});
