import { asc, eq } from 'drizzle-orm';
import { administrativeUnits } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const units = await db
    .select()
    .from(administrativeUnits)
    .where(eq(administrativeUnits.companyId, companyId))
    .orderBy(asc(administrativeUnits.name));

  return units;
});
