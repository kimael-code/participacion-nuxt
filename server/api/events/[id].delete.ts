import { and, eq } from 'drizzle-orm';
import { events } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;
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
