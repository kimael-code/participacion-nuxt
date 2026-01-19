import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  employees,
  nonParticipationReasons,
  participations,
} from '../../database/schema';
import { db } from '../../utils/db';

const querySchema = z.object({
  eventId: z.string(),
  limit: z.coerce.number().default(10),
});

export default defineEventHandler(async (event) => {
  // Auth provided by middleware

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
    .orderBy(desc(participations.registeredAt))
    .limit(query.limit);

  return results;
});
