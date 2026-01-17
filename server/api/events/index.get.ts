import { eq } from 'drizzle-orm';
import { events } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const allEvents = await db.query.events.findMany({
    where: eq(events.companyId, companyId),
    orderBy: (records, { desc }) => [desc(records.eventDate)],
  });

  return allEvents.map((e) => ({
    ...e,
    date: e.eventDate,
    active: e.isActive,
  }));
});
