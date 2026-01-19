import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { events } from '../../database/schema';
import { db } from '../../utils/db';

const updateEventSchema = z.object({
  name: z.string().min(3).optional(),
  date: z.coerce.date().optional(),
  type: z.enum(['voting', 'medical', 'training', 'other']).optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const body = await readValidatedBody(event, (b) =>
    updateEventSchema.parse(b),
  );

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.date !== undefined) updateData.eventDate = body.date;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.active !== undefined) updateData.isActive = body.active;
  if (body.description !== undefined) updateData.description = body.description;

  const updated = await db.transaction(async (tx) => {
    if (updateData.isActive === true) {
      // Deactivate all other events for this company
      await tx
        .update(events)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(events.companyId, companyId));
    }

    const [eventRecord] = await tx
      .update(events)
      .set(updateData)
      .where(and(eq(events.id, id), eq(events.companyId, companyId)))
      .returning();

    return eventRecord;
  });

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Event not found' });
  }

  return {
    ...updated,
    date: updated.eventDate,
    active: updated.isActive,
  };
});
