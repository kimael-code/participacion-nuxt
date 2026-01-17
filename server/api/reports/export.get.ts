import * as schema from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const { employees } = schema;

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const query = getQuery(event);
  const eventId = query.eventId as string;

  if (!eventId) {
    throw createError({ statusCode: 400, message: 'Event ID is required' });
  }

  // Fetch participations for the event, filtered by user's company
  const results = await db.query.participations.findMany({
    where: (participations, { eq, and, exists }) =>
      and(
        eq(participations.eventId, eventId),
        exists(
          db
            .select()
            .from(employees)
            .where(
              and(
                eq(employees.id, participations.employeeId),
                eq(employees.companyId, companyId),
              ),
            ),
        ),
      ),
    with: {
      employee: {
        with: {
          administrativeUnit: true,
        },
      },
      nonParticipationReason: true,
    },
  });

  // Generate CSV
  const headers = [
    'Cedula',
    'Nombre',
    'Apellido',
    'Unidad',
    'Participo',
    'Motivo de Falta',
    'Notas',
    'Fecha Registro',
  ];
  const rows = results.map((p) => [
    p.employee?.cedula || '',
    p.employee?.firstName || '',
    p.employee?.lastName || '',
    p.employee?.administrativeUnit?.name || 'N/A',
    p.participated ? 'SI' : 'NO',
    p.nonParticipationReason?.name || '',
    p.notes || '',
    p.registeredAt ? new Date(p.registeredAt).toLocaleString() : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n');

  // Set headers for file download
  setResponseHeaders(event, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="reporte_participacion_${eventId}.csv"`,
  });

  return csvContent;
});
