import { and, eq } from 'drizzle-orm';
import { auth } from '~~/server/auth';
import { companies, userCompanies } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'Company ID required' });
  }

  // Check if user is admin of this company
  // Or check if user is SUPER ADMIN (not implemented yet, assuming company admin can delete their company)
  const userAccess = await db
    .select()
    .from(userCompanies)
    .where(
      and(
        eq(userCompanies.companyId, id),
        eq(userCompanies.userId, session.user.id),
        eq(userCompanies.role, 'admin'),
      ),
    )
    .limit(1);

  if (userAccess.length === 0) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  await db.delete(companies).where(eq(companies.id, id));

  return { success: true };
});
