import { auth } from '~~/server/auth';
import { employees } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const { items } = await readBody(event);

  if (!items || !Array.isArray(items)) {
    throw createError({ statusCode: 400, message: 'Invalid items array' });
  }

  // Get target company ID
  const companyId = await getUserCompanyId(session.user.id);

  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' });
  }
  const now = new Date();

  // Process items in chunks or a single transaction
  try {
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .insert(employees)
          .values({
            id: crypto.randomUUID(),
            cedula: item.cedula,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            phone: item.phone,
            companyId,
            administrativeUnitId: item.administrativeUnitId,
            votingCenterId: item.votingCenterId,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: employees.cedula, // Handle duplicates by cedula within the same company ideally
            set: {
              firstName: item.firstName,
              lastName: item.lastName,
              email: item.email,
              phone: item.phone,
              updatedAt: now,
            },
          });
      }
    });

    return { success: true, count: items.length };
  } catch (error) {
    console.error('Batch import error:', error);
    throw createError({ statusCode: 500, message: 'Error during mass import' });
  }
});
