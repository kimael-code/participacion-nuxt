import { and, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { administrativeUnits } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const result = await db
    .delete(administrativeUnits)
    .where(
      and(
        eq(administrativeUnits.id, id),
        eq(administrativeUnits.companyId, companyId),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Unit not found' });
  }

  return { success: true };
});
