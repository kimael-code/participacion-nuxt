import { eq } from 'drizzle-orm';
import { events, participations } from '../../database/schema';
import { db } from '../../utils/db';

/**
 * SSE endpoint for real-time dashboard statistics
 * Returns Server-Sent Events with participation stats
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const eventId = query.eventId as string;

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'eventId is required',
    });
  }

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const eventStream = createEventStream(event);

  // Function to fetch and send stats
  const sendStats = async () => {
    try {
      // Get all employees for the company of this event
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
        return;
      }

      const allEmployees = eventData.company.employees;
      const totalEmployees = allEmployees.length;

      // Get participations for this event
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

      // Calculate stats
      const participated = eventParticipations.filter(
        (p) => p.participated,
      ).length;
      const notParticipated = eventParticipations.filter(
        (p) => !p.participated,
      ).length;
      const pending = totalEmployees - participated - notParticipated;

      // Stats by administrative unit
      const unitStats = new Map<
        string,
        {
          unitId: string;
          unitName: string;
          total: number;
          participated: number;
          notParticipated: number;
          pending: number;
        }
      >();

      // Initialize units
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
          const stats = unitStats.get(unitId)!;
          stats.total++;
        }
      });

      // Count participations by unit
      eventParticipations.forEach((p) => {
        if (p.employee.administrativeUnit) {
          const unitId = p.employee.administrativeUnit.id;
          const stats = unitStats.get(unitId);
          if (stats) {
            if (p.participated) {
              stats.participated++;
            } else {
              stats.notParticipated++;
            }
          }
        }
      });

      // Calculate pending for each unit
      unitStats.forEach((stats) => {
        stats.pending =
          stats.total - stats.participated - stats.notParticipated;
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
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Send initial stats
  await sendStats();

  // Send updates every 5 seconds
  const interval = setInterval(sendStats, 5000);

  // Cleanup on close
  eventStream.onClosed(async () => {
    clearInterval(interval);
    await eventStream.close();
  });

  return eventStream.send();
});
