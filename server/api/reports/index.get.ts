import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  administrativeUnits,
  employees,
  events,
  nonParticipationReasons,
  participations,
} from '../../database/schema';
import { db } from '../../utils/db';

const querySchema = z.object({
  eventId: z.string(),
  unitId: z.string().optional(),
  status: z
    .enum(['all', 'participated', 'not_participated', 'pending'])
    .default('all'),
});

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const query = await getValidatedQuery(event, (q) => querySchema.parse(q));
  const { eventId, unitId, status } = query;

  // Validate Event belongs to user's company
  const targetEvent = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.companyId, companyId)),
  });

  if (!targetEvent) {
    throw createError({
      statusCode: 404,
      message: 'Event not found or access denied',
    });
  }

  // Build Query
  const baseQuery = db
    .select({
      id: employees.id,
      cedula: employees.cedula,
      firstName: employees.firstName,
      lastName: employees.lastName,
      unitName: administrativeUnits.name,
      participated: participations.participated, // boolean | null
      reason: nonParticipationReasons.name,
      registeredAt: participations.registeredAt,
    })
    .from(employees)
    .leftJoin(
      administrativeUnits,
      eq(employees.administrativeUnitId, administrativeUnits.id),
    )
    .leftJoin(
      participations,
      and(
        eq(employees.id, participations.employeeId),
        eq(participations.eventId, eventId),
      ),
    )
    .leftJoin(
      nonParticipationReasons,
      eq(participations.nonParticipationReasonId, nonParticipationReasons.id),
    )
    .where(
      and(
        eq(employees.companyId, targetEvent.companyId),
        unitId ? eq(employees.administrativeUnitId, unitId) : undefined,
      ),
    );

  const results = await baseQuery;

  // Post-processing filter for 'status'
  return results
    .map((row) => {
      let derivedStatus: 'participated' | 'not_participated' | 'pending' =
        'pending';

      if (row.participated === true) derivedStatus = 'participated';
      if (row.participated === false) derivedStatus = 'not_participated';

      return {
        ...row,
        status: derivedStatus,
      };
    })
    .filter((row) => {
      if (status === 'all') return true;
      return row.status === status;
    });
});
