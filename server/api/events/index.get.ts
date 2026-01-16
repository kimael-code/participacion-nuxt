import { eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { events } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const { getUserCompanyId } = await import('~~/server/utils/auth'); // Need to import or it might be global if configured
  const companyId = await getUserCompanyId(session.user.id, event);

  if (!companyId) {
    return [];
  }

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
