import { and, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { events, userCompanies } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const { eventId } = body;

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'eventId is required',
    });
  }

  // Get the company of the event to ensure user has access
  const targetEvent = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!targetEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    });
  }

  // Verify user has access to this company
  const userCompany = await db.query.userCompanies.findFirst({
    where: and(
      eq(userCompanies.userId, session.user.id),
      eq(userCompanies.companyId, targetEvent.companyId),
    ),
  });

  if (!userCompany) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    });
  }

  // Database transaction to deactivate others and activate target
  await db.transaction(async (tx) => {
    // Deactivate all events for this company
    await tx
      .update(events)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(events.companyId, targetEvent.companyId));

    // Activate the selected event
    await tx
      .update(events)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(events.id, eventId));
  });

  return { success: true, message: 'Event activated successfully' };
});
