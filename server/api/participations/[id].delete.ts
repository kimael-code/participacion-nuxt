import { eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { participations } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const result = await db
    .delete(participations)
    .where(eq(participations.id, id))
    .returning();

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Participation not found' });
  }

  return { success: true };
});
