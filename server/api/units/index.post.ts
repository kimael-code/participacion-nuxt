import { z } from 'zod';
import { administrativeUnits } from '../../database/schema';
import { db } from '../../utils/db';

const createUnitSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

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
