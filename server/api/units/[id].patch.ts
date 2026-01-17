import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { administrativeUnits } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const updateUnitSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const body = await readValidatedBody(event, (b) => updateUnitSchema.parse(b));

  try {
    const [updated] = await db
      .update(administrativeUnits)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(administrativeUnits.id, id),
          eq(administrativeUnits.companyId, companyId), // Security: Ensure unit belongs to user's company
        ),
      )
      .returning();

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Unit not found or access denied',
      });
    }

    return updated;
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
