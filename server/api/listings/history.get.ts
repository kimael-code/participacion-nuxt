import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { csvListings, users } from '../../database/schema';
import { db } from '../../utils/db';

const querySchema = z.object({
  eventId: z.string(),
});

export default defineEventHandler(async (event) => {
  // Auth provided by middleware

  const query = await getValidatedQuery(event, (q) => querySchema.parse(q));

  const results = await db
    .select({
      id: csvListings.id,
      sequenceNumber: csvListings.sequenceNumber,
      listingType: csvListings.listingType, // 'participation' | 'non_participation'
      fileName: csvListings.fileName,
      recordCount: csvListings.recordCount,
      generatedAt: csvListings.generatedAt,
      generatedBy: {
        name: users.name,
        email: users.email,
      },
    })
    .from(csvListings)
    .leftJoin(users, eq(csvListings.generatedBy, users.id))
    .where(eq(csvListings.eventId, query.eventId))
    .orderBy(desc(csvListings.sequenceNumber));

  return results;
});
