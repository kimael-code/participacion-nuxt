import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '~~/server/auth';
import { companies, userCompanies } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const updateCompanySchema = z.object({
  name: z.string().min(3).optional(),
  rif: z.string().optional(),
  logo: z.string().optional(),
});

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

  const body = await readValidatedBody(event, (b) =>
    updateCompanySchema.parse(b),
  );

  try {
    const [updated] = await db
      .update(companies)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();

    return updated;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Duplicate RIF or Name',
      });
    }
    throw error;
  }
});
