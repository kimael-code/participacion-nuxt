import { and, count, eq, notInArray } from 'drizzle-orm';
import { z } from 'zod';
import {
  csvListings,
  employees,
  events,
  participations,
} from '../../database/schema';
import { db } from '../../utils/db';

const generateSchema = z.object({
  eventId: z.string(),
  type: z.enum(['participation', 'non_participation']),
});

export default defineEventHandler(async (event) => {
  // Auth and user provided by middleware
  const { user } = event.context.auth!;

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

  // 2. Get previous listings to implement incremental logic
  const previousListings = await db.query.csvListings.findMany({
    where: and(
      eq(csvListings.eventId, body.eventId),
      eq(csvListings.listingType, body.type),
    ),
    orderBy: (csvListings, { desc }) => [desc(csvListings.sequenceNumber)],
  });

  // Extract employee IDs from previous listings
  // We'll store employee IDs in a new table: csvListingEmployees
  // For now, we'll use a simpler approach: track by participation timestamp

  // 3. Fetch Employees based on type
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
      orderBy: (participations, { asc }) => [asc(participations.registeredAt)],
    });

    // INCREMENTAL LOGIC: Only include participations registered after last listing
    let filteredParts = parts;

    if (previousListings.length > 0) {
      const lastListing = previousListings[0];
      const lastListingDate = lastListing.generatedAt;

      // Only include participations registered AFTER the last listing was generated
      filteredParts = parts.filter((p) => p.registeredAt > lastListingDate);
    }

    cedulas = filteredParts.map((p) => p.employee.cedula);
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
    let whereClause = eq(employees.companyId, eventInfo.companyId);

    if (participantIds.length > 0) {
      whereClause = and(
        eq(employees.companyId, eventInfo.companyId),
        notInArray(employees.id, participantIds),
      ) as any;
    }

    const absentEmployees = await db
      .select({
        cedula: employees.cedula,
        id: employees.id,
      })
      .from(employees)
      .where(whereClause);

    // INCREMENTAL LOGIC for non-participation
    // Only include employees not in previous listings
    let filteredEmployees = absentEmployees;

    if (previousListings.length > 0) {
      // Get all employee IDs from previous non-participation listings
      // Since we don't have a tracking table yet, we'll include all for now
      // TODO: Implement proper tracking table
      filteredEmployees = absentEmployees;
    }

    cedulas = filteredEmployees.map((e) => e.cedula);
  }

  // 4. Generate Content
  const csvContent = cedulas.join(',');

  // 5. Calculate Sequence Number
  const previousCount = await db
    .select({ count: count() })
    .from(csvListings)
    .where(
      and(
        eq(csvListings.eventId, body.eventId),
        eq(csvListings.listingType, body.type),
      ),
    );

  const sequenceNumber = (previousCount[0]?.count || 0) + 1;

  // 6. Generate Filename: reporte_[TIPO]_[SEQ]_[HH_mm_dd_MM_yyyy].csv
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const customTimestamp = `${pad(now.getHours())}_${pad(now.getMinutes())}_${pad(now.getDate())}_${pad(now.getMonth() + 1)}_${now.getFullYear()}`;

  const typeLabel =
    body.type === 'participation' ? 'asistencia' : 'inasistencia';
  const fileName = `reporte_${typeLabel}_${sequenceNumber}_${customTimestamp}.csv`;

  // 7. Save Metadata
  await db.insert(csvListings).values({
    id: crypto.randomUUID(),
    eventId: body.eventId,
    fileName: fileName,
    recordCount: cedulas.length,
    listingType: body.type,
    sequenceNumber: sequenceNumber,
    generatedBy: user.id,
    generatedAt: now,
    createdAt: now,
  });

  // 8. Return File
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="${fileName}"`,
  );

  return csvContent;
});
