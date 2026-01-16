import { z } from 'zod';
import { auth } from '~~/server/auth';
import { events } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

const createEventSchema = z.object({
  name: z.string().min(3),
  date: z.coerce.date(),
  type: z.enum(['voting', 'medical', 'training', 'other']).default('voting'),
  active: z.boolean().default(false),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const companyId = await getUserCompanyId(session.user.id, event);
  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' });
  }

  const body = await readValidatedBody(event, (b) =>
    createEventSchema.parse(b),
  );

  console.log('Creating event with body:', body);

  const [newEvent] = await db
    .insert(events)
    .values({
      id: crypto.randomUUID(),
      name: body.name,
      // Ensure date is a valid Date object
      eventDate: new Date(body.date),
      type: body.type,
      isActive: body.active,
      description: body.description,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    ...newEvent,
    date: newEvent.eventDate,
    active: newEvent.isActive,
  };
});
