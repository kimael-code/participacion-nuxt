import { z } from 'zod';
import { events } from '../../database/schema';
import { db } from '../../utils/db';

const createEventSchema = z.object({
  name: z.string().min(3),
  date: z.coerce.date(),
  type: z.enum(['voting', 'medical', 'training', 'other']).default('voting'),
  active: z.boolean().default(false),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const body = await readValidatedBody(event, (b) =>
    createEventSchema.parse(b),
  );

  const [newEvent] = await db
    .insert(events)
    .values({
      id: crypto.randomUUID(),
      name: body.name,
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
