import { eq } from 'drizzle-orm';
import { locations } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth provided by middleware
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const [deleted] = await db
    .delete(locations)
    .where(eq(locations.id, id))
    .returning();

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Location not found' });
  }

  return { success: true };
});
