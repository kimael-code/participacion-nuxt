import { eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { administrativeUnits } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // Get target company ID
  const companyId = await getUserCompanyId(session.user.id);

  if (!companyId) {
    return { units: [], centers: [] };
  }

  const [units, centers] = await Promise.all([
    db.query.administrativeUnits.findMany({
      where: eq(administrativeUnits.companyId, companyId),
      orderBy: (records, { asc }) => [asc(records.name)],
    }),
    db.query.locations.findMany({
      orderBy: (records, { asc }) => [asc(records.name)],
    }),
  ]);

  return { units, centers };
});
