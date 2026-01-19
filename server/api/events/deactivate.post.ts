import { eq } from 'drizzle-orm';
import { events } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const body = await readBody(event);
  const { eventId } = body;

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'eventId is required',
    });
  }

  // Database transaction to deactivate the event
  await db
    .update(events)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  return { success: true, message: 'Event deactivated successfully' };
});
