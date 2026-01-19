import { and, eq } from 'drizzle-orm';
import { employees } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const deleted = await db
    .delete(employees)
    .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
    .returning();

  if (deleted.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Employee not found or not in company',
    });
  }

  return { success: true };
});
