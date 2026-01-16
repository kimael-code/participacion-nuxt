import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '~~/server/auth';
import { events } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

const updateEventSchema = z.object({
  name: z.string().min(3).optional(),
  date: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const body = await readValidatedBody(event, (b) =>
    updateEventSchema.parse(b),
  );

  const [updated] = await db
    .update(events)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(events.id, id), eq(events.companyId, companyId)))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Event not found' });
  }

  return updated;
});
