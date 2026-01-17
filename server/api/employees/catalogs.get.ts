import { eq } from 'drizzle-orm';
import { administrativeUnits } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const units = await db.query.administrativeUnits.findMany({
    where: eq(administrativeUnits.companyId, companyId),
  });

  return {
    units,
  };
});
