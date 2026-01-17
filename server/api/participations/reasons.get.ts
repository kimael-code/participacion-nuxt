import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Auth provided by middleware

  const reasons = await db.query.nonParticipationReasons.findMany({
    orderBy: (records, { asc }) => [asc(records.name)],
  });

  return reasons;
});
