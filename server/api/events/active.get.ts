import { and, eq } from 'drizzle-orm';
import { events } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const activeEvents = await db.query.events.findMany({
    where: and(eq(events.companyId, companyId), eq(events.isActive, true)),
  });

  return activeEvents.map((event) => ({
    id: event.id,
    name: event.name,
    eventDate: event.eventDate,
  }));
});
