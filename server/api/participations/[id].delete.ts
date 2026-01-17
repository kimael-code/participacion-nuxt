import { eq } from 'drizzle-orm';
import { participations } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth provided by middleware
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const [deleted] = await db
    .delete(participations)
    .where(eq(participations.id, id))
    .returning();

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Participation not found' });
  }

  return { success: true };
});
