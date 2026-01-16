import { asc, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { administrativeUnits } from '~~/server/database/schema';
import { getUserCompanyId } from '~~/server/utils/auth';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    throw createError({ statusCode: 403, message: 'Company context required' });
  }

  const units = await db
    .select()
    .from(administrativeUnits)
    .where(eq(administrativeUnits.companyId, companyId))
    .orderBy(asc(administrativeUnits.name));

  return units;
});
