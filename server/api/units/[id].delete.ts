import { and, eq } from 'drizzle-orm';
import { administrativeUnits } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const [deleted] = await db
    .delete(administrativeUnits)
    .where(
      and(
        eq(administrativeUnits.id, id),
        eq(administrativeUnits.companyId, companyId),
      ),
    )
    .returning();

  if (!deleted) {
    throw createError({
      statusCode: 404,
      message: 'Unit not found or access denied',
    });
  }

  return { success: true };
});
