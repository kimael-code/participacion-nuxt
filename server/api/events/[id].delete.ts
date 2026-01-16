import { and, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { events } from '~~/server/database/schema';
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
    .delete(events)
    .where(and(eq(events.id, id), eq(events.companyId, companyId)))
    .returning();

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Event not found' });
  }

  return { success: true };
});
