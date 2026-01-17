import { and, eq } from 'drizzle-orm';
import { events } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId, user } = event.context.auth!;

  const body = await readBody(event);
  const { eventId } = body;

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'eventId is required',
    });
  }

  // Get the event and verify it belongs to user's company
  const targetEvent = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.companyId, companyId)),
  });

  if (!targetEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found or access denied',
    });
  }

  // Database transaction to deactivate others and activate target
  await db.transaction(async (tx) => {
    // Deactivate all events for this company
    await tx
      .update(events)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(events.companyId, companyId));

    // Activate the selected event
    await tx
      .update(events)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(events.id, eventId));
  });

  return { success: true, message: 'Event activated successfully' };
});
