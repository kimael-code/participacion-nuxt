import { eq } from 'drizzle-orm';
import { auth } from '../../auth';
import { companies, userCompanies } from '../../database/schema';
import { db } from '../../utils/db';

/**
 * GET /api/companies
 * Obtener empresas del usuario autenticado
 */
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    });
  }

  // Obtener empresas del usuario
  const userCompaniesData = await db
    .select({
      id: companies.id,
      name: companies.name,
      rif: companies.rif,
      logo: companies.logo,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
    })
    .from(companies)
    .innerJoin(userCompanies, eq(companies.id, userCompanies.companyId))
    .where(eq(userCompanies.userId, session.user.id));

  return userCompaniesData;
});
