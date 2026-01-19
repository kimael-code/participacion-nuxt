import { desc, eq } from 'drizzle-orm';
import { events, participations } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const { companyId } = event.context.auth!;
  const query = getQuery(event);
  const limit = Number(query.limit) || 10;

  // Get recent participations for all events of the company
  const recentParticipations = await db
    .select({
      id: participations.id,
      participated: participations.participated,
      registeredAt: participations.registeredAt,
      notes: participations.notes,
      employeeId: participations.employeeId,
      eventId: participations.eventId,
      nonParticipationReasonId: participations.nonParticipationReasonId,
    })
    .from(participations)
    .innerJoin(events, eq(participations.eventId, events.id))
    .where(eq(events.companyId, companyId))
    .orderBy(desc(participations.registeredAt))
    .limit(limit);

  // Fetch related data for each participation
  const enrichedParticipations = await Promise.all(
    recentParticipations.map(async (p) => {
      const participation = await db.query.participations.findFirst({
        where: eq(participations.id, p.id),
        with: {
          employee: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              cedula: true,
            },
          },
          event: {
            columns: {
              id: true,
              name: true,
            },
          },
          nonParticipationReason: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });
      return participation;
    }),
  );

  return enrichedParticipations;
});
