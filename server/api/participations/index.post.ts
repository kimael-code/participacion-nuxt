import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '~~/server/auth';
import { participations } from '../../database/schema';
import { db } from '../../utils/db';

const participationSchema = z.object({
  employeeId: z.string(),
  eventId: z.string(),
  participated: z.boolean(),
  nonParticipationReasonId: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Register employee participation
 * POST /api/participations
 */
export default defineEventHandler(async (event) => {
  // Get session
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);
  const validatedData = participationSchema.parse(body);
  const userId = session.user.id;

  // Check if participation already exists
  const existing = await db.query.participations.findFirst({
    where: and(
      eq(participations.employeeId, validatedData.employeeId),
      eq(participations.eventId, validatedData.eventId),
    ),
  });

  const now = new Date();

  if (existing) {
    // Update existing participation
    const updated = await db
      .update(participations)
      .set({
        participated: validatedData.participated,
        nonParticipationReasonId: validatedData.nonParticipationReasonId,
        notes: validatedData.notes,
        updatedAt: now,
      })
      .where(eq(participations.id, existing.id))
      .returning();

    return updated[0];
  } else {
    // Create new participation
    const created = await db
      .insert(participations)
      .values({
        id: crypto.randomUUID(),
        employeeId: validatedData.employeeId,
        eventId: validatedData.eventId,
        participated: validatedData.participated,
        nonParticipationReasonId: validatedData.nonParticipationReasonId,
        notes: validatedData.notes,
        registeredBy: userId,
        registeredAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created[0];
  }
});
