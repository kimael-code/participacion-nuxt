import { sql } from 'drizzle-orm';
import * as schema from '../../database/schema';
import { seed } from '../../database/seed';
import { db } from '../../utils/db';

/**
 * Cron job endpoint to reset the entire database for the demo.
 * This runs hourly via Vercel Cron Jobs.
 *
 * Security: Vercel CRON_SECRET is checked automatically if configured,
 * but we also add a manual check just in case.
 */
export default defineEventHandler(async (event) => {
  // Basic security check for Vercel Cron
  // When running on Vercel, it sends an Authorization header
  const authHeader = getRequestHeader(event, 'authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    console.log('[Reset] Starting full database reset...');

    // Tables to clear in order (avoiding FK constraints)
    // Nitro/Drizzle with SQLite doesn't have a TRUNCATE, so we use DELETE
    const tables = [
      schema.participations,
      schema.csvListings,
      schema.events,
      schema.employees,
      schema.administrativeUnits,
      schema.userCompanies,
      schema.locations,
      schema.companies,
      schema.nonParticipationReasons,
      schema.parishes,
      schema.municipalities,
      schema.states,
      schema.rolePermissions,
      schema.roles,
      schema.permissions,
    ];

    // Disable foreign key checks for SQLite if needed (though cascade often handles it)
    await db.run(sql`PRAGMA foreign_keys = OFF`);

    for (const table of tables) {
      await db.delete(table);
    }

    await db.run(sql`PRAGMA foreign_keys = ON`);

    console.log('[Reset] Tables cleared. Starting seed...');

    // Run the seed function
    // Pass 'true' if we want to bypass some checks
    await seed(true);

    console.log('[Reset] Database reset successfully completed.');

    return {
      success: true,
      message: 'Database reset successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Reset] Error resetting database:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
