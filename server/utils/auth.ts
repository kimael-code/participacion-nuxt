import { eq } from 'drizzle-orm';
import { userCompanies } from '~~/server/database/schema';
import { db } from './db';

/**
 * Gets the company ID for a user.
 * For Demo/Dev purposes, if no explicit association is found,
 * it falls back to the first available company in the database.
 */
export async function getUserCompanyId(userId: string): Promise<string | null> {
  // Find explicit association
  const association = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, userId),
  });

  return association?.companyId || null;
}
