import { asc, eq } from 'drizzle-orm';
import { auth } from '../../auth';
import { municipalities } from '../../database/schema';
import { db } from '../../utils/db';

/* const querySchema = z.object({
  stateId: z.string().optional(),
}); */

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // Use getValidatedQuery instead of getQuery for type safety and to consume the schema if needed,
  // but if we don't use the result, just parsing is enough validation.
  // Actually, getQuery returns Dict<string | string[]>, so we should cast or validate.
  // The original code used getQuery and then cast stateId as string.
  // Let's stick to getQuery if that's what was there, but remove unused assignment.

  const { stateId } = getQuery(event);

  // Or better, validate it so we don't need 'as string'
  // const query = await getValidatedQuery(event, (q) => querySchema.parse(q));
  // if (query.stateId) ...

  // But to minimalist fix:

  if (stateId) {
    return await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.stateId, stateId as string))
      .orderBy(asc(municipalities.name));
  }

  return await db
    .select()
    .from(municipalities)
    .orderBy(asc(municipalities.name));
});
