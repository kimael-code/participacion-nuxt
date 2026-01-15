import { auth } from '~~/server/auth';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const reasons = await db.query.nonParticipationReasons.findMany({
    orderBy: (records, { asc }) => [asc(records.name)],
  });

  return reasons;
});
