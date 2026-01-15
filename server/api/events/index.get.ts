import { eq } from 'drizzle-orm';
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

  // Get the user's primary company
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
    return [];
  }

  const allEvents = await db.query.events.findMany({
    where: eq(events.companyId, userCompany.companyId),
    orderBy: (records, { desc }) => [desc(records.eventDate)],
  });

  return allEvents;
});
