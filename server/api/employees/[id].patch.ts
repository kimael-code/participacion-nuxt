import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { employees } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const updateEmployeeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  cedula: z.string().optional(),
  administrativeUnitId: z.string().optional(),
  locationId: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const body = await readValidatedBody(event, (b) =>
    updateEmployeeSchema.parse(b),
  );

  const [updated] = await db
    .update(employees)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
    .returning();

  if (!updated) {
    throw createError({
      statusCode: 404,
      message: 'Employee not found or not in company',
    });
  }

  return updated;
});
