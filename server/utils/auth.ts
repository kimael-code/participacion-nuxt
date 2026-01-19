import { and, eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { userCompanies } from '../database/schema';
import { db } from './db';

/**
 * Gets the company ID for a user.
 * Prioritizes the 'selected-company-id' cookie if provided.
 * Verifies that the user actually belongs to that company.
 */
export async function getUserCompanyId(
  userId: string,
  event?: H3Event,
): Promise<string | null> {
  const selectedCompanyId = event
    ? getCookie(event, 'selected-company-id')
    : null;

  if (selectedCompanyId) {
    // Verify user belongs to this company
    const association = await db.query.userCompanies.findFirst({
      where: and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.companyId, selectedCompanyId),
      ),
    });
    if (association) return association.companyId;
  }

  // Fallback to first explicit association
  const fallback = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.userId, userId),
  });

  return fallback?.companyId || null;
}
