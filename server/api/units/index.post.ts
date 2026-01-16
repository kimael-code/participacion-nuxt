import { z } from 'zod';
import { auth } from '~~/server/auth';
import { administrativeUnits } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

const createUnitSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' });
  }

  const body = await readValidatedBody(event, (b) => createUnitSchema.parse(b));

  try {
    const [unit] = await db
      .insert(administrativeUnits)
      .values({
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return unit;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Unit name already exists',
      });
    }
    throw error;
  }
});
