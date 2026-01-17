import { and, eq } from 'drizzle-orm';
import { events } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const activeEvent = await db.query.events.findFirst({
    where: and(eq(events.companyId, companyId), eq(events.isActive, true)),
  });

  if (!activeEvent) {
    return null;
  }

  return {
    ...activeEvent,
    date: activeEvent.eventDate,
    active: activeEvent.isActive,
  };
});
