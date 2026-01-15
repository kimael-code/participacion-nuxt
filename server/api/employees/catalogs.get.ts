import { eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { administrativeUnits, userCompanies } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // Get user's company
  const userCompany = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, session.user.id),
  });

  if (!userCompany) {
    return { units: [], centers: [] };
  }

  const [units, centers] = await Promise.all([
    db.query.administrativeUnits.findMany({
      where: eq(administrativeUnits.companyId, userCompany.companyId),
      orderBy: (records, { asc }) => [asc(records.name)],
    }),
    db.query.votingCenters.findMany({
      orderBy: (records, { asc }) => [asc(records.name)],
    }),
  ]);

  return { units, centers };
});
