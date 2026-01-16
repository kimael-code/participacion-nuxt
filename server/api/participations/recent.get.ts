import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '~~/server/auth';
import {
  employees,
  nonParticipationReasons,
  participations,
} from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const querySchema = z.object({
  eventId: z.string(),
  limit: z.coerce.number().default(10), // Default 10 recent items
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const query = await getValidatedQuery(event, (q) => querySchema.parse(q));

  const results = await db
    .select({
      id: participations.id,
      participated: participations.participated,
      registeredAt: participations.registeredAt,
      employee: {
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        cedula: employees.cedula,
      },
      reason: {
        id: nonParticipationReasons.id,
        name: nonParticipationReasons.name,
      },
      notes: participations.notes,
    })
    .from(participations)
    .innerJoin(employees, eq(participations.employeeId, employees.id))
    .leftJoin(
      nonParticipationReasons,
      eq(participations.nonParticipationReasonId, nonParticipationReasons.id),
    )
    .where(eq(participations.eventId, query.eventId))
    .orderBy(desc(participations.registeredAt)) // Most recent first
    .limit(query.limit);

  return results;
});
