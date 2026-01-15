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

  // Get the user's primary company (for now, the first one found)
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
    return [];
  }

  const activeEvents = await db.query.events.findMany({
    where: and(
      eq(events.companyId, userCompany.companyId),
      eq(events.isActive, true),
    ),
    orderBy: (records, { desc }) => [desc(records.eventDate)],
  });

  return activeEvents;
});
