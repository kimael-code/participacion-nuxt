import { asc } from 'drizzle-orm';
import { auth } from '../../auth';
import { states } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const result = await db.select().from(states).orderBy(asc(states.name));
  return result;
});
