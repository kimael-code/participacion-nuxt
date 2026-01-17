import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { participations } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const updateParticipationSchema = z.object({
  participated: z.boolean().optional(),
  nonParticipationReasonId: z.string().optional(),
  notes: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // Auth provided by middleware
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const body = await readValidatedBody(event, (b) =>
    updateParticipationSchema.parse(b),
  );

  const [updated] = await db
    .update(participations)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(participations.id, id))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Participation not found' });
  }

  return updated;
});
