import { asc, eq } from 'drizzle-orm';
import { auth } from '../../auth';
import { parishes } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const { municipalityId } = getQuery(event);

  if (municipalityId) {
    return await db
      .select()
      .from(parishes)
      .where(eq(parishes.municipalityId, municipalityId as string))
      .orderBy(asc(parishes.name));
  }

  return await db.select().from(parishes).orderBy(asc(parishes.name));
});
