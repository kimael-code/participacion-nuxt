import { and, eq, like, lt } from 'drizzle-orm';
import * as schema from '~/server/database/schema';
import { db } from '~/server/utils/db';

/**
 * Cron job endpoint to clean up demo companies older than 24 hours.
 * This runs daily at 2 AM via Vercel Cron Jobs.
 */
export default defineEventHandler(async (event) => {
  try {
    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find demo companies older than 24 hours
    const demoCompanies = await db.query.companies.findMany({
      where: and(
        like(schema.companies.id, 'demo-comp-%'),
        lt(schema.companies.createdAt, cutoffTime),
      ),
    });

    if (demoCompanies.length === 0) {
      return {
        success: true,
        message: 'No demo companies to clean up',
        deleted: 0,
      };
    }

    // Delete companies (cascade will handle related data)
    const companyIds = demoCompanies.map((c) => c.id);

    for (const companyId of companyIds) {
      await db
        .delete(schema.companies)
        .where(eq(schema.companies.id, companyId));
    }

    console.log(
      `[Cleanup] Deleted ${companyIds.length} demo companies:`,
      companyIds,
    );

    return {
      success: true,
      message: `Cleaned up ${companyIds.length} demo companies`,
      deleted: companyIds.length,
      companyIds,
    };
  } catch (error) {
    console.error('[Cleanup] Error cleaning up demo companies:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
