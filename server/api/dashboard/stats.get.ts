import { eq } from 'drizzle-orm';
import { auth } from '../../auth';
import { events, participations } from '../../database/schema';
import { getUserCompanyId } from '../../utils/auth';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const eventId = query.eventId as string;

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'eventId is required',
    });
  }

  // 1. Manual Auth Check for SSE
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    console.error('[SSE] Unauthorized access attempt');
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // 2. Manual Company Check
  const companyId = await getUserCompanyId(session.user.id, event);
  if (!companyId) {
    console.error(`[SSE] User ${session.user.id} has no company context`);
    throw createError({
      statusCode: 403,
      message: 'No company access',
    });
  }

  console.log(
    `[SSE] Connection established for Event: ${eventId}, User: ${session.user.id}, Company: ${companyId}`,
  );

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering for Nginx
  });

  const eventStream = createEventStream(event);

  const sendStats = async () => {
    try {
      const eventData = await db.query.events.findFirst({
        where: eq(events.id, eventId),
        with: {
          company: {
            with: {
              employees: {
                with: {
                  administrativeUnit: true,
                },
              },
            },
          },
        },
      });

      if (!eventData) {
        console.warn(`[SSE] Event ${eventId} not found`);
        return;
      }

      // Verify that the event belongs to the users' company context (security)
      if (eventData.companyId !== companyId) {
        console.error(
          `[SSE] Security breach: User ${session.user.id} tried to access event ${eventId} from company ${eventData.companyId}`,
        );
        await eventStream.push(JSON.stringify({ error: 'Forbidden' }));
        return;
      }

      const allEmployees = eventData.company.employees || [];
      const totalEmployees = allEmployees.length;

      const eventParticipations = await db.query.participations.findMany({
        where: eq(participations.eventId, eventId),
        with: {
          employee: {
            with: {
              administrativeUnit: true,
            },
          },
        },
      });

      const participated = eventParticipations.filter(
        (p) => p.participated,
      ).length;
      const notParticipated = eventParticipations.filter(
        (p) => !p.participated,
      ).length;
      const pending = totalEmployees - participated - notParticipated;

      const unitStats = new Map<string, any>();

      allEmployees.forEach((emp) => {
        if (emp.administrativeUnit) {
          const unitId = emp.administrativeUnit.id;
          if (!unitStats.has(unitId)) {
            unitStats.set(unitId, {
              unitId,
              unitName: emp.administrativeUnit.name,
              total: 0,
              participated: 0,
              notParticipated: 0,
              pending: 0,
            });
          }
          const s = unitStats.get(unitId)!;
          s.total++;
        }
      });

      eventParticipations.forEach((p) => {
        if (p.employee?.administrativeUnit) {
          const unitId = p.employee.administrativeUnit.id;
          const s = unitStats.get(unitId);
          if (s) {
            if (p.participated) s.participated++;
            else s.notParticipated++;
          }
        }
      });

      unitStats.forEach((s) => {
        s.pending = s.total - s.participated - s.notParticipated;
      });

      const data = {
        timestamp: new Date().toISOString(),
        overall: {
          total: totalEmployees,
          participated,
          notParticipated,
          pending,
          participationRate:
            totalEmployees > 0 ? (participated / totalEmployees) * 100 : 0,
        },
        byUnit: Array.from(unitStats.values()),
      };

      await eventStream.push(JSON.stringify(data));
    } catch (err) {
      console.error('[SSE] Error sending stats:', err);
    }
  };

  // Run immediately and then start interval
  sendStats();
  const interval = setInterval(sendStats, 5000);

  eventStream.onClosed(async () => {
    console.log(`[SSE] Connection closed for user ${session.user.id}`);
    clearInterval(interval);
    await eventStream.close();
  });

  return eventStream.send();
});
