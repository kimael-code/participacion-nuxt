import { asc, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { municipalities } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const { stateId } = getQuery(event);

  let query = db
    .select()
    .from(municipalities)
    .orderBy(asc(municipalities.name));

  if (stateId) {
    // @ts-expect-error - dynamic query builder
    query = query.where(eq(municipalities.stateId, stateId as string));
  } else {
    // If db.select().where() return type is different from db.select(), we might need a different approach
    // Better to construct the query with conditions
    if (stateId) {
      return await db
        .select()
        .from(municipalities)
        .where(eq(municipalities.stateId, stateId as string))
        .orderBy(asc(municipalities.name));
    }
  }

  return await db
    .select()
    .from(municipalities)
    .orderBy(asc(municipalities.name));
});
