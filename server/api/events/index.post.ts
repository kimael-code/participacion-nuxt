import { z } from 'zod';
import { auth } from '~~/server/auth';
import { events } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

const createEventSchema = z.object({
  name: z.string().min(3),
  date: z.string().transform((str) => new Date(str)),
  active: z.boolean().default(false),
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

  const body = await readValidatedBody(event, (b) =>
    createEventSchema.parse(b),
  );

  const [newEvent] = await db
    .insert(events)
    .values({
      id: crypto.randomUUID(),
      name: body.name,
      date: body.date,
      active: body.active,
      description: body.description,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newEvent;
});
