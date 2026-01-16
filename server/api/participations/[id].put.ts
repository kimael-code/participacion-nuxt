import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '~~/server/auth';
import { participations } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const updateParticipationSchema = z.object({
  participated: z.boolean().optional(),
  nonParticipationReasonId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const body = await readValidatedBody(event, (b) =>
    updateParticipationSchema.parse(b),
  );

  // We update the record. We don't change employeeId or eventId as that would be a different record conceptually.
  // If they need to change employee/event, they should delete and re-create.

  const [updated] = await db
    .update(participations)
    .set({
      ...body,
      // If switching to participated=true, clear reason
      nonParticipationReasonId:
        body.participated === true ? null : body.nonParticipationReasonId,
      updatedAt: new Date(),
    })
    .where(eq(participations.id, id))
    .returning();

  if (!updated) {
    throw createError({
      statusCode: 404,
      message: 'Participation not found',
    });
  }

  return updated;
});
