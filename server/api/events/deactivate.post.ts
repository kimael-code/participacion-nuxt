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

  const companyId = await getUserCompanyId(session.user.id, event);
  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  const body = await readBody(event);
  const { eventId } = body;

  if (!eventId) {
    throw createError({ statusCode: 400, message: 'eventId is required' });
  }

  const [updated] = await db
    .update(events)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(and(eq(events.id, eventId), eq(events.companyId, companyId)))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Event not found' });
  }

  return {
    ...updated,
    date: updated.eventDate,
    active: updated.isActive,
  };
});
