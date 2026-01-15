import { eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import * as schema from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const { userCompanies, employees } = schema;

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const query = getQuery(event);
  const eventId = query.eventId as string;

  if (!eventId) {
    throw createError({ statusCode: 400, message: 'Event ID is required' });
  }

  // Verify company access
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
    throw createError({ statusCode: 403, message: 'Unauthorized' });
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
                eq(employees.companyId, userCompany.companyId),
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

  // Generate CSV manually for simplicity (no extra library needed for simple CSV)
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
