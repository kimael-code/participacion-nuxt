import { and, count, eq, notInArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '~/server/auth';
import {
  csvListings,
  employees,
  events,
  participations,
} from '~/server/database/schema';
import { db } from '~/server/utils/db';

const generateSchema = z.object({
  eventId: z.string(),
  type: z.enum(['participation', 'non_participation']),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readValidatedBody(event, (b) => generateSchema.parse(b));

  // 1. Fetch Event Info
  const eventInfo = await db.query.events.findFirst({
    where: eq(events.id, body.eventId),
    with: {
      company: true,
    },
  });

  if (!eventInfo) {
    throw createError({ statusCode: 404, message: 'Event not found' });
  }

  // 2. Fetch Employees based on type
  let cedulas: string[] = [];

  if (body.type === 'participation') {
    // Get all participations for this event
    const parts = await db.query.participations.findMany({
      where: and(
        eq(participations.eventId, body.eventId),
        eq(participations.participated, true),
      ),
      with: {
        employee: true,
      },
    });
    cedulas = parts.map((p) => p.employee.cedula);
  } else {
    // Non-participation: All employees of company MINUS those who participated

    // First get participants ids
    const parts = await db
      .select({ employeeId: participations.employeeId })
      .from(participations)
      .where(
        and(
          eq(participations.eventId, body.eventId),
          eq(participations.participated, true),
        ),
      );

    const participantIds = parts.map((p) => p.employeeId);

    // Fetch employees not in participantIds
    // Note: notInArray requires at least one element. If no participants, fetch all.
    let whereClause = eq(employees.companyId, eventInfo.companyId);

    if (participantIds.length > 0) {
      whereClause = and(
        eq(employees.companyId, eventInfo.companyId),
        notInArray(employees.id, participantIds),
      ) as any;
    }

    const absentEmployees = await db
      .select({ cedula: employees.cedula })
      .from(employees)
      .where(whereClause);

    cedulas = absentEmployees.map((e) => e.cedula);
  }

  // 3. Generate Content
  const csvContent = cedulas.join(',');

  // 4. Calculate Sequence Number
  const previousListings = await db
    .select({ count: count() })
    .from(csvListings)
    .where(eq(csvListings.eventId, body.eventId));

  const sequenceNumber = (previousListings[0]?.count || 0) + 1;

  // 5. Generate Filename: reporte_[TIPO]_[SEQ]_[HH_mm_dd_MM_yyyy].csv
  const now = new Date();
  const timestamp = now
    .toLocaleTimeString('es-VE', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .replace(/[\/:]/g, '_')
    .replace(/, /g, '_')
    .replace(/\s/g, '_');
  // es-VE might give dd/MM/yyyy, HH:mm. Adjust manual formatting to be safe and match user specific format: HH_mm_dd_MM_yyyy

  const pad = (n: number) => n.toString().padStart(2, '0');
  const customTimestamp = `${pad(now.getHours())}_${pad(now.getMinutes())}_${pad(now.getDate())}_${pad(now.getMonth() + 1)}_${now.getFullYear()}`;

  const typeLabel =
    body.type === 'participation' ? 'asistencia' : 'inasistencia';
  const fileName = `reporte_${typeLabel}_${sequenceNumber}_${customTimestamp}.csv`;

  // 6. Save Metadata
  await db.insert(csvListings).values({
    id: crypto.randomUUID(),
    eventId: body.eventId,
    fileName: fileName,
    recordCount: cedulas.length,
    listingType: body.type,
    sequenceNumber: sequenceNumber,
    generatedBy: session.user.id,
    generatedAt: now,
    createdAt: now,
  });

  // 7. Return File
  setResponseHeader(event, 'Content-Type', 'text/csv');
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="${fileName}"`,
  );

  return csvContent;
});
